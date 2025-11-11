import { FundingTransaction, Intent } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/USDC/ERC20";
import { getChainIdFromNetwork } from "./chain-utils";

export function handleUSDCTransfer(event: Transfer): void {
    const intentAddress = event.params.to.toHexString();
    const intent = Intent.load(intentAddress);

    if (intent === null) {
        return;
    }

    log.info("Detected USDC transfer event to intent address: {} amount: {}", [
        event.params.to.toHexString(),
        event.params.value.toString()
    ]);

    const fundingTxId =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const fundingTx = new FundingTransaction(fundingTxId);

    fundingTx.intent = intent.id;
    fundingTx.token = event.address.toHexString();
    fundingTx.amount = event.params.value;
    fundingTx.chainId = getChainIdFromNetwork().toI32();

    intent.status = "FUNDED";
    intent.totalFunded = intent.totalFunded.plus(event.params.value);

    intent.save();
    fundingTx.save();

    log.info("Handled USDC transfer event to intent address: {} amount: {}", [
        event.params.to.toHexString(),
        event.params.value.toString()
    ]);
}
