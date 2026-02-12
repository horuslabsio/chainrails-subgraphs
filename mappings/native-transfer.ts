import { FundingTransaction, Intent, Token } from "../generated/schema";
import { log, dataSource } from "@graphprotocol/graph-ts";
import { getChainIdFromNetwork } from "./chain-utils";
import { NativeTransfer } from "../generated/templates/Intent/Intent";

// Native ETH token address (standard representation for native tokens)
const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleNativeTransfer(event: NativeTransfer): void {
    // Get the intent address from the data source context
    // The template data source is created for each intent address
    const intentAddress = dataSource.address().toHexString();

    log.info(
        "handleNativeTransfer called for address: {} from: {} to: {} amount: {}",
        [
            intentAddress,
            event.params.from.toHexString(),
            event.params.to.toHexString(),
            event.params.amount.toString()
        ]
    );

    const intent = Intent.load(intentAddress);

    if (intent === null) {
        log.info(
            "Intent not found for address: {} - NativeTransfer event may be for a non-tracked intent",
            [intentAddress]
        );
        return; // Not an intent address (shouldn't happen, but safety check)
    }

    const chainId = getChainIdFromNetwork().toI32();

    log.info(
        "Detected native ETH transfer to intent address: {} from: {} amount: {}",
        [
            intentAddress,
            event.params.from.toHexString(),
            event.params.amount.toString()
        ]
    );

    // Create or load native ETH token entity
    let token = Token.load(NATIVE_ETH_ADDRESS);
    if (token === null) {
        token = new Token(NATIVE_ETH_ADDRESS);
        token.address = NATIVE_ETH_ADDRESS;
        token.symbol = "ETH";
        token.name = "Ether";
        token.decimals = 18;
        token.chainId = chainId;
        token.save();
    }

    // Create funding transaction
    // Use transaction hash + log index as ID
    const fundingTxId =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    let fundingTx = FundingTransaction.load(fundingTxId);

    // Avoid duplicates (in case handler is called multiple times)
    if (fundingTx !== null) {
        return;
    }

    fundingTx = new FundingTransaction(fundingTxId);
    fundingTx.intent = intent.id;
    fundingTx.token = token.id;
    fundingTx.tokenAddress = NATIVE_ETH_ADDRESS;
    fundingTx.amount = event.params.amount;
    fundingTx.chainId = chainId;

    // Update intent status and total funded
    intent.status = "FUNDED";
    intent.totalFunded = intent.totalFunded.plus(event.params.amount);

    intent.save();
    fundingTx.save();

    log.info("Handled native ETH transfer to intent address: {} amount: {}", [
        intentAddress,
        event.params.amount.toString()
    ]);
}
