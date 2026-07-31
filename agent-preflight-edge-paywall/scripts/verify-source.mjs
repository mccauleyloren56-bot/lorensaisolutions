import fs from "node:fs";
import worker from "../dist/index.js";

const source = fs.readFileSync(new URL("../dist/index.js", import.meta.url), "utf8");
const expected = [
  ["access_check", "$0.05", "50000"],
  ["api_discovery", "$0.10", "100000"],
  ["change_check", "$0.10", "100000"],
  ["preflight", "$0.15", "150000"],
  ["product_intel", "$0.15", "150000"],
  ["batch_preflight", "$0.20", "200000"],
  ["premium_preflight", "$0.25", "250000"]
];

for (const [tool, price, atomic] of expected) {
  if (!source.includes(`${tool}: {`)) throw new Error(`Missing registry entry: ${tool}`);
  if (!source.includes(`price: "${price}"`)) throw new Error(`Missing price: ${tool} ${price}`);
  if (!source.includes(`atomic: "${atomic}"`)) throw new Error(`Missing atomic amount: ${tool} ${atomic}`);
}

for (const forbidden of ["$0.35", "$0.75", "350000", "750000"]) {
  if (source.includes(forbidden)) throw new Error(`Forbidden stale price/amount remains: ${forbidden}`);
}

for (const fragment of [
  "toX402Routes(c.req.url)",
  "resource: requestUrl || callableResource(route)",
  "return \"/v1/access-check?url=https://example.com\"",
  "return \"/v1/api-discovery?url=https://example.com\"",
  "return \"/v1/preflight?url=https://example.com&intent=research\"",
  "return \"/v1/product-intel?url=https://example.com\"",
  "return \"/v1/premium-preflight?url=https://example.com\"",
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "0xC83C478cc3c95d8913b90D6e55C7019aE6D04B43"
]) {
  if (!source.includes(fragment)) throw new Error(`Missing required fragment: ${fragment}`);
}

const ctx = { waitUntil() {}, passThroughOnException() {} };
async function getJson(path) {
  const response = await worker.fetch(new Request(`https://preflight.lorensaisolutions.com${path}`), {}, ctx);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}
async function getText(path) {
  const response = await worker.fetch(new Request(`https://preflight.lorensaisolutions.com${path}`), {}, ctx);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

const root = await getJson("/");
if (root.pricing.length !== 7) throw new Error(`Root pricing count ${root.pricing.length}`);
const rootPrices = new Map(root.pricing.map((route) => [route.path, route.price]));
const paths = {
  access_check: "/v1/access-check",
  api_discovery: "/v1/api-discovery",
  change_check: "/v1/change-check",
  preflight: "/v1/preflight",
  product_intel: "/v1/product-intel",
  batch_preflight: "/v1/batch-preflight",
  premium_preflight: "/v1/premium-preflight"
};
for (const [tool, price] of expected) {
  if (rootPrices.get(paths[tool]) !== price) throw new Error(`Root price mismatch: ${tool}`);
}

const x402 = await getJson("/.well-known/x402.json");
const actualAtomic = x402.accepts.map((item) => item.amount).join(",");
const expectedAtomic = expected.map(([, , atomic]) => atomic).join(",");
if (actualAtomic !== expectedAtomic) throw new Error(`x402 amounts ${actualAtomic}`);
if (!x402.accepts.every((item) => item.asset === "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")) {
  throw new Error("x402 asset mismatch");
}

const card = await getJson("/.well-known/agent-card.json");
const examples = card.skills.flatMap((skill) => skill.examples || []);
const expectedExamples = [
  "GET /v1/access-check?url=https://example.com — $0.05 USDC",
  "GET /v1/api-discovery?url=https://example.com — $0.10 USDC",
  "POST /v1/change-check — $0.10 USDC",
  "GET /v1/preflight?url=https://example.com&intent=research — $0.15 USDC",
  "GET /v1/product-intel?url=https://example.com — $0.15 USDC",
  "POST /v1/batch-preflight — $0.20 USDC",
  "GET /v1/premium-preflight?url=https://example.com — $0.25 USDC"
];
for (const example of expectedExamples) {
  if (!examples.includes(example)) throw new Error(`Agent Card missing: ${example}`);
}

for (const path of ["/openapi.json", "/SKILL.md", "/llms.txt", "/docs"]) {
  const body = path.endsWith(".json") ? JSON.stringify(await getJson(path)) : await getText(path);
  for (const forbidden of ["$0.35", "$0.75"]) {
    if (body.includes(forbidden)) throw new Error(`${path} has ${forbidden}`);
  }
}

console.log("Agent Preflight source and generated discovery verification passed.");
