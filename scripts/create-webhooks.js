const { execSync } = require("child_process");
const {
  chainNameMap,
  getPackageVersion,
  getSubgraphRef,
  loadWebhookConfig,
  buildWebhookName,
} = require("./lib/subgraph-chains");
const { parseWebhookCliArgs } = require("./lib/webhook-cli");

const rawArgs = process.argv.slice(2);
const { dryRun, environment, entityFilter, positional } =
  parseWebhookCliArgs(rawArgs);

const chain = positional[0];
const versionOverride = positional[1];
const version = versionOverride || getPackageVersion();

if (!chain) {
  console.error(
    "Usage: node scripts/create-webhooks.js <chain> [version] --env <local|dev|prod> [--dry-run] [--entity <name>]",
  );
  console.error("Chains:", Object.keys(chainNameMap).join(", "));
  console.error("Or set WEBHOOK_ENV=local|dev|prod");
  process.exit(1);
}

if (!chainNameMap[chain]) {
  console.error(`Unknown chain: ${chain}`);
  process.exit(1);
}

const config = loadWebhookConfig(environment);
const subgraphRef = getSubgraphRef(chain, version);
const entities = entityFilter
  ? config.entities.filter((e) => e === entityFilter)
  : config.entities;

if (entities.length === 0) {
  console.error(`Entity not in config: ${entityFilter}`);
  process.exit(1);
}

const secret = config.webhookSecret;

console.log(
  `\nEnvironment: ${config.environment} | prefix: ${config.namePrefix} | URL: ${config.webhookUrl}\n`,
);

function listExistingWebhooks() {
  try {
    const out = execSync("goldsky subgraph webhook list", {
      encoding: "utf8",
    });
    return out;
  } catch {
    return "";
  }
}

const existingList = listExistingWebhooks();
const created = [];
const skipped = [];

for (const entity of entities) {
  const webhookName = buildWebhookName(config.namePrefix, entity, chain);

  if (existingList.includes(webhookName)) {
    skipped.push(webhookName);
    console.log(`⏭️  Skip (exists): ${webhookName}`);
    continue;
  }

  const cmd = [
    "goldsky",
    "subgraph",
    "webhook",
    "create",
    subgraphRef,
    "--name",
    webhookName,
    "--url",
    config.webhookUrl,
    "--entity",
    entity,
    "--secret",
    secret,
  ].join(" ");

  console.log(`\n🔗 ${webhookName} (${entity})`);
  console.log(`   ${dryRun ? "[dry-run] " : ""}${cmd.replace(secret, "***")}`);

  if (!dryRun) {
    try {
      execSync(cmd, { stdio: "inherit" });
      created.push(webhookName);
    } catch (error) {
      console.error(`❌ Failed: ${webhookName}`);
      process.exit(1);
    }
  }
}

if (!dryRun && created.length > 0) {
  console.log(
    `\n📝 Backend (${config.environment}): GOLDSKY_WEBHOOK_SECRET=${secret}`,
  );
}

console.log(
  `\n✅ Done [${config.environment}]: ${created.length} created, ${skipped.length} skipped for ${subgraphRef}`,
);
