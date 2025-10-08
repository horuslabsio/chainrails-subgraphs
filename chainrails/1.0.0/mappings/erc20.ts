import { FundingTransaction, Intent, TokenAmount } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/USDC/ERC20";

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
    fundingTx.sender = event.params.from.toHexString();
    fundingTx.transactionHash = event.transaction.hash.toHexString();
    fundingTx.blockNumber = event.block.number;
    fundingTx.timestamp = event.block.timestamp;
    fundingTx.save();

    intent.status = "FUNDED";
    intent.fundedAt = event.block.timestamp;
    intent.totalFunded = intent.totalFunded.plus(event.params.value);

    intent.save();

    log.info("Handled USDC transfer event to intent address: {} amount: {}", [
        event.params.to.toHexString(),
        event.params.value.toString()
    ]);
}
