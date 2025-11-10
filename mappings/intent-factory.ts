import { IntentDeclared } from "../generated/IntentFactory/IntentFactory";
import { Intent, TokenAmount } from "../generated/schema";
import { BigInt, log, dataSource } from "@graphprotocol/graph-ts";

export function handleIntentDeclared(event: IntentDeclared): void {
    log.info("Detected IntentDeclared event with intent address: {}", [
        event.params.intentAddress.toHexString()
    ]);

    const context = dataSource.context();
    const chainId = context.get("chainId")!.toI32();

    const intent = new Intent(event.params.intentAddress.toHexString());

    intent.intentAddress = event.params.intentAddress.toHexString();
    intent.sourceChain = event.params.intent.sourceChain;
    intent.destinationChain = event.params.intent.destinationChain;
    intent.chainId = chainId;
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
