import {
    IntentBroadcasted,
    BroadcastExecuted,
    BroadcastCancelled
} from "../generated/IntentBroadcaster/IntentBroadcaster";
import {
    Broadcast,
    BroadcastDeposit,
    BroadcastTokenAmount
} from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleIntentBroadcasted(event: IntentBroadcasted): void {
    const broadcastId = event.params.broadcastId;
    const broadcastIdHex = broadcastId.toHexString();

    log.info("IntentBroadcasted: broadcastId={}", [broadcastIdHex]);

    const broadcast = new Broadcast(broadcastIdHex);

    broadcast.broadcastId = broadcastId;
    broadcast.sender = event.params.sender;
    broadcast.sourceChain = event.params.sourceChain;
    broadcast.destinationChain = event.params.destinationChain;
    broadcast.destinationRecipient = event.params.recipient;
    broadcast.refundAddress = event.params.refundAddress;
    broadcast.broadcaster = event.params.broadcaster;
    broadcast.broadcastingContract = event.params.broadcastingContract;
    broadcast.isLive = event.params.isLive;
    broadcast.status = "PENDING";
    broadcast.blockNumber = event.block.number;
    broadcast.blockTimestamp = event.block.timestamp;
    broadcast.transactionHash = event.transaction.hash;

    broadcast.save();

    const deposits = event.params.deposits;
    for (let i = 0; i < deposits.length; i++) {
        const depositId = broadcastIdHex + "-" + i.toString();
        const deposit = new BroadcastDeposit(depositId);
        deposit.broadcast = broadcast.id;
        deposit.token = deposits[i].token;
        deposit.amount = deposits[i].amount;
        deposit.save();
    }

    const bridgeTokenOutOptions = event.params.bridgeTokenOutOptions;
    for (let i = 0; i < bridgeTokenOutOptions.length; i++) {
        const tokenAmountId = broadcastIdHex + "-out-" + i.toString();
        const tokenAmount = new BroadcastTokenAmount(tokenAmountId);
        tokenAmount.broadcast = broadcast.id;
        tokenAmount.token = bridgeTokenOutOptions[i].token;
        tokenAmount.amount = bridgeTokenOutOptions[i].amount;
        tokenAmount.save();
    }

    log.info("IntentBroadcasted saved: broadcastId={}", [broadcastIdHex]);
}

export function handleBroadcastExecuted(event: BroadcastExecuted): void {
    const broadcastIdHex = event.params.broadcastId.toHexString();

    const broadcast = Broadcast.load(broadcastIdHex);
    if (broadcast === null) {
        log.warning("BroadcastExecuted: broadcast not found for id={}", [
            broadcastIdHex
        ]);
        return;
    }

    broadcast.status = "EXECUTED";
    broadcast.save();

    log.info("BroadcastExecuted: broadcastId={}", [broadcastIdHex]);
}

export function handleBroadcastCancelled(event: BroadcastCancelled): void {
    const broadcastIdHex = event.params.broadcastId.toHexString();

    const broadcast = Broadcast.load(broadcastIdHex);
    if (broadcast === null) {
        log.warning("BroadcastCancelled: broadcast not found for id={}", [
            broadcastIdHex
        ]);
        return;
    }

    broadcast.status = "CANCELLED";
    broadcast.save();

    log.info("BroadcastCancelled: broadcastId={}", [broadcastIdHex]);
}
