import { FundingTransaction, Intent, Token } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";
import { getChainIdFromNetwork } from "./chain-utils";
import { Transfer } from "../generated/USDC/ERC20";

export function handleERC20Transfer(event: Transfer): void {
    const intentAddress = event.params.to.toHexString();
    const intent = Intent.load(intentAddress);

    if (intent === null) {
        return;
    }

    const tokenAddress = event.address.toHexString();
    const chainId = getChainIdFromNetwork().toI32();

    log.info(
        "Detected ERC20 transfer event to intent address: {} token: {} amount: {}",
        [
            event.params.to.toHexString(),
            tokenAddress,
            event.params.value.toString()
        ]
    );

    let token = Token.load(tokenAddress);
    if (token === null) {
        token = new Token(tokenAddress);
        token.address = tokenAddress;
        token.chainId = chainId;
        token.save();
    }

    const fundingTxId =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const fundingTx = new FundingTransaction(fundingTxId);

    fundingTx.intent = intent.id;
    fundingTx.token = token.id;
    fundingTx.tokenAddress = tokenAddress; // Keep for backward compatibility
    fundingTx.amount = event.params.value;
    fundingTx.chainId = chainId;

    intent.status = "FUNDED";
    intent.totalFunded = intent.totalFunded.plus(event.params.value);

    intent.save();
    fundingTx.save();

    log.info(
        "Handled ERC20 transfer event to intent address: {} token: {} amount: {}",
        [
            event.params.to.toHexString(),
            tokenAddress,
            event.params.value.toString()
        ]
    );
}
