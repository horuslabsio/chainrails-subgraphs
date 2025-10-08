import {
    IntentDeclared,
    IntentCreated
} from "../generated/IntentFactory/IntentFactory";
import { Intent, TokenAmount } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

export function handleIntentDeclared(event: IntentDeclared): void {
    log.info("Detected IntentDeclared event with intent address: {}", [
        event.params.intentAddress.toHexString()
    ]);

    const intent = new Intent(event.params.intentAddress.toHexString());

    intent.intentAddress = event.params.intentAddress.toHexString();
    intent.sourceChain = event.params.intent.sourceChain;
    intent.destinationChain = event.params.intent.destinationChain;
    intent.destinationRecipient =
        event.params.intent.destinationRecipient.toHexString();
    intent.coordinator = event.params.intent.coordinator.toHexString();
    intent.bridger = event.params.intent.bridger.toHexString();
    intent.refundAddress = event.params.intent.refundAddress.toHexString();
    intent.nonce = event.params.intent.nonce;
    intent.needsRelay = event.params.intent.needsRelay;
    intent.expirationTimestamp = event.params.intent.expirationTimestamp;
    intent.status = "DECLARED";

    intent.createdAt = event.block.timestamp;
    intent.totalFunded = BigInt.fromI32(0);
    intent.declarer = event.params.declarer.toHexString();

    const tokenAmounts: string[] = [];
    for (let i = 0; i < event.params.intent.bridgeTokenOutOptions.length; i++) {
        const tokenOption = event.params.intent.bridgeTokenOutOptions[i];
        const tokenAmountId = `${event.params.intentAddress.toHexString()}-${i}`;

        const tokenAmount = new TokenAmount(tokenAmountId);
        tokenAmount.token = tokenOption.token.toHexString();
        tokenAmount.amount = tokenOption.amount;
        tokenAmount.intent = intent.id;
        tokenAmount.save();

        tokenAmounts.push(tokenAmountId);
    }

    intent.bridgeTokenOutOptions = tokenAmounts;
    intent.save();

    log.info("Handled IntentDeclared event with intent address: {}", [
        event.params.intentAddress.toHexString()
    ]);
}

export function handleIntentCreated(event: IntentCreated): void {
    log.info("Detected IntentCreated event with intent address: {}", [
        event.params.intentAddress.toHexString()
    ]);

    const intentAddress = event.params.intentAddress.toHexString();
    const intent = Intent.load(intentAddress);

    if (intent == null) {
        return;
    }

    intent.status = "PENDING";
    intent.creator = event.params.creator.toHexString();

    intent.save();

    log.info("Handled IntentCreated event with intent address: {}", [
        event.params.intentAddress.toHexString()
    ]);
}
