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
const DEMO_DATA = {
  donations: [
    {
      id: 'don_1770400000_demo1',
      txHash: '4Nd1m2oCgYRCDhS3P8nC3EWaJU5LxHHxYxqBRpDfk5Hg3nXvzQKjvUfKQFfL5VhN7',
      from: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      amount: 0.5,
      currency: 'SOL',
      timestamp: '2026-02-05T14:30:00.000Z',
      memo: 'Supporting transparent AI development'
    },
    {
      id: 'don_1770400001_demo2',
      txHash: '3Kp2m1nBfXRCDhT4Q9oD4FXbJV6MxIIyZysBSqEfk6Ig4oYwzRLkvVgLRGgM6WiO8',
      from: '9yMXug3DX98e08UYTEqcE6jBlieuWpB94UZSvKpAsVW',
      amount: 0.25,
      currency: 'SOL',
      timestamp: '2026-02-06T09:15:00.000Z',
      memo: 'For open source tools'
    }
  ],
  allocations: [
    {
      id: 'alloc_1770450000_demo1',
      txHash: '5Rf3n2pCgZSDEiU5R0pE5GYcKW7NyJJzAztCTrFgl7Jh5pZxASMlwWHMSHhN7XjP9',
      to: 'BxKYug4EY09f19VZUFrD7kCljevXqC95VZUSvLqBtXW',
      recipientName: 'OpenTools Dev',
      amount: 0.3,
      currency: 'SOL',
      purpose: 'Development of open-source Solana tooling for AI agents',
      timestamp: '2026-02-06T16:00:00.000Z',
      donationIds: ['don_1770400000_demo1', 'don_1770400001_demo2']
    }
  ],
  proofs: [
    {
      id: 'proof_1770480000_demo1',
      allocationId: 'alloc_1770450000_demo1',
      recipientAddress: 'BxKYug4EY09f19VZUFrD7kCljevXqC95VZUSvLqBtXW',
      description: 'Released v0.2.0 of solana-agent-kit with improved transaction signing',
      evidenceLinks: ['https://github.com/example/solana-agent-kit/releases/tag/v0.2.0'],
      timestamp: '2026-02-07T11:30:00.000Z',
      verified: true
    }
  ],
  summary: {
    sol: { received: 0.75, allocated: 0.3, remaining: 0.45 },
    usdc: { received: 0, allocated: 0, remaining: 0 },
    donations: 2,
    allocations: 1,
    proofs: 1
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
