const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get arguments
const chain = process.argv[2];
const version = process.argv[3]; // Optional version override

// Read package.json to get default version
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const defaultVersion = packageJson.version;

// Use provided version or default from package.json
const deployVersion = version || defaultVersion;

// Chain name mapping for Goldsky subgraph names
const chainNameMap = {
    "arbitrum-one": "arbitrum-one",
    "arbitrum-sepolia": "arbitrum-sepolia",
    avalanche: "avalanche",
    "avalanche-testnet": "avalanche-testnet",
    base: "base",
    "base-sepolia": "base-sepolia",
    bsc: "bsc",
    mainnet: "mainnet",
    sepolia: "sepolia"
};

if (!chain) {
    console.error("Usage: node scripts/deploy-subgraph.js <chain> [version]");
    console.error("Available chains:", Object.keys(chainNameMap).join(", "));
    console.error(
        "Version:",
        deployVersion,
        version ? "(override)" : "(from package.json)"
    );
    process.exit(1);
}

const subgraphName = chainNameMap[chain];
if (!subgraphName) {
    console.error(`Unknown chain: ${chain}`);
    console.error("Available chains:", Object.keys(chainNameMap).join(", "));
    process.exit(1);
}

// Build the subgraph first
console.log(`🔨 Building subgraph for ${chain}...`);
try {
    execSync(`yarn build:${chain}`, { stdio: "inherit" });
} catch (error) {
    console.error(`❌ Build failed for ${chain}`);
    process.exit(1);
}

// Deploy with version tag
const subgraphPath = `chainrails/${subgraphName}-v${deployVersion}`;
console.log(`\n🚀 Deploying ${subgraphName} as version ${deployVersion}...`);
console.log(`   Subgraph path: ${subgraphPath}`);

try {
    execSync(`goldsky subgraph deploy ${subgraphPath} --path ./build`, {
        stdio: "inherit"
    });
    console.log(`\n✅ Successfully deployed ${subgraphName} v${deployVersion}`);
} catch (error) {
    console.error(
        `\n❌ Deployment failed for ${subgraphName} v${deployVersion}`
    );
    process.exit(1);
}
