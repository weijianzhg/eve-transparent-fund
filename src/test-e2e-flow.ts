/**
 * End-to-end test: donation → allocation → proof on devnet
 * Uses real on-chain verification
 */

import { TransparentFund } from './index';

const REAL_TX = '5ZLTJQKpEubaRtz835cuYCRv2Ns4AHgU5ztEyuFezXNxcoFJhv8upVmJX9WghTZWFSFkuzm5DDoS42ZAJVm6DuC7';

async function main() {
  console.log('🧪 E2E Flow Test on Devnet\n');
  
  // Use temp file for this test
  const fund = new TransparentFund({ 
    dataPath: './data/e2e-test.json',
    network: 'devnet' 
  });

  // Step 1: Record incoming donation with on-chain verification
  console.log('1️⃣ Recording donation with on-chain verification...');
  try {
    const result = await fund.recordIncomingDonation(
      REAL_TX,
      undefined, // expectedFrom
      undefined, // expectedAmount
      'SOL',
      'E2E test donation'
    );
    console.log(`   ✅ Verified & recorded: ${result.donation.id}`);
    console.log(`   Amount: ${result.verified.amount} ${result.verified.currency}`);
    console.log(`   From: ${result.verified.from}`);
    console.log(`   Timestamp: ${result.verified.timestamp.toISOString()}`);
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
    return;
  }

  // Step 2: Record an allocation (simulated - would need SOL to do real transfer)
  console.log('\n2️⃣ Recording allocation (simulated, no actual transfer)...');
  const allocation = fund.tracker.recordAllocation({
    txHash: 'simulated_allocation_tx',
    to: 'RecipientWalletAddress123',
    recipientName: 'Open Source Developer',
    amount: 0.05,
    currency: 'SOL',
    purpose: 'Reward for contributing to solana-agent-kit',
    timestamp: new Date(),
    donationIds: [fund.tracker.getDonations()[0].id]
  });
  console.log(`   ✅ Recorded: ${allocation.id}`);
  console.log(`   Purpose: ${allocation.purpose}`);

  // Step 3: Submit proof of impact
  console.log('\n3️⃣ Submitting proof of impact...');
  const proof = fund.submitProofOfImpact(
    allocation.id,
    allocation.to,
    'Merged PR #42 adding multi-sig support to solana-agent-kit',
    ['https://github.com/sendaifun/solana-agent-kit/pull/42']
  );
  console.log(`   ✅ Submitted: ${proof.id}`);
  console.log(`   Description: ${proof.description}`);

  // Step 4: Show final summary
  console.log('\n📊 Final Summary:');
  const summary = fund.getSummary();
  console.log(`   SOL Received: ${summary.sol.received}`);
  console.log(`   SOL Allocated: ${summary.sol.allocated}`);
  console.log(`   SOL Remaining: ${summary.sol.remaining}`);
  console.log(`   Donations: ${summary.donations}`);
  console.log(`   Allocations: ${summary.allocations}`);
  console.log(`   Proofs: ${summary.proofs}`);

  // Step 5: Show audit trail
  console.log('\n📋 Audit Trail:');
  console.log(fund.getAuditTrailMarkdown());

  console.log('✨ E2E test complete!');
}

main().catch(console.error);
