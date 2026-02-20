#!/usr/bin/env node
/**
 * Fetches the latest block number for all supported chains and updates startBlock in config files.
 *
 * Note: startBlock determines where subgraph indexing begins. Updating to the latest block
 * is typically for new deployments. For existing subgraphs, keep startBlock at contract deployment.
 *
 * Usage:
 *   node scripts/update-start-blocks.js           # Update mainnet.json and testnet.json
 *   node scripts/update-start-blocks.js --dry-run # Fetch and display only, don't write
 *   node scripts/update-start-blocks.js mainnet   # Update only mainnet.json
 *   node scripts/update-start-blocks.js testnet   # Update only testnet.json
 */

const fs = require("fs");
const path = require("path");

// RPC endpoints for each chain (chainId -> url)
// Using public RPCs that don't require API keys
const CHAIN_RPC_URLS = {
  // Mainnet
  1: "https://eth.llamarpc.com",
  10: "https://mainnet.optimism.io",
  56: "https://bsc-dataseed.binance.org",
  137: "https://polygon.publicnode.com",
  42161: "https://arb1.arbitrum.io/rpc",
  43114: "https://api.avax.network/ext/bc/C/rpc",
  8453: "https://mainnet.base.org",
  143: "https://monad-mainnet.drpc.org",
  999: "https://rpc.hyperliquid.xyz/evm",
  1135: "https://rpc.api.lisk.com",
  // Testnet
  11155111: "https://ethereum-sepolia.publicnode.com",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
  43113: "https://api.avax-test.network/ext/bc/C/rpc",
  84532: "https://sepolia.base.org",
};

async function fetchBlockNumber(rpcUrl) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const hexBlock = data.result;
  return parseInt(hexBlock, 16);
}

async function updateConfig(configPath, dryRun) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const networkName = config.network;
  const networks = config.networks || {};

  console.log(`\n${networkName.toUpperCase()}`);
  console.log("─".repeat(50));

  let hasChanges = false;
  const updates = [];

  for (const [chainKey, chainConfig] of Object.entries(networks)) {
    const chainId = chainConfig.chainId;
    const rpcUrl = CHAIN_RPC_URLS[chainId];
    const oldBlock = chainConfig.startBlock;

    if (!rpcUrl) {
      console.log(`  ${chainKey} (${chainId}): No RPC URL configured, skipping`);
      continue;
    }

    try {
      const latestBlock = await fetchBlockNumber(rpcUrl);
      const changed = latestBlock !== oldBlock;

      if (changed) {
        hasChanges = true;
        updates.push({ chainKey, chainId, oldBlock, newBlock: latestBlock });
      }

      const changeStr = changed ? ` (was ${oldBlock})` : " (unchanged)";
      console.log(`  ${chainKey} (${chainId}): ${latestBlock}${changeStr}`);
    } catch (err) {
      console.log(`  ${chainKey} (${chainId}): ERROR - ${err.message}`);
    }
  }

  if (hasChanges && !dryRun && updates.length > 0) {
    for (const { chainKey, newBlock } of updates) {
      config.networks[chainKey].startBlock = newBlock;
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");
    console.log(`\n  ✓ Updated ${configPath}`);
  } else if (dryRun && updates.length > 0) {
    console.log(`\n  [dry-run] Would update ${updates.length} chain(s) in ${configPath}`);
  }

  return updates.length;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filter = args.find((a) => a === "mainnet" || a === "testnet");

  const configDir = path.join(__dirname, "../config");
  const configs = filter
    ? [`${filter}.json`]
    : ["mainnet.json", "testnet.json"];

  console.log("Fetching latest block numbers...");
  if (dryRun) {
    console.log("(dry-run mode - no files will be modified)\n");
  }

  let totalUpdates = 0;
  for (const configFile of configs) {
    const configPath = path.join(configDir, configFile);
    if (!fs.existsSync(configPath)) {
      console.log(`\nConfig not found: ${configPath}`);
      continue;
    }
    totalUpdates += await updateConfig(configPath, dryRun);
  }

  console.log("\nDone.");
  if (dryRun && totalUpdates > 0) {
    console.log("Run without --dry-run to apply changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
