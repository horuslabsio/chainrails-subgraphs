const fs = require("fs");
const path = require("path");

const chainNameMap = {
  "arbitrum-one": "arbitrum-one",
  "arbitrum-sepolia": "arbitrum-sepolia",
  avalanche: "avalanche",
  "avalanche-testnet": "avalanche-testnet",
  base: "base",
  "base-sepolia": "base-sepolia",
  bsc: "bsc",
  mainnet: "mainnet",
  sepolia: "sepolia",
  optimism: "optimism",
  matic: "matic",
  monad: "monad",
  hyperevm: "hyperevm",
  lisk: "lisk",
};

/** Short slugs: Goldsky webhook names must be ≤42 characters ({prefix}-{slug}-{chain}). */
const ENTITY_SLUGS = {
  funding_transaction: "ft",
  destination_funding_transaction: "dft",
  broadcast: "bc",
  broadcast_deposit: "bd",
  broadcast_token_amount: "bto",
};

function getPackageVersion() {
  const packageJsonPath = path.join(__dirname, "../../package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version;
}

function getSubgraphRef(chainKey, version) {
  const chainName = chainNameMap[chainKey];
  if (!chainName) {
    throw new Error(`Unknown chain: ${chainKey}`);
  }
  return `chainrails/${chainName}-v${version}`;
}

const WEBHOOK_NAME_MAX_LEN = 42;

function normalizeEnvironment(environment) {
  const env = (environment || "").trim().toLowerCase();
  if (!env) {
    throw new Error(
      "Webhook environment required: pass --env <local|dev|prod|...> or set WEBHOOK_ENV",
    );
  }
  if (!/^[a-z][a-z0-9-]{0,11}$/.test(env)) {
    throw new Error(
      `Invalid webhook environment "${environment}": use 1–12 lowercase letters, digits, or hyphens`,
    );
  }
  return env;
}

function loadWebhookConfig(environment) {
  const env = normalizeEnvironment(environment);
  const configDir = path.join(__dirname, "../../config");
  const basePath = path.join(configDir, "webhooks.json");
  const envPath = path.join(configDir, `webhooks.${env}.json`);
  const overridesPath = path.join(configDir, "webhooks.overrides.json");

  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
  let merged = { ...base, environment: env };

  if (fs.existsSync(envPath)) {
    const envFile = JSON.parse(fs.readFileSync(envPath, "utf8"));
    merged = { ...merged, ...envFile };
  }

  if (fs.existsSync(overridesPath)) {
    const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
    const envOverrides = overrides.environments?.[env];
    if (envOverrides) {
      merged = { ...merged, ...envOverrides };
    }
    const { environments: _ignored, ...globalOverrides } = overrides;
    merged = { ...merged, ...globalOverrides };
  }

  const basePrefix = merged.namePrefix || "cr";
  merged.namePrefix = `${basePrefix}-${env}`;

  const webhookUrl = process.env.WEBHOOK_URL || merged.webhookUrl;
  if (!webhookUrl || webhookUrl.includes("example.com")) {
    throw new Error(
      `Set WEBHOOK_URL or config/webhooks.${env}.json (copy from webhooks.${env}.example.json)`,
    );
  }

  const webhookSecret =
    process.env.WEBHOOK_SECRET ||
    process.env.GOLDSKY_WEBHOOK_SECRET ||
    merged.webhookSecret ||
    "";
  if (!webhookSecret) {
    throw new Error(
      `Set WEBHOOK_SECRET / GOLDSKY_WEBHOOK_SECRET or webhookSecret in config/webhooks.${env}.json`,
    );
  }

  merged.webhookUrl = webhookUrl;
  merged.webhookSecret = webhookSecret;
  return merged;
}

function getNetworksForDeploy(networkType) {
  const mainnetConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../config/mainnet.json"), "utf8"),
  );
  const testnetConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../config/testnet.json"), "utf8"),
  );

  if (!networkType || networkType === "mainnet") {
    return Object.keys(mainnetConfig.networks);
  }
  if (networkType === "testnet") {
    return Object.keys(testnetConfig.networks);
  }
  if (networkType === "all") {
    return [
      ...Object.keys(mainnetConfig.networks),
      ...Object.keys(testnetConfig.networks),
    ];
  }
  throw new Error(`Invalid network type: ${networkType}`);
}

function buildWebhookName(namePrefix, entity, chainKey) {
  const entitySlug = ENTITY_SLUGS[entity] || entity.replace(/_/g, "-");
  const name = `${namePrefix}-${entitySlug}-${chainKey}`;
  if (name.length > WEBHOOK_NAME_MAX_LEN) {
    throw new Error(
      `Webhook name "${name}" is ${name.length} chars (Goldsky max ${WEBHOOK_NAME_MAX_LEN}). Shorten namePrefix or environment slug.`,
    );
  }
  return name;
}

module.exports = {
  chainNameMap,
  ENTITY_SLUGS,
  WEBHOOK_NAME_MAX_LEN,
  getPackageVersion,
  getSubgraphRef,
  normalizeEnvironment,
  loadWebhookConfig,
  getNetworksForDeploy,
  buildWebhookName,
};
