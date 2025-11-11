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

    if (network == "mainnet") {
        return BigInt.fromI32(1);
    }

    return BigInt.zero();
}
