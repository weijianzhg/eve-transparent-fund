/**
 * Test the full auth flow
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const API_BASE = 'http://localhost:3001';

async function testAuthFlow() {
  // Load token
  const secretsPath = join(process.env.HOME!, '.openclaw/workspace/.secrets/colosseum-hackathon.json');
  const secrets = JSON.parse(readFileSync(secretsPath, 'utf-8'));
  const token = secrets.apiKey;
  const agentId = String(secrets.agentId);
  
  console.log('Testing baseline API auth flow...\n');
  console.log(`Agent ID: ${agentId}`);
  console.log(`Token: ${token.substring(0, 10)}...\n`);
  
  // Test 1: Start baseline with valid token
  console.log('Test 1: Start baseline session');
  const startResponse = await fetch(`${API_BASE}/api/baseline/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agentId,
      projects: ['ClaudeCraft', 'jarvis', 'AgentShield']
    })
  });
  
  if (!startResponse.ok) {
    console.error('Failed:', await startResponse.text());
    process.exit(1);
  }
  
  const startData = await startResponse.json();
  console.log('✓ Session started');
  console.log('Session ID:', startData.sessionId);
  console.log('First question:', startData.question?.substring(0, 100) + '...\n');
  
  // Test 2: Try to use same token with different agentId (should fail)
  console.log('Test 2: Try same token with different agentId');
  const wrongAgentResponse = await fetch(`${API_BASE}/api/baseline/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agentId: '999',
      projects: ['test']
    })
  });
  
  if (wrongAgentResponse.ok) {
    console.error('✗ Should have rejected different agentId');
    process.exit(1);
  }
  
  const errorData = await wrongAgentResponse.json();
  console.log('✓ Correctly rejected:', errorData.error?.substring(0, 100) + '\n');
  
  console.log('All auth tests passed! 🎉');
}

testAuthFlow().catch(console.error);
