/**
 * Core types for Eve Transparent Fund
 */

// A donation received into the fund
export interface Donation {
  id: string;
  txHash: string;
  from: string; // donor wallet address
  amount: number; // in lamports or smallest unit
  currency: 'SOL' | 'USDC';
  timestamp: Date;
  memo?: string; // optional donor message
}

// An allocation from the fund to a recipient
export interface Allocation {
  id: string;
  txHash: string;
  to: string; // recipient wallet address
  recipientName: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  purpose: string; // what the funds are for
  timestamp: Date;
  donationIds: string[]; // which donations funded this
}

// Proof of impact submitted by a recipient
export interface ProofOfImpact {
  id: string;
  allocationId: string;
  recipientAddress: string;
  description: string;
  evidenceLinks: string[]; // URLs to photos, documents, etc.
  timestamp: Date;
  verified: boolean; // whether the agent has verified the proof
}

// Summary of the fund's current state
export interface FundSummary {
  totalReceived: number;
  totalAllocated: number;
  totalRemaining: number;
  donationCount: number;
  allocationCount: number;
  proofsSubmitted: number;
  currency: 'SOL' | 'USDC';
}

// A complete audit trail entry
export interface AuditEntry {
  type: 'donation' | 'allocation' | 'proof';
  data: Donation | Allocation | ProofOfImpact;
  timestamp: Date;
}
