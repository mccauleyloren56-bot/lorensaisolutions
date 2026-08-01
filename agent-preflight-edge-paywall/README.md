# Agent Preflight Edge Paywall
[![smithery badge](https://smithery.ai/badge/mccauleyloren56/agent-preflight)](https://smithery.ai/servers/mccauleyloren56/agent-preflight)

Production Cloudflare Worker source for `agent-preflight-edge-paywall`.

## Production configuration

- Domain: `https://preflight.lorensaisolutions.com`
- Network: Base mainnet (`eip155:8453`)
- Asset: USD Coin (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- Receiver: `0xC83C478cc3c95d8913b90D6e55C7019aE6D04B43`
- Facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`
- KV binding: `STATE` -> `agent-preflight-state`
- Service binding: `THREADS_AGENT` -> `threads-miniapp-agent`

## Source layout

`src/routes.ts` is the single pricing and discovery source of truth.

The recovered Worker entrypoint is stored losslessly in eight readable source parts under `src/index.parts/`. Wrangler runs `scripts/assemble-index.mjs` before `dev`, `types`, and `deploy`, verifies the SHA-256 hash, and writes `src/index.generated.ts`.

## Validate

```bash
npm install
npm run check
```

## Deploy

```bash
npm run deploy
```

Wrangler deploys to the existing Worker name and preserves existing encrypted secrets. Never commit secret values, private keys, Telegram tokens, or CDP credentials.

For Cloudflare Git builds, set the project root directory to:

```text
agent-preflight-edge-paywall
```

## Unpaid verification

```bash
curl -i "https://preflight.lorensaisolutions.com/v1/access-check?url=https://example.com"
curl -i "https://preflight.lorensaisolutions.com/v1/preflight?url=https://example.com&intent=research"
curl -i "https://preflight.lorensaisolutions.com/v1/premium-preflight?url=https://example.com"
curl -s "https://preflight.lorensaisolutions.com/.well-known/x402.json" | jq
curl -s "https://preflight.lorensaisolutions.com/.well-known/agent-card.json" | jq '.skills'
```

Expected atomic amounts, in registry order:

```text
50000, 100000, 100000, 150000, 150000, 200000, 250000
```

Correctly formed unpaid requests must return HTTP `402` with `PAYMENT-REQUIRED`. The payment-required resource URL must preserve the complete request query string.
