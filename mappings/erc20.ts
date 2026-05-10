import {
    DestinationIntentIndex,
    DestinationFundingTransaction,
    FundingTransaction,
    Intent,
    Token
} from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";
import { getChainIdFromNetwork } from "./chain-utils";
import { Transfer } from "../generated/USDC/ERC20";
import { WatchedIntentAddress } from "../generated/schema";

export function handleERC20Transfer(event: Transfer): void {
    const toAddress = event.params.to.toHexString().toLowerCase();
    let intent = Intent.load(toAddress);
    let isDestination = false;

    if (intent === null) {
        const idx = DestinationIntentIndex.load(toAddress);
        if (idx !== null) {
            intent = Intent.load(idx.intent);
            if (intent === null) return;
            isDestination = true;
        }
    }

    // Destination-side funding: only record USDC transfers into addresses that were prefilled
    // (derived from RelayerHub.IntentPrefilled on this chain).
    const watched = WatchedIntentAddress.load(toAddress);
    if (watched !== null) {
        const watchedToken = watched.tokenAddress;
        const tokenAddr = event.address.toHexString().toLowerCase();
        // AssemblyScript string comparison should use `==` (value equality).
        if (watchedToken == null || watchedToken == tokenAddr) {
            const id =
                event.transaction.hash.toHexString() +
                "-" +
                event.logIndex.toString();
            const tx = new DestinationFundingTransaction(id);
            tx.intentAddress = toAddress;
            tx.fromAddress = event.params.from.toHexString().toLowerCase();
            tx.tokenAddress = tokenAddr;
            tx.amount = event.params.value;
            tx.chainId = getChainIdFromNetwork().toI32();
            tx.save();
        }
    }

    if (intent === null) {
        return;
    }

    const tokenAddress = event.address.toHexString();
    const chainId = getChainIdFromNetwork().toI32();

    log.info(
        "Detected ERC20 transfer event to intent address: {} token: {} amount: {}",
        [
            toAddress,
            tokenAddress,
            event.params.value.toString()
        ]
    );

    let token = Token.load(tokenAddress);
    if (token === null) {
        token = new Token(tokenAddress);
        token.address = tokenAddress;
        token.chainId = chainId;
        token.save();
    }

    const fundingTxId =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const fundingTx = new FundingTransaction(fundingTxId);

    fundingTx.intent = intent.id;
    fundingTx.token = token.id;
    fundingTx.tokenAddress = tokenAddress; // Keep for backward compatibility
    fundingTx.amount = event.params.value;
    fundingTx.chainId = chainId;
    fundingTx.isDestination = isDestination;

    intent.status = "FUNDED";
    intent.totalFunded = intent.totalFunded.plus(event.params.value);

    intent.save();
    fundingTx.save();

    log.info(
        "Handled ERC20 transfer event to intent address: {} token: {} amount: {}",
        [
            event.params.to.toHexString(),
            tokenAddress,
            event.params.value.toString()
        ]
    );
}
