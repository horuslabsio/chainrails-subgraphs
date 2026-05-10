import { Bytes } from "@graphprotocol/graph-ts";
import {
    IntentStarted as IntentStartedEvent,
} from "../generated/Chainrails/Chainrails";
import {
    DestinationIntentIndex,
    Intent,
    PendingDestinationIntent
} from "../generated/schema";

function bytes32ToEvmAddressString(b32: Bytes): string {
    // EVM address is last 20 bytes of bytes32
    const hex = b32.toHexString(); // 0x + 64 hex
    if (hex.length != 66) return hex.toLowerCase();
    return ("0x" + hex.slice(26)).toLowerCase();
}

function upsertPending(txHashHex: string, destinationIntentBytes32: Bytes): void {
    const pending = new PendingDestinationIntent(txHashHex);
    pending.destinationIntentAddress = bytes32ToEvmAddressString(destinationIntentBytes32);
    pending.save();
}

function loadBytes32FromHead(data: Bytes, argIndex: i32): Bytes | null {
    // Transaction input layout: 4-byte selector + ABI head (32 bytes per argument)
    const total = data.length;
    const start = 4 + 32 * argIndex;
    const end = start + 32;
    if (total < end) return null;
    return Bytes.fromUint8Array(data.subarray(start, end));
}

function isEvmPaddedAddressBytes32(b32: Bytes): bool {
    // Expect the first 12 bytes to be 0x00 for a left-padded 20-byte address.
    if (b32.length != 32) return false;
    for (let i = 0; i < 12; i++) {
        if (b32[i] != 0) return false;
    }
    return true;
}

export function handleIntentStarted(event: IntentStartedEvent): void {
    const txHash = event.transaction.hash.toHexString();
    let pending = PendingDestinationIntent.load(txHash);

    // Fallback for chains/providers without traces: decode destinationIntentAddress from tx input.
    // For startIntent, destinationIntentAddress is argument index 3 in the ABI head.
    // For startBroadcastedIntent, destinationIntentAddress is argument index 5 in the ABI head.
    if (pending === null) {
        const input = event.transaction.input;
        const candidate3 = loadBytes32FromHead(input, 3);
        if (candidate3 !== null && isEvmPaddedAddressBytes32(candidate3 as Bytes)) {
            upsertPending(txHash, candidate3 as Bytes);
            pending = PendingDestinationIntent.load(txHash);
        } else {
            const candidate5 = loadBytes32FromHead(input, 5);
            if (
                candidate5 !== null &&
                isEvmPaddedAddressBytes32(candidate5 as Bytes)
            ) {
                upsertPending(txHash, candidate5 as Bytes);
                pending = PendingDestinationIntent.load(txHash);
            }
        }
    }

    if (pending === null) return;

    const intentAddress = event.params.intentAddr.toHexString().toLowerCase();
    const intent = Intent.load(intentAddress);
    if (intent === null) return;

    // Nullable boolean in Graph entities; proceed only when explicitly true.
    if (intent.needsRelay != true) return;

    const dest = pending.destinationIntentAddress.toLowerCase();
    intent.destinationIntentAddress = dest;
    intent.save();

    const idx = new DestinationIntentIndex(dest);
    idx.intent = intent.id;
    idx.save();
}

