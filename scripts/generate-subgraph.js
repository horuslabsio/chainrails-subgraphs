const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");

// Get network from command line args
const targetNetwork = process.argv[2];
const targetChain = process.argv[3];

// Read config
const configPath = path.join(__dirname, `../config/${targetNetwork}.json`);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Read template
const templatePath = path.join(__dirname, "../subgraph.template.yaml");
const template = fs.readFileSync(templatePath, "utf8");

if (!targetNetwork || !targetChain) {
    console.error("Usage: node scripts/generate-subgraph.js <network> <chain>");
    console.error("Available networks: [mainnet, testnet]");
    console.error("Available chains:", Object.keys(config.networks).join(", "));
    process.exit(1);
}

if (!config["networks"][targetChain]) {
    console.error(`Chain "${targetChain}" not found in config.json`);
    console.error("Available chains:", Object.keys(config.networks).join(", "));
    process.exit(1);
}

const chainConfig = config["networks"][targetChain];

// Get tokens array - support both old format (usdcAddress) and new format (tokens array)
let tokens = [];
if (chainConfig.tokens && Array.isArray(chainConfig.tokens)) {
    // New format: tokens array - include network in each token for Mustache template
    tokens = chainConfig.tokens.map(token => ({
        ...token,
        network: targetChain,
        startBlock: chainConfig.startBlock,
        chainId: String(chainConfig.chainId)
    }));
} else if (chainConfig.usdcAddress) {
    // Old format: single USDC address (backward compatibility)
    tokens = [
        {
            symbol: "USDC",
            address: chainConfig.usdcAddress,
            network: targetChain,
            startBlock: chainConfig.startBlock,
            chainId: String(chainConfig.chainId)
        }
    ];
} else {
    console.warn(
        `⚠️  No tokens found for chain "${targetChain}". Using empty tokens array.`
    );
}

// Prepare template data - convert numbers to strings for Goldsky compatibility
const templateData = {
    network: targetChain,
    intentFactory: config.intentFactory,
    broadcaster: config.broadcaster,
    startBlock: chainConfig.startBlock,
    chainId: String(chainConfig.chainId),
    tokens: tokens
};

// Generate subgraph.yaml
const output = Mustache.render(template, templateData);
const outputPath = path.join(__dirname, "../subgraph.yaml");

fs.writeFileSync(outputPath, output, "utf8");

console.log(`✅ Generated subgraph.yaml for ${targetChain}`);
console.log(`📝 Configuration used:`);
console.log(`   Network: ${targetChain}`);
console.log(`   Intent Factory: ${config.intentFactory}`);
console.log(`   Start Block: ${chainConfig.startBlock}`);
console.log(`   Chain ID: ${chainConfig.chainId}`);
console.log(`   Tokens: ${tokens.length} token(s)`);
tokens.forEach((token, index) => {
    console.log(`     ${index + 1}. ${token.symbol}: ${token.address}`);
});
