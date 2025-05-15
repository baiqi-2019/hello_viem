'use client';

import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useChainId, 
  useChains, 
  useReadContract,
  useWriteContract,
  useBalance,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { readContract } from 'wagmi/actions'; // 从wagmi/actions导入readContract
import { config } from './providers'; // 从providers.tsx导入config
import { injected, walletConnect } from 'wagmi/connectors';
import Counter_ABI from './contracts/Counter.json';
import NFTMarket_ABI from './contracts/NFTMarket.json';
import Link from 'next/link';

// 合约地址
const COUNTER_ADDRESS = "0x7148E9A2d539A99a66f1bd591E4E20cA35a08eD5";
const NFTMARKET_ADDRESS = "0xF1Fdf263226C94Fb8664C3f3Acdf176b607E5460";
// 假设我们有一个ERC20代币地址和一个NFT合约地址
const ERC20_TOKEN_ADDRESS = "0x77c1693F22B49381984377B190a15922b89fb64C";
// 修正NFT合约地址，添加0x前缀
const NFT_CONTRACT_ADDRESS = "0x892D34881031069B9CB0EB443ED82F4c73514148";

// 创建WalletConnect连接器
const projectId = 'f219d703444c6e1a29c755144d3bcd5e'; // 替换为您的WalletConnect项目ID

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();
  const currentChain = chains.find(chain => chain.id === chainId);

  // 状态变量
  const [activeTab, setActiveTab] = useState('counter'); // 'counter', 'list', 'buy'
  const [nftContractAddress, setNftContractAddress] = useState(NFT_CONTRACT_ADDRESS);
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [listingId, setListingId] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 使用 useBalance 获取余额
  const { data: balance } = useBalance({
    address,
  });

  // 使用 useReadContract 读取合约数据
  const { data: counterNumber, refetch: refetchCounter } = useReadContract({
    address: COUNTER_ADDRESS as `0x${string}`,
    abi: Counter_ABI,
    functionName: 'number',
  });

  // 读取NFTMarket合约的nextListingId
  const { data: nextListingId, refetch: refetchListingId } = useReadContract({
    address: NFTMARKET_ADDRESS as `0x${string}`,
    abi: NFTMarket_ABI.abi,
    functionName: 'nextListingId',
  });

  // 使用 useWriteContract 写入合约数据
  const { 
    writeContract,
    isPending,
    data: hash,
    isSuccess,
    isError,
    error
  } = useWriteContract();

  // 等待交易完成
  const { 
    isLoading: isWaiting, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  // 处理Counter增加
  const handleIncrement = () => {
    writeContract({
      address: COUNTER_ADDRESS as `0x${string}`,
      abi: Counter_ABI,
      functionName: 'increment',
    });
  };

  // 处理NFT上架
  const handleListNFT = () => {
    if (!nftContractAddress || !tokenId || !price) {
      alert('请填写所有必填字段');
      return;
    }

    writeContract({
      address: NFTMARKET_ADDRESS as `0x${string}`,
      abi: NFTMarket_ABI.abi,
      functionName: 'list',
      args: [
        nftContractAddress,
        BigInt(tokenId),
        BigInt(price)
      ],
    });
  };

  // 处理NFT购买
  const handleBuyNFT = (id: string) => {
    writeContract({
      address: NFTMARKET_ADDRESS as `0x${string}`,
      abi: NFTMarket_ABI.abi,
      functionName: 'buyNFT',
      args: [BigInt(id)],
    });
  };

  // 获取上架列表
  const fetchListings = async () => {
    if (!nextListingId) return;
    
    setIsLoading(true);
    const newListings = [];
    
    for (let i = 0; i < Number(nextListingId); i++) {
      try {
        // 修改这里，添加config参数
        const listing = await readContract(config, {
          address: NFTMARKET_ADDRESS as `0x${string}`,
          abi: NFTMarket_ABI.abi,
          functionName: 'listings',
          args: [BigInt(i)] as const,
        });
        
        // 显示所有列表项，包括非活跃的
        console.log("listing", listing);
        if (listing) { 
          // 修改这里，将listing作为数组处理
          newListings.push({
            id: i,
            seller: listing[0],
            nftContract: listing[1],
            tokenId: listing[2].toString(),
            price: listing[3].toString(),
            isActive: listing[4]
          });
        }
      } catch (error) {
        console.error(`Error fetching listing ${i}:`, error);
      }
    }
    
    setListings(newListings);
    setIsLoading(false);
  };

  // 监听交易完成状态
  useEffect(() => {
    if (isSuccess) {
      refetchCounter();
      refetchListingId();
      fetchListings();
    }
  }, [isSuccess, refetchCounter, refetchListingId]);

  // 当nextListingId变化时，获取上架列表
  useEffect(() => {
    if (nextListingId) {
      fetchListings();
    }
  }, [nextListingId]);

  // 辅助函数：截断地址显示
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 连接钱包处理函数
  const handleConnectMetaMask = () => {
    connect({ connector: injected() });
  };

  // 连接WalletConnect处理函数
  const handleConnectWalletConnect = () => {
    connect({ 
      connector: walletConnect({ 
        projectId,
        showQrModal: true,
        metadata: {
          name: 'NFT Market',
          description: 'NFT Market with WalletConnect',
          url: window.location.host,
          icons: [window.location.origin + '/vercel.svg']
        }
      })
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">NFT Market</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        {!isConnected ? (
          <div className="space-y-4">
            <button
              onClick={handleConnectMetaMask}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              连接 MetaMask
            </button>
            <button
              onClick={handleConnectWalletConnect}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
            >
              使用 WalletConnect 连接移动端钱包
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 现有的钱包信息显示 */}
            <div className="text-center">
              <p className="text-gray-600">钱包地址:</p>
              <p className="font-mono break-all">{address}</p>
              <Link href="/transfers" className="mt-2 inline-block text-blue-500 hover:underline">
                查看转账记录
              </Link>
            </div>
            <div className="text-center">
              <p className="text-gray-600">当前网络:</p>
              <p className="font-mono">
                {currentChain?.name || '未知网络'} (Chain ID: {chainId})
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">余额:</p>
              <p className="font-mono">
                {balance?.formatted || '0'} {balance?.symbol}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Counter 数值:</p>
              <p className="font-mono">{counterNumber?.toString() || '0'}</p>
              <button
                onClick={handleIncrement}
                disabled={isPending}
                className={`mt-2 w-full py-2 px-4 rounded transition-colors ${
                  isPending 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isPending ? '处理中...' : '增加计数'}
              </button>
              {isPending && (
                <p className="mt-2 text-gray-600">交易正在处理中...</p>
              )}
              {hash && (
                <p className="mt-2 text-blue-500">
                  交易哈希: {hash}
                </p>
              )}
              {isError && (
                <p className="mt-2 text-red-500">
                  错误: {error?.message}
                </p>
              )}
            </div>
            {/* 添加 NFT 上架表单 */}
            <div className="border-t pt-4">
              <h2 className="text-xl font-bold mb-4">上架 NFT</h2>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="NFT 合约地址"
                  value={nftContractAddress}
                  onChange={(e) => setNftContractAddress(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Token ID"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="价格"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleListNFT}
                  disabled={isPending}
                  className={`w-full py-2 px-4 rounded ${isPending ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                  {isPending ? '处理中...' : '上架 NFT'}
                </button>
              </div>
            </div>

            {/* 显示上架列表 */}
            <div className="border-t pt-4">
              <h2 className="text-xl font-bold mb-4">NFT 列表</h2>
              {isLoading ? (
                <p>加载中...</p>
              ) : listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="border p-4 rounded">
                      <p>卖家: {truncateAddress(listing.seller)}</p>
                      <p>NFT 合约: {truncateAddress(listing.nftContract)}</p>
                      <p>Token ID: {listing.tokenId}</p>
                      <p>价格: {listing.price}</p>
                      <button
                        onClick={() => handleBuyNFT(listing.id)}
                        disabled={isPending}
                        className={`mt-2 w-full py-2 px-4 rounded ${isPending ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
                      >
                        {isPending ? '处理中...' : '购买'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无上架的 NFT</p>
              )}
            </div>

            <button
              onClick={() => disconnect()}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
            >
              断开连接
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
