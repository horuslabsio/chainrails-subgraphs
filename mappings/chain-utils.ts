import { dataSource, BigInt } from "@graphprotocol/graph-ts";

export function getChainIdFromNetwork(): BigInt {
    const network = dataSource.network();

    if (network == "base-sepolia") {
        return BigInt.fromI32(84532);
    }

    if (network == "base") {
        return BigInt.fromI32(8453);
    }

    if (network == "arbitrum-sepolia") {
        return BigInt.fromI32(421614);
    }

    if (network == "arbitrum-one") {
        return BigInt.fromI32(42161);
    }

    if (network == "avalanche-testnet") {
        return BigInt.fromI32(43113);
    }

    if (network == "avalanche") {
        return BigInt.fromI32(43114);
    }

    if (network == "sepolia") {
        return BigInt.fromI32(11155111);
    }

    if (network == "mainnet") {
        return BigInt.fromI32(1);
    }

    if (network == "bsc") {
        return BigInt.fromI32(56);
    }

    return BigInt.zero();
}
