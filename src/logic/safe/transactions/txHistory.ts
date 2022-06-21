import { MultisigTransactionRequest, proposeTransaction, TransactionDetails } from '@gnosis.pm/safe-react-gateway-sdk'

import { GnosisSafe } from 'src/types/contracts/gnosis_safe.d'
import { _getChainId } from 'src/config'

import { checksumAddress } from 'src/utils/checksumAddress'
import { TxArgs } from '../store/models/types/transaction'

type ProposeTxBody = Omit<MultisigTransactionRequest, 'safeTxHash'> & {
  safeInstance: GnosisSafe
  data: string | number[]
}

const calculateBodyFrom = async ({
  safeInstance,
  to,
  value,
  data,
  operation,
  nonce,
  safeTxGas,
  baseGas,
  gasPrice,
  gasToken,
  refundReceiver,
  sender,
  origin,
  signature,
}: ProposeTxBody): Promise<MultisigTransactionRequest> => {
  const safeTxHash = await safeInstance.methods
    .getTransactionHash(to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver || '', nonce)
    .call()

  return {
    to: checksumAddress(to),
    value,
    data,
    operation,
    nonce: nonce.toString(),
    safeTxGas: safeTxGas.toString(),
    baseGas: baseGas.toString(),
    gasPrice,
    gasToken,
    refundReceiver,
    safeTxHash,
    sender: checksumAddress(sender),
    origin,
    signature,
  }
}

type SaveTxToHistoryTypes = TxArgs & { origin?: string | null; signature?: string }

export const saveTxToHistory = async ({
  baseGas,
  data,
  gasPrice,
  gasToken,
  nonce,
  operation,
  origin,
  refundReceiver,
  safeInstance,
  safeTxGas,
  sender,
  signature,
  to,
  valueInWei,
}: SaveTxToHistoryTypes): Promise<TransactionDetails> => {
  const address = checksumAddress(safeInstance.options.address)
  const body = await calculateBodyFrom({
    safeInstance,
    to,
    value: valueInWei,
    data,
    operation,
    nonce: nonce.toString(),
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    sender,
    origin: origin ? origin : null,
    signature,
  })
  // const txDetails = await proposeTransaction(_getChainId(), address, body)
  // return txDetails
  return {
    safeAddress: address,
    txId: `multisig_${address}_${body.safeTxHash}`,
    executedAt: null,
    // @ts-ignore
    txStatus: 'AWAITING_CONFIRMATIONS',
    // @ts-ignore
    txInfo: null,
    // @ts-ignore
    txData: null,
    // @ts-ignore
    detailedExecutionInfo: {
      type: 'MULTISIG',
      submittedAt: 1655810622986,
      nonce,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver: { value: refundReceiver, name: '', logoUri: '' },
      safeTxHash: body.safeTxHash,
      executor: null,
      signers: [],
      confirmationsRequired: 0,
      confirmations: [
        {
          signer: {
            value: body.sender,
            name: '',
            logoUri: '',
          },
          signature: body.signature!,
          submittedAt: 1655810623086,
        },
      ],
    },
    txHash: null,
  }
}
