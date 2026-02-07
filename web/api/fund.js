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
      amount: 0.1,
      currency: 'SOL',
      timestamp: '2026-02-05T14:30:00.000Z',
      memo: 'Initial test donation'
    }
  ],
  allocations: [],
  proofs: [],
  summary: {
    sol: { received: 0.1, allocated: 0, remaining: 0.1 },
    usdc: { received: 0, allocated: 0, remaining: 0 },
    donations: 1,
    allocations: 0,
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
