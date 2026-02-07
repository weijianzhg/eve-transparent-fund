import { describe, it, expect, beforeEach } from 'vitest';
import { TransparentFund } from './index';

describe('TransparentFund', () => {
  let fund: TransparentFund;

  beforeEach(() => {
    fund = new TransparentFund();
  });

  it('should create fund with tracker and verifier', () => {
    expect(fund.tracker).toBeDefined();
    expect(fund.verifier).toBeDefined();
  });

  it('should track donations via tracker directly', () => {
    const donation = fund.tracker.recordDonation({
      txHash: 'test_tx_001',
      from: 'donor_wallet',
      amount: 1.5,
      currency: 'SOL',
      timestamp: new Date(),
      memo: 'Test donation'
    });

    expect(donation.id).toMatch(/^don_/);
    expect(donation.amount).toBe(1.5);
    expect(donation.currency).toBe('SOL');
  });

  it('should track allocations', () => {
    const donation = fund.tracker.recordDonation({
      txHash: 'test_tx_001',
      from: 'donor_wallet',
      amount: 1.0,
      currency: 'SOL',
      timestamp: new Date()
    });

    const allocation = fund.tracker.recordAllocation({
      txHash: 'test_tx_002',
      to: 'recipient_wallet',
      recipientName: 'Test Recipient',
      amount: 0.5,
      currency: 'SOL',
      purpose: 'Test purpose',
      timestamp: new Date(),
      donationIds: [donation.id]
    });

    expect(allocation.id).toMatch(/^alloc_/);
    expect(allocation.donationIds).toContain(donation.id);
  });

  it('should submit and track proofs of impact', () => {
    const allocation = fund.tracker.recordAllocation({
      txHash: 'test_tx_002',
      to: 'recipient_wallet',
      recipientName: 'Test Recipient',
      amount: 0.5,
      currency: 'SOL',
      purpose: 'Test purpose',
      timestamp: new Date(),
      donationIds: []
    });

    const proof = fund.submitProofOfImpact(
      allocation.id,
      'recipient_wallet',
      'Completed the task',
      ['https://example.com/proof.jpg']
    );

    expect(proof.id).toMatch(/^proof_/);
    expect(proof.allocationId).toBe(allocation.id);
    expect(proof.verified).toBe(false);
  });

  it('should calculate summary correctly', () => {
    fund.tracker.recordDonation({
      txHash: 'tx1',
      from: 'donor1',
      amount: 2.0,
      currency: 'SOL',
      timestamp: new Date()
    });

    fund.tracker.recordDonation({
      txHash: 'tx2',
      from: 'donor2',
      amount: 1.5,
      currency: 'SOL',
      timestamp: new Date()
    });

    fund.tracker.recordAllocation({
      txHash: 'tx3',
      to: 'recipient',
      recipientName: 'Recipient',
      amount: 1.0,
      currency: 'SOL',
      purpose: 'Purpose',
      timestamp: new Date(),
      donationIds: []
    });

    const summary = fund.getSummary();
    
    expect(summary.sol.received).toBe(3.5);
    expect(summary.sol.allocated).toBe(1.0);
    expect(summary.sol.remaining).toBe(2.5);
    expect(summary.donations).toBe(2);
    expect(summary.allocations).toBe(1);
  });

  it('should generate audit trail markdown', () => {
    fund.tracker.recordDonation({
      txHash: 'tx1',
      from: 'donor1',
      amount: 1.0,
      currency: 'SOL',
      timestamp: new Date()
    });

    const markdown = fund.getAuditTrailMarkdown();
    
    expect(markdown).toContain('Audit Trail');
    expect(markdown).toContain('Donation Received');
    expect(markdown).toContain('tx1');
  });

  it('should trace donation to outcomes', () => {
    const donation = fund.tracker.recordDonation({
      txHash: 'tx1',
      from: 'donor',
      amount: 1.0,
      currency: 'SOL',
      timestamp: new Date()
    });

    const allocation = fund.tracker.recordAllocation({
      txHash: 'tx2',
      to: 'recipient',
      recipientName: 'Recipient',
      amount: 0.5,
      currency: 'SOL',
      purpose: 'Purpose',
      timestamp: new Date(),
      donationIds: [donation.id]
    });

    const trace = fund.tracker.traceDonation(donation.id);
    
    expect(trace.donation).toBeDefined();
    expect(trace.allocations).toHaveLength(1);
    expect(trace.allocations[0].id).toBe(allocation.id);
  });
});
