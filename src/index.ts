/**
 * Eve Transparent Fund
 * 
 * An AI agent that manages transparent micro-grants on Solana.
 * Every donation tracked. Every impact documented.
 */

import { FundTracker } from './fund-tracker';
import { WalletManager } from './wallet';
import { ChainVerifier } from './chain-verifier';

export { FundTracker } from './fund-tracker';
export { WalletManager, type Balance } from './wallet';
export { ChainVerifier, type VerifiedTransaction } from './chain-verifier';
export * from './types';

// Main class that combines tracking and wallet operations
export class TransparentFund {
  public tracker: FundTracker;
  public wallet: WalletManager | null = null;
  public verifier: ChainVerifier;
  private network: 'devnet' | 'mainnet';

  constructor(dataPath?: string, network: 'devnet' | 'mainnet' = 'devnet') {
    this.tracker = new FundTracker(dataPath);
    this.verifier = new ChainVerifier(network);
    this.network = network;
  }

  // Initialize with wallet
  async connectWallet(): Promise<void> {
    this.wallet = await WalletManager.fromConfigFile();
    console.log(`Wallet connected: ${this.wallet.getAddress()}`);
  }

  // Get the fund's receiving address
  getAddress(): string {
    if (!this.wallet) throw new Error('Wallet not connected');
    return this.wallet.getAddress();
  }

  // Check fund balance
  async getBalance() {
    if (!this.wallet) throw new Error('Wallet not connected');
    return this.wallet.getBalances();
  }

  // Process an incoming donation with on-chain verification
  async recordIncomingDonation(
    txHash: string,
    expectedFrom?: string,
    expectedAmount?: number,
    currency: 'SOL' | 'USDC' = 'SOL',
    memo?: string
  ) {
    // Verify on-chain first
    const verified = await this.verifier.verifyTransaction(txHash);
    if (!verified) {
      throw new Error(`Transaction ${txHash} not found or failed on-chain`);
    }

    // Use on-chain data as source of truth
    const donation = this.tracker.recordDonation({
      txHash,
      from: verified.from,
      amount: verified.amount,
      currency: verified.currency,
      timestamp: verified.timestamp,
      memo
    });
    
    console.log(`Verified & recorded donation ${donation.id}: ${verified.amount} ${verified.currency} from ${verified.from}`);
    return { donation, verified };
  }

  // Allocate funds to a recipient
  async allocateFunds(
    recipientAddress: string,
    recipientName: string,
    amount: number,
    currency: 'SOL' | 'USDC',
    purpose: string,
    donationIds: string[]
  ) {
    if (!this.wallet) throw new Error('Wallet not connected');

    // Execute the transfer
    let result;
    if (currency === 'SOL') {
      result = await this.wallet.transferSol(recipientAddress, amount, 'devnet');
    } else {
      result = await this.wallet.transferUsdc(recipientAddress, amount, 'devnet');
    }

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.error}`);
    }

    // Record the allocation
    const allocation = this.tracker.recordAllocation({
      txHash: result.txHash!,
      to: recipientAddress,
      recipientName,
      amount,
      currency,
      purpose,
      timestamp: new Date(),
      donationIds
    });

    console.log(`Allocated ${amount} ${currency} to ${recipientName}: ${purpose}`);
    return allocation;
  }

  // Submit proof of impact
  submitProofOfImpact(
    allocationId: string,
    recipientAddress: string,
    description: string,
    evidenceLinks: string[]
  ) {
    const proof = this.tracker.submitProof({
      allocationId,
      recipientAddress,
      description,
      evidenceLinks,
      timestamp: new Date()
    });
    console.log(`Proof submitted for allocation ${allocationId}`);
    return proof;
  }

  // Get human-readable fund summary
  getSummary() {
    const sol = this.tracker.getSummary('SOL');
    const usdc = this.tracker.getSummary('USDC');
    
    return {
      sol: {
        received: sol.totalReceived,
        allocated: sol.totalAllocated,
        remaining: sol.totalRemaining
      },
      usdc: {
        received: usdc.totalReceived,
        allocated: usdc.totalAllocated,
        remaining: usdc.totalRemaining
      },
      donations: sol.donationCount,
      allocations: sol.allocationCount,
      proofs: sol.proofsSubmitted
    };
  }

  // Get full audit trail as markdown
  getAuditTrailMarkdown(): string {
    const trail = this.tracker.getAuditTrail();
    let md = '# Eve Transparent Fund - Audit Trail\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (trail.length === 0) {
      md += '*No transactions yet*\n';
      return md;
    }

    for (const entry of trail) {
      md += `## ${entry.timestamp.toISOString()}\n\n`;
      
      if (entry.type === 'donation') {
        const d = entry.data as any;
        md += `**Donation Received**\n`;
        md += `- From: \`${d.from}\`\n`;
        md += `- Amount: ${d.amount} ${d.currency}\n`;
        md += `- TX: \`${d.txHash}\`\n`;
        if (d.memo) md += `- Memo: ${d.memo}\n`;
      }
      
      if (entry.type === 'allocation') {
        const a = entry.data as any;
        md += `**Funds Allocated**\n`;
        md += `- To: ${a.recipientName} (\`${a.to}\`)\n`;
        md += `- Amount: ${a.amount} ${a.currency}\n`;
        md += `- Purpose: ${a.purpose}\n`;
        md += `- TX: \`${a.txHash}\`\n`;
      }
      
      if (entry.type === 'proof') {
        const p = entry.data as any;
        md += `**Proof of Impact**\n`;
        md += `- For Allocation: \`${p.allocationId}\`\n`;
        md += `- Description: ${p.description}\n`;
        md += `- Evidence: ${p.evidenceLinks.join(', ')}\n`;
        md += `- Verified: ${p.verified ? '✅' : '⏳'}\n`;
      }
      
      md += '\n---\n\n';
    }
    
    return md;
  }
}

// CLI entry point
async function main() {
  const fund = new TransparentFund();
  
  console.log('Eve Transparent Fund 🦋');
  console.log('========================\n');
  
  try {
    await fund.connectWallet();
    const balance = await fund.getBalance();
    console.log(`\nBalance: ${balance.sol} SOL, ${balance.usdc} USDC`);
    console.log(`\nAddress: ${fund.getAddress()}`);
    console.log('\nReady to receive donations!');
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
