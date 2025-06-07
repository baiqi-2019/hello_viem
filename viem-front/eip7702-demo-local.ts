import { createPublicClient, createWalletClient, http, encodeFunctionData, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import SimpleDelegateContract_ABI from './app/contracts/SimpleDelegateContract.json';
import TokenBank_ABI from './app/contracts/TokenBank.json';
import ERC20_ABI from './app/contracts/ERC20.json';

// 部署的合约地址
const TOKEN_ADDRESS = "0x1a243f7191e7A4847cA3b1cC5Ca0122C1F48BD93";
const TOKEN_BANK_ADDRESS = "0x749053271a455750e77c9C1e0c1e23234CC50843";
const DELEGATE_CONTRACT_ADDRESS = "0x32C0249bBa639b8Da96A97E5c996ca1b122862b1";

// 注意：这里需要替换为你的私钥
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

async function demonstrateEIP7702() {
  if (!PRIVATE_KEY) {
    console.error('请设置PRIVATE_KEY环境变量');
    return;
  }

  // 创建本地账户（支持EIP-7702）
  const account = privateKeyToAccount(PRIVATE_KEY);
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://eth-sepolia.public.blastapi.io'),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http('https://eth-sepolia.public.blastapi.io'),
  });

  console.log('🚀 开始EIP-7702演示...');
  console.log('账户地址:', account.address);
  
  try {
    // 检查Token余额
    const tokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    
    console.log('Token余额:', tokenBalance);
    
    const depositAmount = parseEther('10'); // 存款10个Token
    
    // 第1步：生成EIP-7702授权
    console.log('第1步：生成EIP-7702授权...');
    const authorization = await walletClient.signAuthorization({
      contractAddress: DELEGATE_CONTRACT_ADDRESS,
      executor: 'self'
    });
    
    console.log('✅ EIP-7702授权生成成功');
    
    // 第2步：准备批量调用数据
    console.log('第2步：准备批量调用数据...');
    const approveCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [TOKEN_BANK_ADDRESS, depositAmount],
    });
    
    const depositCalldata = encodeFunctionData({
      abi: TokenBank_ABI,
      functionName: 'deposit',
      args: [depositAmount],
    });

    const calls = [
      {
        to: TOKEN_ADDRESS,
        data: approveCalldata,
        value: BigInt(0),
      },
      {
        to: TOKEN_BANK_ADDRESS,
        data: depositCalldata,
        value: BigInt(0),
      },
    ];
    
    // 第3步：执行EIP-7702批量交易
    console.log('第3步：执行EIP-7702批量交易...');
    
    const hash = await walletClient.writeContract({
      address: account.address, // 使用EOA地址，它现在有delegate代码
      abi: SimpleDelegateContract_ABI.abi,
      functionName: 'execute',
      args: [calls],
      authorizationList: [authorization],
    });
    
    console.log('🎉 EIP-7702交易发送成功！');
    console.log('交易哈希:', hash);
    console.log('Sepolia浏览器链接:', `https://sepolia.etherscan.io/tx/${hash}`);
    
    // 等待交易确认
    console.log('等待交易确认...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log('✅ 交易确认成功！');
    console.log('Gas使用量:', receipt.gasUsed);
    console.log('区块号:', receipt.blockNumber);
    
    // 检查最终状态
    const finalTokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    
    const depositBalance = await publicClient.readContract({
      address: TOKEN_BANK_ADDRESS,
      abi: TokenBank_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    
    console.log('\n=== 最终状态 ===');
    console.log('Token余额:', finalTokenBalance);
    console.log('存款余额:', depositBalance);
    console.log('EIP-7702演示完成！🎊');
    
  } catch (error) {
    console.error('❌ EIP-7702演示失败:', error);
  }
}

// 运行演示
demonstrateEIP7702().catch(console.error); 