import {
    IntentDeclared,
    IntentCreated
} from "../generated/IntentFactory/IntentFactory";
import { Intent, TokenAmount } from "../generated/schema";
import { BigInt, log, DataSourceTemplate } from "@graphprotocol/graph-ts";

export function handleIntentDeclared(event: IntentDeclared): void {
    let intentAddr = event.params.intentAddress.toHexString();

    log.info("1. Detected IntentDeclared for intent: {}", [intentAddr]);

    // Skip if already indexed (in case both IntentDeclared and IntentCreated fire)
    if (Intent.load(intentAddr) !== null) {
        log.info("Intent already exists for: {}, skipping", [intentAddr]);
        return;
    }

    const intent = new Intent(intentAddr);

    intent.intentAddress = intentAddr;
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
    intent.metadata = event.params.intent.metadata.toHexString();
    intent.status = "PENDING";
    intent.totalFunded = BigInt.fromI32(0);

    log.info("2. Intent fields set for: {}", [intentAddr]);

    const tokenAmounts: string[] = [];
    const optionsLen = event.params.intent.bridgeTokenOutOptions.length;
    log.info("3. bridgeTokenOutOptions length: {}", [optionsLen.toString()]);

    for (let i = 0; i < optionsLen; i++) {
        const tokenOption = event.params.intent.bridgeTokenOutOptions[i];
        const tokenAmountId = intentAddr + "-" + i.toString();

        const tokenAmount = new TokenAmount(tokenAmountId);
        tokenAmount.token = tokenOption.token.toHexString();
        tokenAmount.amount = tokenOption.amount;
        tokenAmount.intent = intent.id;
        tokenAmount.save();

        tokenAmounts.push(tokenAmountId);
    }

    intent.bridgeTokenOutOptions = tokenAmounts;

    log.info("4. Saving intent entity for: {}", [intentAddr]);
    intent.save();

    log.info("5. Intent saved. Creating template for: {}", [intentAddr]);

    DataSourceTemplate.create("Intent", [intentAddr]);

    log.info("6. Template created for: {}", [intentAddr]);
}

export function handleIntentCreated(event: IntentCreated): void {
    let intentAddr = event.params.intentAddress.toHexString();

    log.info("1. Detected IntentCreated for intent: {}", [intentAddr]);

    // Skip if already indexed (in case both IntentDeclared and IntentCreated fire)
    if (Intent.load(intentAddr) !== null) {
        log.info("Intent already exists for: {}, skipping", [intentAddr]);
        return;
    }

    const intent = new Intent(intentAddr);

    intent.intentAddress = intentAddr;
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
    intent.metadata = event.params.intent.metadata.toHexString();
    intent.status = "PENDING";
    intent.totalFunded = BigInt.fromI32(0);

    log.info("2. Intent fields set for: {}", [intentAddr]);

    const tokenAmounts: string[] = [];
    const optionsLen = event.params.intent.bridgeTokenOutOptions.length;
    log.info("3. bridgeTokenOutOptions length: {}", [optionsLen.toString()]);

    for (let i = 0; i < optionsLen; i++) {
        const tokenOption = event.params.intent.bridgeTokenOutOptions[i];
        const tokenAmountId = intentAddr + "-" + i.toString();

        const tokenAmount = new TokenAmount(tokenAmountId);
        tokenAmount.token = tokenOption.token.toHexString();
        tokenAmount.amount = tokenOption.amount;
        tokenAmount.intent = intent.id;
        tokenAmount.save();

        tokenAmounts.push(tokenAmountId);
    }

    intent.bridgeTokenOutOptions = tokenAmounts;

    log.info("4. Saving intent entity for: {}", [intentAddr]);
    intent.save();

    log.info("5. Intent saved. Creating template for: {}", [intentAddr]);

    DataSourceTemplate.create("Intent", [intentAddr]);

    log.info("6. Template created for: {}", [intentAddr]);
}
