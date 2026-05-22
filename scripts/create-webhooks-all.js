const { execSync } = require("child_process");
const {
  chainNameMap,
  getPackageVersion,
  getNetworksForDeploy,
} = require("./lib/subgraph-chains");
const { parseWebhookCliArgs } = require("./lib/webhook-cli");

const rawArgs = process.argv.slice(2);
const { environment, positional } = parseWebhookCliArgs(rawArgs);

const networkType = positional[0];
const versionOverride = positional[1];
const version = versionOverride || getPackageVersion();

if (!networkType) {
  console.error(
    "Usage: node scripts/create-webhooks-all.js <mainnet|testnet|all> [version] --env <local|dev|prod>",
  );
  console.error("Or set WEBHOOK_ENV=local|dev|prod");
  process.exit(1);
}

if (!environment) {
  console.error("Missing --env <local|dev|prod> (or WEBHOOK_ENV)");
  process.exit(1);
}

let networks;
try {
  networks = getNetworksForDeploy(networkType);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const supported = networks.filter((c) => chainNameMap[c]);

console.log(
  `\n🔗 Creating [${environment}] webhooks for ${supported.length} chain(s), version v${version}\n`,
);

const results = { success: [], failed: [] };

for (const chain of supported) {
  console.log(`\n--- ${chain} ---`);
  try {
    execSync(
      `node ${__dirname}/create-webhooks.js ${chain} ${version} --env ${environment}`,
      { stdio: "inherit" },
    );
    results.success.push(chain);
  } catch {
    results.failed.push(chain);
  }
}

console.log("\n📊 Summary");
console.log(`   Environment: ${environment}`);
console.log(`   Success: ${results.success.join(", ") || "none"}`);
console.log(`   Failed: ${results.failed.join(", ") || "none"}`);

if (results.failed.length > 0) {
  process.exit(1);
}
