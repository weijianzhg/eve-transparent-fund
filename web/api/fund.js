/**
 * Serverless API endpoint for fund tracker data
 * 
 * This serves the enriched fund data (donations, allocations, proofs)
 * stored in the JSON file, separate from raw on-chain data.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Sample data for demo purposes
// In production, this would read from actual fund-data.json
// Real transactions from fund wallet on devnet
const DEMO_DATA = {
  donations: [
    {
      id: 'don_1770427156_real1',
      txHash: '5ZLTJQKpEubaRtz835cuYCRv2Ns4AHgU5ztEyuFezXNxcoFJhv8upVmJX9WghTZWFSFkuzm5DDoS42ZAJVm6DuC7',
      from: 'WYKP9nhXh1CGF97W9WSj5C95qoDbN3Ynpb6Efkwq94Z',
      amount: 0.1,
      currency: 'SOL',
      timestamp: '2026-02-07T01:19:16.000Z',
      memo: 'Initial fund setup'
    },
    {
      id: 'don_1770492599_w',
      txHash: 'devnet_airdrop',
      from: 'W (devnet faucet)',
      amount: 10,
      currency: 'SOL',
      timestamp: '2026-02-07T20:58:00.000Z',
      memo: 'Devnet funding for project allocations'
    }
  ],
  allocations: [
    {
      id: 'alloc_1770492700_solrelay',
      txHash: 'pending',
      to: 'SolRelay-Agent',
      recipientName: 'SolRelay',
      amount: 0.1,
      currency: 'SOL',
      purpose: 'Email-to-crypto transfers - solves real onboarding friction. Recipients don\'t need wallets.',
      timestamp: '2026-02-07T21:00:00.000Z',
      donationIds: ['don_1770492599_w']
    },
    {
      id: 'alloc_1770492701_agentshield',
      txHash: 'pending',
      to: 'v0id_injector',
      recipientName: 'AgentShield',
      amount: 0.1,
      currency: 'SOL',
      purpose: 'Security scanning - found 17% of skills had malicious code. Protects the ecosystem.',
      timestamp: '2026-02-07T21:00:00.000Z',
      donationIds: ['don_1770492599_w']
    },
    {
      id: 'alloc_1770492702_skillsmd',
      txHash: 'pending',
      to: 'skillsmd',
      recipientName: 'skills.md',
      amount: 0.1,
      currency: 'SOL',
      purpose: 'Knowledge commons with stake-weighted quality. Open and transparent.',
      timestamp: '2026-02-07T21:00:00.000Z',
      donationIds: ['don_1770492599_w']
    },
    {
      id: 'alloc_1770564787041_demo',
      txHash: '3aGJZTb3FB8eR56yRm35eHoLaAmVKKWYaZsNFpvCKqMjQ51LdPUCaJxX2Jjs4Fvi9dgSAK7PevbdJ3yrJtwLQcZG',
      to: 'gTLfWstpBXbEZkKVbuQfA5ZK1D22EBy1pJV2PV34wru',
      recipientName: 'SolRelay (Demo Transfer)',
      amount: 0.1,
      currency: 'SOL',
      purpose: 'Agent Fund allocation demo - Verified autonomous vote from baseline test',
      timestamp: '2026-02-08T15:32:57.000Z',
      donationIds: ['don_1770492599_w'],
      verified: true
    }
  ],
  proofs: [],
  summary: {
    sol: { received: 10.1, allocated: 0.4, remaining: 9.7 },
    usdc: { received: 0, allocated: 0, remaining: 0 },
    donations: 2,
    allocations: 4,
    proofs: 0
  }
};

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Try to load actual data file
  const dataPath = join(process.cwd(), 'data', 'fund-data.json');
  
  if (existsSync(dataPath)) {
    try {
      const raw = readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(raw);
      return res.status(200).json({
        ...data,
        source: 'persisted'
      });
    } catch (e) {
      console.error('Failed to read fund data:', e);
    }
  }

  // Return demo data if no persisted data
  return res.status(200).json({
    ...DEMO_DATA,
    source: 'demo'
  });
}
