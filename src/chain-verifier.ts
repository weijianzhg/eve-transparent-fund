/**
 * On-chain transaction verification
 * 
 * Verifies donations and allocations by checking actual Solana transactions
 */

import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface VerifiedTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  timestamp: Date;
  confirmed: boolean;
  slot: number;
}

// Known USDC mint on devnet and mainnet
const USDC_MINTS = {
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};

export class ChainVerifier {
  private connection: Connection;
  private network: 'devnet' | 'mainnet';

  constructor(network: 'devnet' | 'mainnet' = 'devnet') {
    this.network = network;
    const rpcUrl = network === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Verify a transaction exists and extract details
   */
  async verifyTransaction(txHash: string): Promise<VerifiedTransaction | null> {
    try {
      const tx = await this.connection.getParsedTransaction(txHash, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta || tx.meta.err) {
        return null;
      }

      // Try to extract transfer details
      const transfer = this.extractTransferDetails(tx);
      if (!transfer) return null;

      return {
        txHash,
        from: transfer.from,
        to: transfer.to,
        amount: transfer.amount,
        currency: transfer.currency,
        timestamp: new Date((tx.blockTime || 0) * 1000),
        confirmed: true,
        slot: tx.slot
      };
    } catch (error) {
      console.error(`Failed to verify transaction ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Extract transfer details from a parsed transaction
   */
  private extractTransferDetails(tx: ParsedTransactionWithMeta): {
    from: string;
    to: string;
    amount: number;
    currency: 'SOL' | 'USDC';
  } | null {
    const instructions = tx.transaction.message.instructions;

    for (const ix of instructions) {
      // Check for native SOL transfer
      if ('parsed' in ix && ix.program === 'system') {
        if (ix.parsed.type === 'transfer') {
          return {
            from: ix.parsed.info.source,
            to: ix.parsed.info.destination,
            amount: ix.parsed.info.lamports / 1e9, // Convert lamports to SOL
            currency: 'SOL'
          };
        }
      }

      // Check for SPL token transfer (USDC)
      if ('parsed' in ix && ix.program === 'spl-token') {
        if (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked') {
          const info = ix.parsed.info;
          // Check if it's USDC by looking at the mint
          const mint = info.mint || '';
          const usdcMint = USDC_MINTS[this.network];
          
          if (mint === usdcMint || this.isLikelyUsdc(info)) {
            const amount = info.tokenAmount?.uiAmount || info.amount / 1e6;
            return {
              from: info.authority || info.source,
              to: info.destination,
              amount,
              currency: 'USDC'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Heuristic check for USDC (6 decimals)
   */
  private isLikelyUsdc(info: any): boolean {
    const decimals = info.tokenAmount?.decimals;
    return decimals === 6;
  }

  /**
   * Watch for incoming transactions to an address
   */
  async getRecentTransactions(
    address: string,
    limit: number = 10
  ): Promise<VerifiedTransaction[]> {
    try {
      const pubkey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
      
      const transactions: VerifiedTransaction[] = [];
      
      for (const sig of signatures) {
        const verified = await this.verifyTransaction(sig.signature);
        if (verified && verified.to === address) {
          transactions.push(verified);
        }
      }
      
      return transactions;
    } catch (error) {
      console.error(`Failed to get transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Check if a donation matches what's on-chain
   */
  async verifyDonation(
    txHash: string,
    expectedTo: string,
    expectedAmount: number,
    expectedCurrency: 'SOL' | 'USDC'
  ): Promise<{ valid: boolean; reason?: string; actual?: VerifiedTransaction }> {
    const tx = await this.verifyTransaction(txHash);
    
    if (!tx) {
      return { valid: false, reason: 'Transaction not found or failed' };
    }

    if (tx.to !== expectedTo) {
      return { valid: false, reason: `Wrong recipient: expected ${expectedTo}, got ${tx.to}`, actual: tx };
    }

    if (tx.currency !== expectedCurrency) {
      return { valid: false, reason: `Wrong currency: expected ${expectedCurrency}, got ${tx.currency}`, actual: tx };
    }

    // Allow 1% tolerance for rounding
    const tolerance = expectedAmount * 0.01;
    if (Math.abs(tx.amount - expectedAmount) > tolerance) {
      return { valid: false, reason: `Amount mismatch: expected ${expectedAmount}, got ${tx.amount}`, actual: tx };
    }

    return { valid: true, actual: tx };
  }
}
