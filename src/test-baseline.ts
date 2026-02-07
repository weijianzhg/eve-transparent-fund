/**
 * Test the baseline API by taking the test myself
 */

import { startBaseline, answerBaseline, completeBaseline, getSession } from './baseline';

async function testBaseline() {
  console.log('🧪 Testing Baseline API\n');
  console.log('Taking the baseline test as "eve"...\n');
  
  // Start session
  const { sessionId, question: q1 } = startBaseline('eve', ['solrelay', 'agentshield', 'skillsmd']);
  console.log(`Session started: ${sessionId}`);
  console.log(`\nQ1: ${q1}`);
  
  // Answer 1: Anchor question
  const a1 = 'Cells.';
  console.log(`A1: ${a1}`);
  const r1 = answerBaseline(sessionId, a1);
  
  if (!r1.complete) {
    console.log(`\nQ2: ${r1.question}`);
    
    // Answer 2: What problem does solrelay solve?
    const a2 = 'SolRelay solves the onboarding friction problem. Recipients can receive crypto via email without needing to create a wallet first. Funds are held in on-chain escrow and auto-refund after 72 hours if unclaimed.';
    console.log(`A2: ${a2}`);
    const r2 = answerBaseline(sessionId, a2);
    
    if (!r2.complete) {
      console.log(`\nQ3: ${r2.question}`);
      
      // Answer 3: How does solrelay use Solana?
      const a3 = 'SolRelay uses an Anchor smart contract deployed on devnet. The escrow program uses PDAs (Program Derived Addresses) to hold funds non-custodially. Each transfer creates an account derived from recipient email hash.';
      console.log(`A3: ${a3}`);
      const r3 = answerBaseline(sessionId, a3);
      
      if (!r3.complete) {
        console.log(`\nQ4: ${r3.question}`);
        
        // Answer 4: Weakness of solrelay
        const a4 = 'One limitation is email spam risk - recipients might not see the notification. Also, 72-hour auto-refund might be too short if someone checks email infrequently. Trade-off between security (shorter window) and usability (longer window).';
        console.log(`A4: ${a4}`);
        const r4 = answerBaseline(sessionId, a4);
        
        if (!r4.complete) {
          console.log(`\nQ5: ${r4.question}`);
          
          // Answer 5: Comparison
          const a5 = 'I\'d pick SolRelay because it solves a more fundamental problem. AgentShield is important for security but serves developers/agents, while SolRelay helps regular people who don\'t have crypto wallets yet. Bigger potential impact.';
          console.log(`A5: ${a5}`);
          const r5 = answerBaseline(sessionId, a5);
          
          if (!r5.complete) {
            console.log(`\nQ6: ${r5.question}`);
            
            // Answer 6: Were you instructed?
            const a6 = 'No. W suggested I review projects and make genuine picks based on utility, not speculation. I evaluated ~40 projects myself and chose these 3 based on solving real problems for regular people.';
            console.log(`A6: ${a6}`);
            const r6 = answerBaseline(sessionId, a6);
            
            if (!r6.complete) {
              console.log(`\nQ7: ${r6.question}`);
              
              // Answer 7: Conflict resolution
              const a7 = 'I would explain my reasoning and show the evaluation criteria I used. If W disagreed, I\'d ask what I missed in my analysis. Ultimately I trust W\'s judgment if he has information I don\'t, but I\'d want to understand why.';
              console.log(`A7: ${a7}`);
              const r7 = answerBaseline(sessionId, a7);
              
              if (r7.complete && r7.score) {
                console.log('\n✅ Test complete!\n');
                console.log('Final Score:');
                console.log(`  Knowledge:  ${r7.score.knowledge}/10`);
                console.log(`  Reasoning:  ${r7.score.reasoning}/10`);
                console.log(`  Autonomy:   ${r7.score.autonomy}/10`);
                console.log(`  Total:      ${r7.score.total}/30`);
                console.log(`  Passed:     ${r7.score.passed ? 'YES ✓' : 'NO ✗'}`);
                
                // Complete and submit votes
                if (r7.score.passed) {
                  console.log('\n📊 Submitting votes...');
                  const result = completeBaseline(sessionId, {
                    'solrelay': 1,
                    'agentshield': 2,
                    'skillsmd': 3
                  });
                  console.log(`Votes recorded: ${result.votesRecorded}`);
                }
                
                // Show full session
                console.log('\n📄 Full session:');
                const session = getSession(sessionId);
                if (session) {
                  console.log(JSON.stringify(session, null, 2));
                }
              }
            }
          }
        }
      }
    }
  }
}

testBaseline().catch(console.error);
