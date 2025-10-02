import { IntentCreated } from "../generated/IntentFactory/IntentFactory";
import { Intent, TokenAmount } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleIntentCreated(event: IntentCreated): void {
  const intent = new Intent(event.params.intentAddress.toHexString());

  intent.intentAddress = event.params.intentAddress;
  intent.sourceChain = event.params.intent.sourceChain;
  intent.destinationChain = event.params.intent.destinationChain;
  intent.destinationRecipient = event.params.intent.destinationRecipient;
  intent.coordinator = event.params.intent.coordinator;
  intent.bridger = event.params.intent.bridger;
  intent.refundAddress = event.params.intent.refundAddress;
  intent.nonce = event.params.intent.nonce;
  intent.expirationTimestamp = event.params.intent.expirationTimestamp;
  intent.status = "PENDING";
  intent.createdAt = event.block.timestamp;
  intent.totalFunded = BigInt.fromI32(0);

  const tokenAmounts: string[] = [];
  for (let i = 0; i < event.params.intent.bridgeTokenOutOptions.length; i++) {
    const tokenOption = event.params.intent.bridgeTokenOutOptions[i];
    const tokenAmountId = `${event.params.intentAddress.toHexString()}-${i}`;

    const tokenAmount = new TokenAmount(tokenAmountId);
    tokenAmount.token = tokenOption.token;
    tokenAmount.amount = tokenOption.amount;
    tokenAmount.intent = intent.id;
    tokenAmount.save();

    tokenAmounts.push(tokenAmountId);
  }

  intent.bridgeTokenOutOptions = tokenAmounts;
  intent.save();
}
