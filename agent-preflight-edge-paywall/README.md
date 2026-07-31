# Agent Preflight Edge Paywall

Source-controlled backup of the live compiled Cloudflare Worker bundle for `agent-preflight-edge-paywall`. The bundle is stored as gzip/base64 parts so GitHub can preserve the exact 1.27 MB Worker source without committing secrets. `npm run build` reconstructs `dist/index.js` byte-for-byte.

## Applied pricing source of truth

| Tool | Route | Price | Atomic USDC |
|---|---|---:|---:|
| access_check | GET /v1/access-check | $0.05 | 50000 |
| api_discovery | GET /v1/api-discovery | $0.10 | 100000 |
| change_check | POST /v1/change-check | $0.10 | 100000 |
| preflight | GET /v1/preflight | $0.15 | 150000 |
| product_intel | GET /v1/product-intel | $0.15 | 150000 |
| batch_preflight | POST /v1/batch-preflight | $0.20 | 200000 |
| premium_preflight | GET /v1/premium-preflight | $0.25 | 250000 |

The live x402 challenge now uses the complete incoming request URL, including the `?url=` query string. Discovery documents, MCP metadata, OpenAPI, Agent Card, SKILL.md, llms.txt, docs, and `/` are generated from the same registry.

## Safety

`wrangler.example.toml` intentionally excludes live KV IDs, service targets, and secrets. Copy the current bindings from the Cloudflare dashboard before deployment. Never commit CDP credentials, private keys, wallet secrets, Telegram tokens, or `.env` files.

## Local checks

```bash
npm run build
npm run check
npm run verify:source
```

## Live no-spend verification

```bash
curl -i "https://preflight.lorensaisolutions.com/v1/access-check?url=https://example.com"
curl -i "https://preflight.lorensaisolutions.com/v1/preflight?url=https://example.com&intent=research"
curl -i "https://preflight.lorensaisolutions.com/v1/premium-preflight?url=https://example.com"
curl -s https://preflight.lorensaisolutions.com/.well-known/x402.json | jq
curl -s https://preflight.lorensaisolutions.com/.well-known/agent-card.json | jq '.skills'
```

Expected atomic amounts: `50000,100000,100000,150000,150000,200000,250000`.
