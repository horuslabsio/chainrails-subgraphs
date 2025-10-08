import { IntentStarted } from "../generated/Chainrails/Chainrails";
import { Intent } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleIntentStarted(event: IntentStarted): void {
    log.info("Detected IntentStarted event with intent address: {}", [
        event.params.intentAddr.toHexString()
    ]);

    const intentAddress = event.params.intentAddr.toHexString();
    const intent = Intent.load(intentAddress);

    if (intent === null) {
        return;
    }

    intent.status = "INITIATED";
    intent.save();

    log.info("Handled IntentStarted event with intent address: {}", [
        event.params.intentAddr.toHexString()
    ]);
}
