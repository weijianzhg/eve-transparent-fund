/**
 * Wallet integration via AgentWallet API
 * 
 * Handles actual Solana transactions for the transparent fund
 */

interface AgentWalletConfig {
  username: string;
  apiToken: string;
  solanaAddress: string;
  baseUrl: string;
}

interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface Balance {
  sol: number;
  usdc: number;
}

export class WalletManager {
  private config: AgentWalletConfig;

  constructor(config: AgentWalletConfig) {
    this.config = config;
  }

  // Load config from ~/.agentwallet/config.json
  static async fromConfigFile(): Promise<WalletManager> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const configPath = path.join(os.homedir(), '.agentwallet', 'config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return new WalletManager({
      username: config.username,
      apiToken: config.apiToken,
      solanaAddress: config.solanaAddress,
      baseUrl: 'https://agentwallet.mcpay.tech/api'
    });
  }

  // Get wallet address
  getAddress(): string {
    return this.config.solanaAddress;
  }

  // Check balances
  async getBalances(): Promise<Balance> {
    const response = await fetch(
      `${this.config.baseUrl}/wallets/${this.config.username}/balances`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get balances: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse balances from response
    // AgentWallet returns balances in smallest units
    return {
      sol: (data.solana?.sol || 0) / 1e9,
      usdc: (data.solana?.usdc || 0) / 1e6
    };
  }

  // Transfer SOL to a recipient
  async transferSol(to: string, amount: number, network: 'mainnet' | 'devnet' = 'devnet'): Promise<TransferResult> {
    const lamports = Math.floor(amount * 1e9).toString();
    
    const response = await fetch(
      `${this.config.baseUrl}/wallets/${this.config.username}/actions/transfer-solana`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          amount: lamports,
          asset: 'sol',
          network
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || response.statusText };
    }

    return { success: true, txHash: data.txHash };
  }

  // Transfer USDC to a recipient
  async transferUsdc(to: string, amount: number, network: 'mainnet' | 'devnet' = 'devnet'): Promise<TransferResult> {
    const units = Math.floor(amount * 1e6).toString();
    
    const response = await fetch(
      `${this.config.baseUrl}/wallets/${this.config.username}/actions/transfer-solana`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          amount: units,
          asset: 'usdc',
          network
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || response.statusText };
    }

    return { success: true, txHash: data.txHash };
  }

  // Request devnet SOL from faucet (rate limited: 3 per 24h)
  async requestDevnetFaucet(): Promise<TransferResult> {
    const response = await fetch(
      `${this.config.baseUrl}/wallets/${this.config.username}/actions/faucet-sol`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || response.statusText };
    }

    return { success: true, txHash: data.txHash };
  }
}
