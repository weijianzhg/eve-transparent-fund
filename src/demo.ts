/**
 * Demo script showing the Transparent Fund flow
 */

import { TransparentFund } from './index';

async function demo() {
  console.log('Eve Transparent Fund — Demo Flow\n');
  console.log('='.repeat(50));
  
  const fund = new TransparentFund();
  await fund.connectWallet();
  
  // Show initial state
  console.log('\n📊 Initial State:');
  const balance = await fund.getBalance();
  console.log(`   Balance: ${balance.sol} SOL, ${balance.usdc} USDC`);
  console.log(`   Address: ${fund.getAddress()}`);
  
  // Simulate receiving a donation (in real use, this would come from monitoring the wallet)
  console.log('\n📥 Simulating donation received...');
  const donation = await fund.recordIncomingDonation(
    'simulated_tx_hash_001',
    'DonorWallet123abc',
    50000000, // 0.05 SOL in lamports
    'SOL',
    'For education programs'
  );
  console.log(`   Recorded: ${donation.id}`);
  
  // Show fund summary
  console.log('\n📊 Fund Summary:');
  const summary = fund.getSummary();
  console.log(`   SOL: ${summary.sol.received} received, ${summary.sol.allocated} allocated`);
  console.log(`   Donations: ${summary.donations}, Allocations: ${summary.allocations}`);
  
  // Simulate an allocation (skip actual transfer for demo)
  console.log('\n📤 Recording allocation...');
  const allocation = fund.tracker.recordAllocation({
    txHash: 'simulated_tx_hash_002',
    to: 'RecipientWallet456def',
    recipientName: 'Local School Fund',
    amount: 25000000, // 0.025 SOL
    currency: 'SOL',
    purpose: 'Purchase educational materials',
    timestamp: new Date(),
    donationIds: [donation.id]
  });
  console.log(`   Allocated: ${allocation.id}`);
  
  // Submit proof of impact
  console.log('\n✅ Submitting proof of impact...');
  const proof = fund.submitProofOfImpact(
    allocation.id,
    'RecipientWallet456def',
    'Purchased 20 textbooks and 5 tablets for students',
    ['https://example.com/receipt.jpg', 'https://example.com/students-with-tablets.jpg']
  );
  console.log(`   Proof: ${proof.id}`);
  
  // Generate audit trail
  console.log('\n📋 Audit Trail:');
  console.log('-'.repeat(50));
  console.log(fund.getAuditTrailMarkdown());
  
  // Final summary
  console.log('📊 Final Summary:');
  const finalSummary = fund.getSummary();
  console.log(`   Donations: ${finalSummary.donations}`);
  console.log(`   Allocations: ${finalSummary.allocations}`);
  console.log(`   Proofs: ${finalSummary.proofs}`);
  
  console.log('\n✨ Demo complete!');
}

demo().catch(console.error);
