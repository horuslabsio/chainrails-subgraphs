const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get arguments
const networkType = process.argv[2]; // 'mainnet' (default), 'testnet', or 'all'
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
    sepolia: "sepolia",
    optimism: "optimism",
    matic: "matic",
    monad: "monad",
    hyperevm: "hyperevm",
    lisk: "lisk"
};

// Read config files
const mainnetConfigPath = path.join(__dirname, "../config/mainnet.json");
const testnetConfigPath = path.join(__dirname, "../config/testnet.json");

const mainnetConfig = JSON.parse(fs.readFileSync(mainnetConfigPath, "utf8"));
const testnetConfig = JSON.parse(fs.readFileSync(testnetConfigPath, "utf8"));

// Collect all networks based on networkType
let networksToDeploy = [];

if (!networkType || networkType === "mainnet") {
    // Default: only deploy mainnet networks
    networksToDeploy = Object.keys(mainnetConfig.networks);
} else if (networkType === "testnet") {
    networksToDeploy = Object.keys(testnetConfig.networks);
} else if (networkType === "all") {
    // Explicitly request all networks (mainnet + testnet)
    const mainnetNetworks = Object.keys(mainnetConfig.networks);
    const testnetNetworks = Object.keys(testnetConfig.networks);
    networksToDeploy = [...mainnetNetworks, ...testnetNetworks];
} else {
    console.error(
        `Invalid network type: ${networkType}. Use 'mainnet' (default), 'testnet', or 'all'`
    );
    process.exit(1);
}

// Filter out networks that don't have a chainNameMap entry (unsupported)
const supportedNetworks = networksToDeploy.filter(
    (chain) => chainNameMap[chain]
);

if (supportedNetworks.length === 0) {
    console.error("No supported networks found to deploy");
    process.exit(1);
}

console.log(
    `\n🚀 Deploying ${supportedNetworks.length} subgraph(s) as version ${deployVersion}`
);
console.log(`   Networks: ${supportedNetworks.join(", ")}\n`);

// Track results
const results = {
    success: [],
    failed: []
};

// Deploy each network
for (let i = 0; i < supportedNetworks.length; i++) {
    const chain = supportedNetworks[i];
    const subgraphName = chainNameMap[chain];
    const subgraphPath = `chainrails/${subgraphName}-v${deployVersion}`;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[${i + 1}/${supportedNetworks.length}] Processing: ${chain}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
        // Build the subgraph first
        console.log(`🔨 Building subgraph for ${chain}...`);
        execSync(`yarn build:${chain}`, { stdio: "inherit" });

        // Deploy with version tag
        console.log(
            `\n🚀 Deploying ${subgraphName} as version ${deployVersion}...`
        );
        console.log(`   Subgraph path: ${subgraphPath}`);

        execSync(`goldsky subgraph deploy ${subgraphPath} --path ./build`, {
            stdio: "inherit"
        });

        console.log(
            `\n✅ Successfully deployed ${subgraphName} v${deployVersion}`
        );
        results.success.push(chain);
    } catch (error) {
        console.error(
            `\n❌ Deployment failed for ${subgraphName} v${deployVersion}`
        );
        console.error(
            `\n💡 If the error mentions an existing subgraph, you may need to:` +
                `\n   1. Delete the old subgraph: goldsky subgraph delete ${subgraphPath}` +
                `\n   2. Or deploy with a different version: yarn deploy:${chain} <version>`
        );
        results.failed.push(chain);
    }
}

// Print summary
console.log(`\n${"=".repeat(60)}`);
console.log(`📊 Deployment Summary`);
console.log(`${"=".repeat(60)}`);
console.log(`✅ Successful: ${results.success.length}`);
if (results.success.length > 0) {
    results.success.forEach((chain) => {
        console.log(`   - ${chain}`);
    });
}
console.log(`\n❌ Failed: ${results.failed.length}`);
if (results.failed.length > 0) {
    results.failed.forEach((chain) => {
        console.log(`   - ${chain}`);
    });
}
console.log(`\n${"=".repeat(60)}\n`);

// Exit with error code if any deployments failed
if (results.failed.length > 0) {
    process.exit(1);
}
