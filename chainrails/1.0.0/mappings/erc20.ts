import { FundingTransaction, Intent, TokenAmount } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/USDC/ERC20";

export function handleUSDCTransfer(event: Transfer): void {
  const intentAddress = event.params.to.toHexString();
  const intent = Intent.load(intentAddress);

  if (intent == null) {
    return;
  }

  log.info("Funding detected for intent: {} amount: {}", [
    intentAddress,
    event.params.value.toString()
  ]);

  const fundingTxId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const fundingTx = new FundingTransaction(fundingTxId);

  fundingTx.intent = intent.id;
  fundingTx.token = event.address;
  fundingTx.amount = event.params.value;
  fundingTx.sender = event.params.from;
  fundingTx.transactionHash = event.transaction.hash;
  fundingTx.blockNumber = event.block.number;
  fundingTx.timestamp = event.block.timestamp;
  fundingTx.save();

  intent.totalFunded = intent.totalFunded.plus(event.params.value);

  const requiredAmount = getRequiredFundingAmount(intent);

  if (intent.totalFunded.ge(requiredAmount)) {
    intent.status = "FUNDED";
    intent.fundedAt = event.block.timestamp;
    log.info("Intent {} is now fully funded", [intentAddress]);
  }

  intent.save();
}

function getRequiredFundingAmount(intent: Intent): BigInt {
  if (intent.bridgeTokenOutOptions.length > 0) {
    const firstTokenAmount = TokenAmount.load(intent.bridgeTokenOutOptions[0]);
    if (firstTokenAmount) {
      return firstTokenAmount.amount;
    }
  }
  return BigInt.fromI32(0);
}
