# Agent Preflight Recovery Runbook

Last known-good incident recovery: 2026-07-31

## Current production identity

- Worker: `agent-preflight-edge-paywall`
- Domain: `https://preflight.lorensaisolutions.com`
- Repository: `mccauleyloren56-bot/lorensaisolutions`
- Project root: `agent-preflight-edge-paywall`
- Production branch: `main`
- Last known-good version: `2.1.0`
- Last known-good fix commit: `8092bf0ca82f07b39baabf8633294c202b916676`

Ignore the deleted historical Workers `agent-preflight-mainnet` and `agent-preflight-discovery`. They are not missing infrastructure.

## Cloudflare build configuration

- Root directory: `agent-preflight-edge-paywall`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Compatibility date: `2026-07-30`
- Compatibility flag: `nodejs_compat`
- Cron: `0 * * * *`

## Required bindings

- KV binding: `STATE` -> `agent-preflight-state`
- Service binding: `THREADS_AGENT` -> `threads-miniapp-agent`

Never delete or rename these while troubleshooting the payment gate.

## Required secrets and configuration

Encrypted secrets:

- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`

Public configuration:

- Network: `eip155:8453`
- Asset contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Asset name: `USD Coin`
- Pay-to wallet: `0xC83C478cc3c95d8913b90D6e55C7019aE6D04B43`
- Facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`
- x402 version: `2`
- Timeout: `60`

Do not change the pay-to wallet, secret values, or facilitator URL during ordinary recovery.

## Pricing source of truth

All pricing must come from `src/routes.ts` through `PRICING_REGISTRY`.

| Tool | Route | Method | Price | Atomic amount |
|---|---|---:|---:|---:|
| Access Check | `/v1/access-check` | GET | `$0.05` | `50000` |
| API Discovery | `/v1/api-discovery` | GET | `$0.10` | `100000` |
| Change Check | `/v1/change-check` | POST | `$0.10` | `100000` |
| Standard Preflight | `/v1/preflight` | GET | `$0.15` | `150000` |
| Product Intelligence | `/v1/product-intel` | GET | `$0.15` | `150000` |
| Batch Preflight | `/v1/batch-preflight` | POST | `$0.20` | `200000` |
| Premium Preflight | `/v1/premium-preflight` | GET | `$0.25` | `250000` |

Forbidden stale prices: `$0.35` and `$0.75`.

Generated surfaces must all derive from the registry:

- `/`
- `/openapi.json`
- `/SKILL.md`
- `/llms.txt`
- `/mcp`
- `/.well-known/x402.json`
- `/.well-known/agent-card.json`

## Required request examples

- `GET /v1/access-check?url=https://example.com`
- `GET /v1/api-discovery?url=https://example.com`
- `POST /v1/change-check`
- `GET /v1/preflight?url=https://example.com&intent=research`
- `GET /v1/product-intel?url=https://example.com`
- `POST /v1/batch-preflight`
- `GET /v1/premium-preflight?url=https://example.com`

## Known failure modes and exact fixes

### 1. `400 missing_url` before payment

Cause: validation ran before x402 middleware, or discovery published a naked route without `?url=`.

Fix:

- Payment middleware must run before route validation.
- Discovery examples must include the required query parameter.
- The payment resource URL must preserve the full request URL, including query parameters.

The current route configuration intentionally omits a static `resource` value so the x402 adapter uses the complete incoming URL. The unpaid response body uses `context.adapter.getUrl()`.

### 2. Resource URL drops the query string

Bad behavior:

- `new URL(c.req.url).pathname`
- `split("?")[0]`
- hard-coded route-only resource URLs

Correct behavior:

- use the full request URL, such as `c.req.url` or `context.adapter.getUrl()`

### 3. `Facilitator does not support exact on eip155`

This error occurred even though Base mainnet `eip155:8453` is supported.

Two code mistakes caused it:

1. Replacing the proven authenticated facilitator with `createCdpFacilitatorClient`.
2. Calling `paymentMiddleware(..., false)`, which disabled facilitator initialization and prevented supported network/scheme discovery.

Known-good pattern:

- Use `HTTPFacilitatorClient` from `@x402/core/server`.
- Generate CDP JWT authentication headers for `/verify`, `/settle`, and `/supported`.
- Register `ExactEvmScheme` on `eip155:8453`.
- Pass `true` as the final `paymentMiddleware` argument so facilitator support initializes.

Do not diagnose this error by changing the chain to plain `eip155`.

### 4. Build succeeds but old prices remain live

Cause: Cloudflare build had not triggered or the old version was still active.

Fix:

- Confirm the newest deployment is active at `100%` traffic.
- Confirm the production branch is `main`.
- Push a harmless commit only when a connected build needs a trigger.
- Verify the root response reports version `2.1.0`, batch `$0.20`, and premium `$0.25`.

### 5. Compiled bundle mistaken for source

Cloudflare may provide a very large compiled bundle containing dependencies. Do not rebuild the project from that unless no source archive exists.

Preferred recovery source:

- `src/`
- `wrangler.toml`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

## Verification sequence

### A. Root and discovery

Confirm:

- version `2.1.0`
- seven routes
- atomic amounts: `50000,100000,100000,150000,150000,200000,250000`
- no `$0.35`
- no `$0.75`

### B. Unpaid route test

Open or curl:

```bash
curl -i "https://preflight.lorensaisolutions.com/v1/access-check?url=https://example.com"
```

Correct result:

- HTTP `402`
- browser may show `Payment Required`
- `PAYMENT-REQUIRED` response header exists
- price `$0.05`
- amount `50000`
- network `eip155:8453`

Incorrect results:

- `400` means validation/query ordering is wrong
- `404` means route/discovery mismatch
- `500` or `502` means runtime/facilitator failure
- `Facilitator does not support exact on eip155` means facilitator initialization/authentication is wrong

### C. Discovery checks

```bash
curl -s "https://preflight.lorensaisolutions.com/.well-known/x402.json" | jq
curl -s "https://preflight.lorensaisolutions.com/.well-known/agent-card.json" | jq '.skills'
```

### D. Paid proof

A browser `Payment Required` screen proves the payment gate is live, but not full settlement.

A complete end-to-end proof requires one live `$0.05` Access Check payment confirming:

- payment verification
- settlement
- paid fulfillment
- `PAYMENT-RESPONSE`
- USDC receipt at the pay-to wallet
- Telegram alert through `THREADS_AGENT`

## Recovery rules

1. Inspect the currently active deployment before editing.
2. Never replace the live Worker with deleted historical Worker code.
3. Never change wallet, secrets, bindings, or chain while debugging route formatting.
4. Patch the real source project, not screenshots or partial compiled snippets.
5. Keep pricing and discovery generated from one registry.
6. Verify an unpaid `402` before attempting a paid mainnet test.
7. After deployment, confirm the newest version is active at `100%` traffic.
