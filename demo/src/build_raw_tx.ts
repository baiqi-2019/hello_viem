import { createWalletClient, encodeFunctionData, http, parseEther, parseGwei, type Hash, type TransactionReceipt } from 'viem'
import { prepareTransactionRequest } from 'viem/actions'
import { generatePrivateKey, mnemonicToAccount, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { createPublicClient, type PublicClient, type WalletClient } from 'viem'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
const erc20Abi = JSON.parse(
  readFileSync('./src/abis/BASEERC20.json', 'utf-8')
).abi


dotenv.config()

async function sendERC20Transaction(): Promise<any> {
  try {
    // 1. 从环境变量获取私钥
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`
    if (!privateKey) {
      throw new Error('请在 .env 文件中设置 PRIVATE_KEY')
    }

    // 2. 创建账户
    const account: PrivateKeyAccount = privateKeyToAccount(privateKey)
    const userAddress = account.address
    console.log('账户地址:', userAddress)

    // 3. 创建公共客户端
    const publicClient: PublicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL)
    })

    // 4. 创建钱包客户端
    const walletClient: WalletClient = createWalletClient({
      account: account,
      chain: sepolia,
      transport: http(process.env.RPC_URL)
    })

    // 5. 构建ERC20转账交易
    const txParams = {
      account: account,
      to: process.env.TOKEN_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [process.env.RECEIVER_ADDRESS as `0x${string}`, parseEther('1000')]
      }),
      chain: sepolia,
      chainId: sepolia.id,
      type: 'eip1559' as const,
      maxFeePerGas: parseGwei('20'),
      maxPriorityFeePerGas: parseGwei('1.5'),
      gas: 100000n
    }

    // 6. 准备交易
    const preparedTx = await prepareTransactionRequest(publicClient, txParams)
    console.log('准备后的交易参数:', preparedTx)

    // 7. 签名交易
    const signedTx = await walletClient.signTransaction(preparedTx)
    console.log('签名后的交易:', signedTx)

    // 8. 发送交易
    const txHash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTx
    })
    console.log('交易哈希:', txHash)

    // 9. 等待交易确认
    const receipt: TransactionReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    console.log('交易状态:', receipt.status === 'success' ? '成功' : '失败')
    console.log('区块号:', receipt.blockNumber)
    console.log('Gas 使用量:', receipt.gasUsed.toString())

    return txHash

  } catch (error) {
    console.error('错误:', error)
    if (error instanceof Error) {
      console.error('错误信息:', error.message)
    }
    throw error
  }
}

// 执行示例
sendERC20Transaction()