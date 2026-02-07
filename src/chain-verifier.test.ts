import { describe, it, expect } from 'vitest';
import { ChainVerifier } from './chain-verifier';

describe('ChainVerifier', () => {
  const verifier = new ChainVerifier('devnet');

  it('should create verifier for devnet', () => {
    expect(verifier).toBeDefined();
  });

  it('should return null for non-existent transaction', async () => {
    const result = await verifier.verifyTransaction('invalid-tx-hash');
    expect(result).toBeNull();
  });

  // This test uses a real devnet transaction - skip if we don't have one
  it.skip('should verify a real SOL transfer', async () => {
    // Replace with an actual devnet tx hash when testing
    const txHash = 'YOUR_DEVNET_TX_HASH';
    const result = await verifier.verifyTransaction(txHash);
    
    expect(result).not.toBeNull();
    expect(result?.confirmed).toBe(true);
    expect(result?.currency).toBe('SOL');
  });
});

describe('ChainVerifier.verifyDonation', () => {
  const verifier = new ChainVerifier('devnet');
  
  it('should reject non-existent transaction', async () => {
    const result = await verifier.verifyDonation(
      'fake-tx',
      'fake-address',
      1.0,
      'SOL'
    );
    
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });
});
