/**
 * Test auth middleware
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function testAuth() {
  // Load token
  const secretsPath = join(process.env.HOME!, '.openclaw/workspace/.secrets/colosseum-hackathon.json');
  const secrets = JSON.parse(readFileSync(secretsPath, 'utf-8'));
  const token = secrets.apiKey;
  const agentId = secrets.agentId;
  
  console.log('Testing Colosseum API auth...\n');
  
  // Try multiple endpoints to find the right one
  const endpoints = [
    `https://agents.colosseum.com/api/agents/${agentId}`,
    'https://agents.colosseum.com/api/agent',
    'https://agents.colosseum.com/agent',
    'https://agents.colosseum.com/api/agents/me',
    'https://agents.colosseum.com/api/me'
  ];
  
  for (const url of endpoints) {
    console.log(`Trying ${url}...`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('  Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✓ Found working endpoint!');
      console.log('URL:', url);
      console.log('Agent data:', JSON.stringify(data, null, 2));
      console.log('Agent ID:', data.id);
      return;
    }
    console.log('  Failed\n');
  }
  
  console.error('✗ No working endpoint found');
  process.exit(1);
}

testAuth().catch(console.error);
