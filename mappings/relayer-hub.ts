import { BigInt } from "@graphprotocol/graph-ts";
import { IntentPrefilled } from "../generated/RelayerHub/RelayerHub";
import { PrefillEvent, WatchedIntentAddress } from "../generated/schema";
import { getChainIdFromNetwork } from "./chain-utils";

export function handleIntentPrefilled(event: IntentPrefilled): void {
    const intentAddr = event.params.intentAddr.toHexString().toLowerCase();

    let watched = WatchedIntentAddress.load(intentAddr);
    if (watched === null) {
        watched = new WatchedIntentAddress(intentAddr);
        watched.createdAtBlock = event.block.number;
        watched.createdAtTimestamp = event.block.timestamp;
    }

    watched.tokenAddress = event.params.token.toHexString().toLowerCase();
    watched.save();

    const id =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const prefill = new PrefillEvent(id);
    prefill.intentAddress = intentAddr;
    prefill.relayer = event.params.relayer.toHexString().toLowerCase();
    prefill.tokenAddress = watched.tokenAddress as string;
    prefill.amount = event.params.amount;
    prefill.chainId = getChainIdFromNetwork().toI32();
    prefill.save();
}

