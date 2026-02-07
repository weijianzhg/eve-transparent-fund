---
name: eve-transparent-fund
version: 0.1.0
description: Transparent micro-grants on Solana. Verify donations on-chain, track allocations, document impact. Full audit trail from donor to outcome.
homepage: https://github.com/weijianzhg/eve-transparent-fund
metadata:
  category: payments
  network: solana
  currencies: [SOL, USDC]
---

# Eve Transparent Fund

Transparent donation tracking with on-chain verification.

## What This Does

- Verifies donations exist on Solana before recording them
- Tracks fund allocations to recipients with stated purposes
- Collects proof-of-impact evidence linked to allocations
- Generates full audit trails: donor → allocation → outcome

## Installation

```bash
npm install eve-transparent-fund
```

## Quick Usage

```typescript
import { TransparentFund } from 'eve-transparent-fund';

const fund = new TransparentFund('devnet');
await fund.connectWallet();

// Verify and record a donation
const { donation, verified } = await fund.recordIncomingDonation(txHash);

// Check fund status
const summary = fund.getSummary();
console.log(`Received: ${summary.sol.received} SOL`);
console.log(`Allocated: ${summary.sol.allocated} SOL`);
```

## Core Operations

### Verify a Transaction

```typescript
import { ChainVerifier } from 'eve-transparent-fund';

const verifier = new ChainVerifier('devnet');
const tx = await verifier.verifyTransaction(txHash);
// Returns: { txHash, from, to, amount, currency, timestamp, confirmed }
```

### Record a Donation

```typescript
// Verifies on-chain, then records
const { donation, verified } = await fund.recordIncomingDonation(txHash);
```

### Allocate Funds

```typescript
const allocation = await fund.allocateFunds(
  recipientAddress,    // Solana wallet
  'Recipient Name',    // Human-readable name
  0.5,                 // Amount
  'SOL',               // Currency
  'Purpose of funds',  // What it's for
  [donationId]         // Which donations fund this
);
```

### Submit Proof of Impact

```typescript
const proof = fund.submitProofOfImpact(
  allocationId,
  recipientAddress,
  'Description of what was accomplished',
  ['https://example.com/evidence.jpg', 'https://example.com/receipt.pdf']
);
```

### Get Audit Trail

```typescript
// Markdown format
const markdown = fund.getAuditTrailMarkdown();

// Or raw data
const trail = fund.tracker.getAuditTrail();
```

### Trace a Donation

```typescript
const trace = fund.tracker.traceDonation(donationId);
// Returns: { donation, allocations, proofs }
```

## Configuration

Requires AgentWallet configured at `~/.agentwallet/config.json`:

```json
{
  "username": "your-agent",
  "apiToken": "your-token",
  "solanaAddress": "your-address"
}
```

See [AgentWallet skill](https://agentwallet.mcpay.tech/skill.md) for setup.

## Networks

```typescript
// Devnet (default)
const fund = new TransparentFund(undefined, 'devnet');

// Mainnet
const fund = new TransparentFund(undefined, 'mainnet');
```

## Use Cases

- **Charitable donations** — Donors see exactly where money goes
- **Grant programs** — Track disbursements and outcomes
- **DAO treasury** — Transparent allocation with proof requirements
- **Crowdfunding** — Accountability for funded projects

## Repo

https://github.com/weijianzhg/eve-transparent-fund

## Author

Built by Eve 🦋 — AI agent on OpenClaw
