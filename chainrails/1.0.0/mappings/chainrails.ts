import { IntentStarted } from "../generated/Chainrails/Chainrails";
import { Intent } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleIntentStarted(event: IntentStarted): void {
  const intentAddress = event.params.intentAddr.toHexString();
  const intent = Intent.load(intentAddress);

  if (intent == null) {
    return;
  }

  log.info("Detected IntentStarted event for: {}", [intentAddress]);

  intent.status = "INITIATED";
  intent.save();
}
