# Chainrails Subgraphs

Subgraph for monitoring intent funding across multiple EVM chains with multi-token support.

## Setup

```bash
yarn install
```

## Building

Build a subgraph for a specific chain:

```bash
yarn build:arbitrum-one
yarn build:base
yarn build:mainnet
# ... etc
```

## Deployment

### Basic Deployment (uses version from package.json)

Deploy a subgraph using the version specified in `package.json`:

```bash
yarn deploy:arbitrum-one
yarn deploy:base
yarn deploy:mainnet
# ... etc
```

### Deployment with Custom Version

Deploy with a specific version override:

```bash
# Using the deploy script directly
node scripts/deploy-subgraph.js arbitrum-one 1.2.0
node scripts/deploy-subgraph.js base 2.0.0
```

### Versioning

-   **Default**: The version from `package.json` is used automatically
-   **Override**: Pass a version as the second argument to the deploy script
-   **Format**: Versions are deployed as `chainrails/{chain-name}-v{version}` (e.g., `chainrails/arbitrum-one-v1.0.0`)

### Available Chains

**Mainnet:**

-   `arbitrum-one`
-   `avalanche`
-   `base`
-   `bsc`
-   `mainnet`

**Testnet:**

-   `arbitrum-sepolia`
-   `avalanche-testnet`
-   `base-sepolia`
-   `sepolia`

## Configuration

Chain configurations are stored in:

-   `config/mainnet.json` - Mainnet chain configurations
-   `config/testnet.json` - Testnet chain configurations

Each chain configuration includes:

-   `chainId` - Chain ID
-   `startBlock` - Starting block for indexing
-   `tokens` - Array of supported ERC20 tokens with addresses

## Development

Generate subgraph.yaml for a specific chain:

```bash
yarn prepare:arbitrum-one
```

Generate code and build:

```bash
yarn codegen
yarn build
```
