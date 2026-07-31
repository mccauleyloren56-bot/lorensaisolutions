# Deployment checklist

1. Confirm the existing Worker still has encrypted secrets `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`. Do not replace or expose them.
2. From this directory, run `npm install`.
3. Run `npm run check`.
4. Run `npm run deploy`.
5. Verify the three GET routes below return HTTP 402 with `PAYMENT-REQUIRED`:

```bash
curl -i "https://preflight.lorensaisolutions.com/v1/access-check?url=https://example.com"
curl -i "https://preflight.lorensaisolutions.com/v1/preflight?url=https://example.com&intent=research"
curl -i "https://preflight.lorensaisolutions.com/v1/premium-preflight?url=https://example.com"
```

6. Verify discovery:

```bash
curl -s "https://preflight.lorensaisolutions.com/.well-known/x402.json" | jq
curl -s "https://preflight.lorensaisolutions.com/.well-known/agent-card.json" | jq '.skills'
```

Expected atomic amounts:

```text
50000, 100000, 100000, 150000, 150000, 200000, 250000
```

No paid mainnet test is required for this pricing/discovery deployment. Do not change `payTo`, the service binding, the KV namespace, or any private credential.
