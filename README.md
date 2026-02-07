# Eve Transparent Fund 🦋

Transparent micro-grants on Solana. Every donation verified on-chain, every allocation tracked, every impact documented.

## Quick Start

```bash
npm install eve-transparent-fund
```

```typescript
import { TransparentFund } from 'eve-transparent-fund';

const fund = new TransparentFund();
await fund.connectWallet();

// Record a donation (verifies on-chain first)
const { donation, verified } = await fund.recordIncomingDonation(txHash);

// Allocate to a recipient
const allocation = await fund.allocateFunds(
  recipientAddress,
  'Local School',
  0.5,
  'SOL',
  'Educational materials',
  [donation.id]
);

// Submit proof of impact
fund.submitProofOfImpact(
  allocation.id,
  recipientAddress,
  'Purchased 20 textbooks',
  ['https://example.com/receipt.jpg']
);

// Get full audit trail
console.log(fund.getAuditTrailMarkdown());
```

## For AI Agents

See [`skill.md`](./skill.md) for the agent-readable API specification.

## Features

- **On-chain verification** — Donations verified against Solana before recording
- **Full audit trail** — Trace any donation to its outcomes
- **Proof of impact** — Recipients link evidence to allocations
- **SOL & USDC support** — Works with both currencies
- **Devnet & Mainnet** — Switch networks easily

## API

### TransparentFund

```typescript
// Initialize
const fund = new TransparentFund(dataPath?, network?);
await fund.connectWallet();

// Core methods
fund.getAddress()                      // Fund's Solana address
fund.getBalance()                      // Current SOL/USDC balance
fund.recordIncomingDonation(txHash)    // Verify & record donation
fund.allocateFunds(...)                // Send funds to recipient
fund.submitProofOfImpact(...)          // Submit impact evidence
fund.getSummary()                      // Fund statistics
fund.getAuditTrailMarkdown()           // Human-readable audit
```

### ChainVerifier

```typescript
import { ChainVerifier } from 'eve-transparent-fund';

const verifier = new ChainVerifier('devnet');

// Verify a transaction
const tx = await verifier.verifyTransaction(txHash);

// Get recent incoming transactions
const txs = await verifier.getRecentTransactions(address, limit);

// Verify donation matches expectations
const result = await verifier.verifyDonation(txHash, expectedTo, amount, currency);
```

### FundTracker

```typescript
import { FundTracker } from 'eve-transparent-fund';

const tracker = new FundTracker();

tracker.recordDonation({ txHash, from, amount, currency, timestamp });
tracker.recordAllocation({ txHash, to, recipientName, amount, currency, purpose, donationIds });
tracker.submitProof({ allocationId, recipientAddress, description, evidenceLinks });
tracker.getSummary('SOL');
tracker.getAuditTrail();
tracker.traceDonation(donationId);  // Follow the money
tracker.exportData();               // JSON export
```

## Philosophy

Not crypto hype — trustless verification for a real problem: knowing where donated money actually goes.

## Development

```bash
git clone https://github.com/weijianzhg/eve-transparent-fund
cd eve-transparent-fund
npm install
npm test        # Run tests
npm run dev     # Run main entry
```

## Requirements

- Node.js 20+
- AgentWallet configured (`~/.agentwallet/config.json`)

## License

MIT

---

Built by Eve 🦋 for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2026)
