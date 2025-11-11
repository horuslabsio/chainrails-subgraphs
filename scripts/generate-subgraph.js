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

// Prepare template data - convert numbers to strings for Goldsky compatibility
const templateData = {
    network: targetChain,
    intentFactory: config.intentFactory,
    startBlock: config["networks"][targetChain].startBlock,
    usdcAddress: config["networks"][targetChain].usdcAddress,
    chainId: String(config["networks"][targetChain].chainId)
};

// Generate subgraph.yaml
const output = Mustache.render(template, templateData);
const outputPath = path.join(__dirname, "../subgraph.yaml");

fs.writeFileSync(outputPath, output, "utf8");

console.log(`✅ Generated subgraph.yaml for ${targetChain}`);
console.log(`📝 Configuration used:`);
console.log(JSON.stringify(templateData, null, 2));
