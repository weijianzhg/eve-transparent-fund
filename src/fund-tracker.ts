/**
 * FundTracker - Core module for tracking donations, allocations, and impact proofs
 * 
 * All data is stored in a simple JSON file for transparency.
 * In production, this would be backed by on-chain data.
 */

import { 
  Donation, 
  Allocation, 
  ProofOfImpact, 
  FundSummary, 
  AuditEntry 
} from './types';

export class FundTracker {
  private donations: Map<string, Donation> = new Map();
  private allocations: Map<string, Allocation> = new Map();
  private proofs: Map<string, ProofOfImpact> = new Map();
  private dataPath: string;

  constructor(dataPath: string = './data/fund-data.json') {
    this.dataPath = dataPath;
  }

  // Record a new donation
  recordDonation(donation: Omit<Donation, 'id'>): Donation {
    const id = `don_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullDonation: Donation = { ...donation, id };
    this.donations.set(id, fullDonation);
    return fullDonation;
  }

  // Record an allocation to a recipient
  recordAllocation(allocation: Omit<Allocation, 'id'>): Allocation {
    const id = `alloc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullAllocation: Allocation = { ...allocation, id };
    this.allocations.set(id, fullAllocation);
    return fullAllocation;
  }

  // Submit proof of impact for an allocation
  submitProof(proof: Omit<ProofOfImpact, 'id' | 'verified'>): ProofOfImpact {
    const id = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullProof: ProofOfImpact = { ...proof, id, verified: false };
    this.proofs.set(id, fullProof);
    return fullProof;
  }

  // Verify a proof of impact
  verifyProof(proofId: string): boolean {
    const proof = this.proofs.get(proofId);
    if (proof) {
      proof.verified = true;
      return true;
    }
    return false;
  }

  // Get fund summary
  getSummary(currency: 'SOL' | 'USDC' = 'SOL'): FundSummary {
    let totalReceived = 0;
    let totalAllocated = 0;

    for (const donation of this.donations.values()) {
      if (donation.currency === currency) {
        totalReceived += donation.amount;
      }
    }

    for (const allocation of this.allocations.values()) {
      if (allocation.currency === currency) {
        totalAllocated += allocation.amount;
      }
    }

    return {
      totalReceived,
      totalAllocated,
      totalRemaining: totalReceived - totalAllocated,
      donationCount: this.donations.size,
      allocationCount: this.allocations.size,
      proofsSubmitted: this.proofs.size,
      currency
    };
  }

  // Get full audit trail
  getAuditTrail(): AuditEntry[] {
    const entries: AuditEntry[] = [];

    for (const donation of this.donations.values()) {
      entries.push({ type: 'donation', data: donation, timestamp: donation.timestamp });
    }

    for (const allocation of this.allocations.values()) {
      entries.push({ type: 'allocation', data: allocation, timestamp: allocation.timestamp });
    }

    for (const proof of this.proofs.values()) {
      entries.push({ type: 'proof', data: proof, timestamp: proof.timestamp });
    }

    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Get all donations
  getDonations(): Donation[] {
    return Array.from(this.donations.values());
  }

  // Get all allocations
  getAllocations(): Allocation[] {
    return Array.from(this.allocations.values());
  }

  // Get proofs for a specific allocation
  getProofsForAllocation(allocationId: string): ProofOfImpact[] {
    return Array.from(this.proofs.values())
      .filter(p => p.allocationId === allocationId);
  }

  // Trace a donation to its outcomes
  traceDonation(donationId: string): {
    donation: Donation | undefined;
    allocations: Allocation[];
    proofs: ProofOfImpact[];
  } {
    const donation = this.donations.get(donationId);
    const allocations = Array.from(this.allocations.values())
      .filter(a => a.donationIds.includes(donationId));
    const allocationIds = allocations.map(a => a.id);
    const proofs = Array.from(this.proofs.values())
      .filter(p => allocationIds.includes(p.allocationId));

    return { donation, allocations, proofs };
  }

  // Export all data as JSON (for transparency)
  exportData(): string {
    return JSON.stringify({
      donations: Array.from(this.donations.values()),
      allocations: Array.from(this.allocations.values()),
      proofs: Array.from(this.proofs.values()),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}
