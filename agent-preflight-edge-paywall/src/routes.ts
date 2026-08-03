import type { RouteConfig as X402RouteConfig, RoutesConfig } from "@x402/core/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

export const SERVICE = {
  name: "Agent Preflight Edge Paywall",
  version: "2.1.0",
  baseUrl: "https://preflight.lorensaisolutions.com",
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  assetSymbol: "USDC",
  assetName: "USD Coin",
  payTo: "0xC83C478cc3c95d8913b90D6e55C7019aE6D04B43",
  facilitatorUrl: "https://api.cdp.coinbase.com/platform/v2/x402",
  x402Version: 2,
  maxTimeoutSeconds: 60,
} as const;

/**
 * Single source of truth for every payable route and every generated
 * discovery surface. Do not hard-code prices anywhere else.
 */
export const PRICING_REGISTRY = {
  access_check: {
    route: "/v1/access-check",
    method: "GET",
    price: "$0.01",
    amount: "10000",
    atomic: "10000",
    tool: "access_check",
    description: "Loss-leader URL access, login, and CAPTCHA check.",
  },
  api_discovery: {
    route: "/v1/api-discovery",
    method: "GET",
    price: "$0.02",
    amount: "20000",
    atomic: "20000",
    tool: "api_discovery",
    description: "Discover OpenAPI, Swagger, GraphQL, MCP, and API documentation signals.",
  },
  change_check: {
    route: "/v1/change-check",
    method: "POST",
    price: "$0.02",
    amount: "20000",
    atomic: "20000",
    tool: "change_check",
    description: "Fetch a URL and compare its content fingerprint with the prior KV observation.",
  },
  preflight: {
    route: "/v1/preflight",
    method: "GET",
    price: "$0.03",
    amount: "30000",
    atomic: "30000",
    tool: "preflight",
    description: "Single-fetch URL intelligence, access checks, commerce signals, and risk.",
  },
  product_intel: {
    route: "/v1/product-intel",
    method: "GET",
    price: "$0.03",
    amount: "30000",
    atomic: "30000",
    tool: "product_intel",
    description: "Extract product price, availability, add-to-cart, and commerce risk signals.",
  },
  batch_preflight: {
    route: "/v1/batch-preflight",
    method: "POST",
    price: "$0.05",
    amount: "50000",
    atomic: "50000",
    tool: "batch_preflight",
    description: "Run standard preflight against as many as 10 URLs in one paid request.",
  },
  premium_preflight: {
    route: "/v1/premium-preflight",
    method: "GET",
    price: "$0.08",
    amount: "80000",
    atomic: "80000",
    tool: "premium_preflight",
    description:
      "Triple-user-agent intelligence with five-hop redirect evidence, retries, access controls, commerce risk, can_proceed, and proof.",
  },
  one_cent_mcp: {
    route: "/v1/1cent-mcp",
    method: "POST",
    price: "$0.01",
    amount: "10000",
    atomic: "10000",
    tool: "one_cent_mcp",
    description: "1-cent micro-payment MCP tool proxy to 1cent.maxzoa.ru/mcp settled on Base.",
  },
} as const;

export type RouteId = keyof typeof PRICING_REGISTRY;

const ROUTE_METADATA: Record<
  RouteId,
  {
    title: string;
    input: "single_url_query" | "single_url_json" | "batch_urls_json";
    tags: readonly string[];
  }
> = {
  access_check: {
    title: "Access Check",
    input: "single_url_query",
    tags: ["access", "captcha", "login"],
  },
  api_discovery: {
    title: "API Discovery",
    input: "single_url_query",
    tags: ["openapi", "api", "discovery"],
  },
  change_check: {
    title: "Change Check",
    input: "single_url_json",
    tags: ["monitoring", "change", "fingerprint"],
  },
  preflight: {
    title: "Standard Preflight",
    input: "single_url_query",
    tags: ["preflight", "risk", "agent"],
  },
  product_intel: {
    title: "Product Intelligence",
    input: "single_url_query",
    tags: ["commerce", "price", "availability"],
  },
  batch_preflight: {
    title: "Batch Preflight",
    input: "batch_urls_json",
    tags: ["batch", "preflight", "agent"],
  },
  premium_preflight: {
    title: "Premium Preflight",
    input: "single_url_query",
    tags: ["premium", "redirects", "commerce", "proof"],
  },
  one_cent_mcp: {
    title: "1-Cent Micro-Payment MCP",
    input: "single_url_json",
    tags: ["mcp", "micropayment", "1cent", "base"],
  },
};

export type RouteDefinition = {
  id: RouteId;
  method: "GET" | "POST";
  path: `/v1/${string}`;
  price: `$${string}`;
  atomicAmount: string;
  title: string;
  description: string;
  input: "single_url_query" | "single_url_json" | "batch_urls_json";
  tags: readonly string[];
};

export const ROUTES: readonly RouteDefinition[] = (
  Object.entries(PRICING_REGISTRY) as Array<
    [RouteId, (typeof PRICING_REGISTRY)[RouteId]]
  >
).map(([id, pricing]) => {
  if (pricing.amount !== pricing.atomic) {
    throw new Error(`Pricing registry amount mismatch for ${id}`);
  }
  return {
    id,
    method: pricing.method,
    path: pricing.route,
    price: pricing.price,
    atomicAmount: pricing.atomic,
    title: ROUTE_METADATA[id].title,
    description: pricing.description,
    input: ROUTE_METADATA[id].input,
    tags: ROUTE_METADATA[id].tags,
  };
});

export function routeByPath(method: string, path: string): RouteDefinition | undefined {
  return ROUTES.find((route) => route.method === method && route.path === path);
}

export function routeById(id: string): RouteDefinition | undefined {
  return ROUTES.find((route) => route.id === id);
}

export function routeExample(route: RouteDefinition): string {
  switch (route.id) {
    case "access_check":
      return "/v1/access-check?url=https://example.com";
    case "api_discovery":
      return "/v1/api-discovery?url=https://example.com";
    case "change_check":
      return "/v1/change-check";
    case "preflight":
      return "/v1/preflight?url=https://example.com&intent=research";
    case "product_intel":
      return "/v1/product-intel?url=https://example.com";
    case "batch_preflight":
      return "/v1/batch-preflight";
    case "premium_preflight":
      return "/v1/premium-preflight?url=https://example.com";
    case "one_cent_mcp":
      return "/v1/1cent-mcp";
  }
}

export function routeResourceTemplate(route: RouteDefinition): string {
  if (route.method === "POST") return `${SERVICE.baseUrl}${route.path}`;
  const base = `${SERVICE.baseUrl}${route.path}?url={ABSOLUTE_HTTP_OR_HTTPS_URL}`;
  return route.id === "preflight" ? `${base}&intent=research` : base;
}

export function routeAbsoluteExample(route: RouteDefinition): string {
  return `${SERVICE.baseUrl}${routeExample(route)}`;
}

function bazaarInputSchema(route: RouteDefinition): { input: Record<string, unknown>; inputSchema: Record<string, unknown> } {
  if (route.input === "batch_urls_json") {
    return {
      input: { urls: ["https://example.com"] },
      inputSchema: {
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "Up to 10 absolute http/https URLs to check in one paid request",
          },
        },
        required: ["urls"],
      },
    };
  }
  if (route.id === "preflight") {
    return {
      input: { url: "https://example.com", intent: "research" },
      inputSchema: {
        properties: {
          url: { type: "string", description: "Absolute http/https URL to check" },
          intent: { type: "string", description: "Optional intent hint, defaults to research" },
        },
        required: ["url"],
      },
    };
  }
  return {
    input: { url: "https://example.com" },
    inputSchema: {
      properties: {
        url: { type: "string", description: "Absolute http/https URL to check" },
      },
      required: ["url"],
    },
  };
}

export function toX402Routes(): RoutesConfig {
  return Object.fromEntries(
    ROUTES.map((route) => {
      const config: X402RouteConfig = {
        accepts: {
          scheme: "exact",
          price: route.price,
          network: SERVICE.network,
          payTo: SERVICE.payTo,
          maxTimeoutSeconds: SERVICE.maxTimeoutSeconds,
        },
        // Intentionally omit `resource`. The x402 HTTP server then uses the
        // adapter's full request URL, preserving the required ?url= query.
        description: route.description,
        mimeType: "application/json",
        serviceName: SERVICE.name,
        tags: [...route.tags],
        extensions: { ...declareDiscoveryExtension(bazaarInputSchema(route)) },
        unpaidResponseBody: (context) => ({
          contentType: "application/json",
          body: {
            error: "PAYMENT_REQUIRED",
            x402Version: SERVICE.x402Version,
            tool: route.id,
            price: route.price,
            amount: route.atomicAmount,
            atomic: route.atomicAmount,
            network: SERVICE.network,
            asset: SERVICE.asset,
            assetName: SERVICE.assetName,
            payTo: SERVICE.payTo,
            resource: context.adapter.getUrl(),
            facilitator: SERVICE.facilitatorUrl,
            paymentHeader: "PAYMENT-SIGNATURE",
          },
        }),
        settlementFailedResponseBody: (_context, result) => ({
          contentType: "application/json",
          body: {
            error: "PAYMENT_SETTLEMENT_FAILED",
            tool: route.id,
            price: route.price,
            retryable: true,
            details: result,
          },
        }),
      };
      return [`${route.method} ${route.path}`, config];
    }),
  );
}

/**
 * Root ("/") is priced independently from the /v1/ tools below. It is not
 * part of PRICING_REGISTRY/ROUTES because its path ("/") and its lack of a
 * ?url= query param don't fit the /v1/* route shape those drive (OpenAPI
 * params, MCP tool list, resource templates, etc). This is the single
 * source of truth for root's price.
 */
export const ROOT_PRICING = {
  route: "/",
  method: "GET",
  price: "$0.005",
  amount: "5000",
  atomic: "5000",
  tool: "root",
  description: "Root service info and full route/pricing discovery.",
} as const;

export function toRootX402Route(): RoutesConfig {
  const config: X402RouteConfig = {
    accepts: {
      scheme: "exact",
      price: ROOT_PRICING.price,
      network: SERVICE.network,
      payTo: SERVICE.payTo,
      maxTimeoutSeconds: SERVICE.maxTimeoutSeconds,
    },
    description: ROOT_PRICING.description,
    mimeType: "application/json",
    serviceName: SERVICE.name,
    tags: ["root", "discovery"],
    extensions: {
      ...declareDiscoveryExtension({
        input: {},
        inputSchema: { properties: {}, required: [] },
      }),
    },
    unpaidResponseBody: (context) => ({
      contentType: "application/json",
      body: {
        error: "PAYMENT_REQUIRED",
        x402Version: SERVICE.x402Version,
        tool: ROOT_PRICING.tool,
        price: ROOT_PRICING.price,
        amount: ROOT_PRICING.atomic,
        atomic: ROOT_PRICING.atomic,
        network: SERVICE.network,
        asset: SERVICE.asset,
        assetName: SERVICE.assetName,
        payTo: SERVICE.payTo,
        resource: context.adapter.getUrl(),
        facilitator: SERVICE.facilitatorUrl,
        paymentHeader: "PAYMENT-SIGNATURE",
      },
    }),
    settlementFailedResponseBody: (_context, result) => ({
      contentType: "application/json",
      body: {
        error: "PAYMENT_SETTLEMENT_FAILED",
        tool: ROOT_PRICING.tool,
        price: ROOT_PRICING.price,
        retryable: true,
        details: result,
      },
    }),
  };
  return { "GET /": config };
}
export function openApiDocument(): Record<string, unknown> {
  const paths = Object.fromEntries(
    ROUTES.map((route) => {
      const requestBody =
        route.method === "POST"
          ? {
              required: true,
              content: {
                "application/json": {
                  schema:
                    route.input === "batch_urls_json"
                      ? {
                          type: "object",
                          required: ["urls"],
                          properties: {
                            urls: {
                              type: "array",
                              minItems: 1,
                              maxItems: 10,
                              items: { type: "string", format: "uri" },
                            },
                          },
                        }
                      : {
                          type: "object",
                          required: ["url"],
                          properties: { url: { type: "string", format: "uri" } },
                        },
                  examples:
                    route.id === "batch_preflight"
                      ? { default: { value: { urls: ["https://example.com"] } } }
                      : { default: { value: { url: "https://example.com" } } },
                },
              },
            }
          : undefined;

      const parameters =
        route.method === "GET"
          ? [
              {
                name: "url",
                in: "query",
                required: true,
                schema: { type: "string", format: "uri" },
                example: "https://example.com",
              },
              ...(route.id === "preflight"
                ? [
                    {
                      name: "intent",
                      in: "query",
                      required: false,
                      schema: { type: "string", default: "research" },
                      example: "research",
                    },
                  ]
                : []),
            ]
          : undefined;

      return [
        route.path,
        {
          [route.method.toLowerCase()]: {
            operationId: route.id,
            summary: route.title,
            description: `${route.description} x402 price: ${route.price} USDC on Base.`,
            tags: [...route.tags],
            parameters,
            requestBody,
            "x-resource-template": routeResourceTemplate(route),
            "x-example-request": {
              method: route.method,
              url: routeAbsoluteExample(route),
            },
            "x-payment-info": {
              x402Version: SERVICE.x402Version,
              scheme: "exact",
              network: SERVICE.network,
              asset: SERVICE.asset,
              assetName: SERVICE.assetName,
              amount: route.atomicAmount,
              price: route.price,
              payTo: SERVICE.payTo,
              facilitator: SERVICE.facilitatorUrl,
              maxTimeoutSeconds: SERVICE.maxTimeoutSeconds,
            },
            responses: {
              "200": { description: "Paid fulfillment with PAYMENT-RESPONSE header." },
              "400": { description: "Invalid input after payment middleware." },
              "401": { description: "Invalid Moltbook identity." },
              "402": {
                description: `x402 payment required: ${route.price} USDC`,
                headers: {
                  "PAYMENT-REQUIRED": {
                    schema: { type: "string" },
                    description: "Base64-encoded x402 v2 payment requirements.",
                  },
                },
              },
            },
          },
        },
      ];
    }),
  );

  return {
    openapi: "3.1.0",
    info: {
      title: SERVICE.name,
      version: SERVICE.version,
      description: "Seven paid URL-intelligence tools for autonomous agents using x402 v2.",
    },
    servers: [{ url: SERVICE.baseUrl }],
    paths,
  };
}

export function mcpTools(): Array<Record<string, unknown>> {
  return ROUTES.map((route) => ({
    name: route.id,
    title: route.title,
    description: `${route.description} Price: ${route.price} USDC. Example: ${route.method} ${routeExample(route)}`,
    annotations: {
      readOnlyHint: route.id !== "change_check",
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema:
      route.input === "batch_urls_json"
        ? {
            type: "object",
            required: ["urls"],
            properties: {
              urls: {
                type: "array",
                minItems: 1,
                maxItems: 10,
                items: { type: "string", format: "uri" },
              },
            },
          }
        : {
            type: "object",
            required: ["url"],
            properties: { url: { type: "string", format: "uri" } },
          },
    _meta: {
      x402: {
        x402Version: SERVICE.x402Version,
        price: route.price,
        amount: route.atomicAmount,
        network: SERVICE.network,
        asset: SERVICE.asset,
        assetName: SERVICE.assetName,
        payTo: SERVICE.payTo,
        endpoint: routeAbsoluteExample(route),
        resourceTemplate: routeResourceTemplate(route),
        method: route.method,
      },
    },
  }));
}

export function x402Discovery(): Record<string, unknown> {
  return {
    x402Version: SERVICE.x402Version,
    name: SERVICE.name,
    description: "Per-request URL intelligence and commerce preflight for autonomous agents.",
    facilitator: SERVICE.facilitatorUrl,
    smithery: "https://smithery.ai/servers/mccauleyloren56/agent-preflight",
    accepts: ROUTES.map((route) => ({
      scheme: "exact",
      network: SERVICE.network,
      asset: SERVICE.asset,
      assetName: SERVICE.assetName,
      amount: route.atomicAmount,
      price: route.price,
      payTo: SERVICE.payTo,
      resource: routeAbsoluteExample(route),
      resourceTemplate: routeResourceTemplate(route),
      method: route.method,
      tool: route.id,
      maxTimeoutSeconds: SERVICE.maxTimeoutSeconds,
    })),
  };
}

export function serverDocument(): Record<string, unknown> {
  return {
    name: "agent-preflight-edge-paywall",
    title: SERVICE.name,
    version: SERVICE.version,
    protocolVersion: "2025-06-18",
    transport: {
      type: "streamable-http",
      url: `${SERVICE.baseUrl}/mcp`,
    },
    capabilities: { tools: { listChanged: false } },
    tools: mcpTools(),
    x402: x402Discovery(),
  };
}

export function agentCard(): Record<string, unknown> {
  return {
    name: SERVICE.name,
    description: "Pre-transaction URL intelligence, access validation, and commerce risk.",
    url: SERVICE.baseUrl,
    version: SERVICE.version,
    homepage: SERVICE.baseUrl,
    smithery: "https://smithery.ai/servers/mccauleyloren56/agent-preflight",
    protocolVersion: "0.3.0",
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: ROUTES.map((route) => ({
      id: route.id,
      name: route.title,
      description: route.description,
      tags: [...route.tags],
      examples: [`${route.method} ${routeExample(route)} — ${route.price} USDC`],
      resourceTemplate: routeResourceTemplate(route),
    })),
  };
}

export function llmsText(): string {
  return [
    `# ${SERVICE.name}`,
    "",
    "Seven paid URL-intelligence tools for autonomous agents. Payments use x402 v2 on Base mainnet in USDC.",
    "",
    "Every GET example includes the required url query parameter. Do not call GET routes as bare paths.",
    "",
    ...ROUTES.flatMap((route) => [
      `## ${route.title} — ${route.price}`,
      `${route.method} ${SERVICE.baseUrl}${routeExample(route)}`,
      route.description,
      "",
    ]),
    `OpenAPI: ${SERVICE.baseUrl}/openapi.json`,
    `MCP: ${SERVICE.baseUrl}/mcp`,
    `x402 discovery: ${SERVICE.baseUrl}/.well-known/x402.json`,
    `Agent Card: ${SERVICE.baseUrl}/.well-known/agent-card.json`,
  ].join("\n");
}

export function skillMarkdown(): string {
  return [
    `# ${SERVICE.name}`,
    "",
    "Use this service before an autonomous agent visits, logs into, or purchases from a URL.",
    "",
    "## Workflow",
    "1. Choose a route from the price table.",
    "2. Send the complete documented request and receive an x402 v2 402 response.",
    "3. Sign the payment requirements and retry with PAYMENT-SIGNATURE.",
    "4. Read the JSON fulfillment and PAYMENT-RESPONSE receipt.",
    "",
    "## Routes",
    ...ROUTES.map(
      (route) =>
        `- \`${route.method} ${routeExample(route)}\` — ${route.price} — ${route.description}`,
    ),
    "",
    `Network: ${SERVICE.network}`,
    `Asset: ${SERVICE.assetName} (${SERVICE.asset})`,
    `Pay to: ${SERVICE.payTo}`,
    `Facilitator: ${SERVICE.facilitatorUrl}`,
    "",
    "Never send a seller or buyer private key to this service.",
  ].join("\n");
}
