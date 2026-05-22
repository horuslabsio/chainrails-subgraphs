const { execSync } = require("child_process");
const {
  chainNameMap,
  getPackageVersion,
  getSubgraphRef,
} = require("./lib/subgraph-chains");

const chain = process.argv[2];
const versionOverride = process.argv[3];
const version = versionOverride || getPackageVersion();

if (!chain) {
  console.error(
    "Usage: node scripts/list-webhook-entities.js <chain> [version]",
  );
  console.error("Chains:", Object.keys(chainNameMap).join(", "));
  process.exit(1);
}

const subgraphRef = getSubgraphRef(chain, version);
console.log(`\nEntities for ${subgraphRef}:\n`);
execSync(`goldsky subgraph webhook list-entities ${subgraphRef}`, {
  stdio: "inherit",
});
