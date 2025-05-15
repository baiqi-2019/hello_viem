'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

// 修改 Transfer 接口以匹配后端数据结构
interface Transfer {
  id: number;
  tx_hash: string | null;
  from_address: string;
  to_address: string;
  value: string;
  block_number: number | null;
  token_address: string;
  timestamp: string;
}

export default function TransfersPage() {
  const { address, isConnected } = useAccount();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户转账记录
  const fetchTransfers = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/transfers/${address}`);
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("data111",data); // 打印数据以检查
      setTransfers(data);
    } catch (err) {
      console.error('获取转账记录失败:', err);
      setError(err instanceof Error ? err.message : '获取转账记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 当地址变化时获取转账记录
  useEffect(() => {
    if (isConnected && address) {
      fetchTransfers();
    } else {
      setTransfers([]);
    }
  }, [address, isConnected]);

  // 辅助函数：截断地址显示
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 格式化时间戳
  // 修改时间戳格式化函数
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // 添加格式化代币金额的函数
  const formatTokenAmount = (value: string, decimals: number = 18) => {
    // 将字符串转换为 BigInt
    const amount = BigInt(value);
    // 创建除数 (10^decimals)
    const divisor = BigInt(10 ** decimals);
    // 计算整数部分
    const integerPart = amount / divisor;
    // 计算小数部分
    const fractionalPart = amount % divisor;
    // 将小数部分转换为字符串并补零
    let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    // 移除末尾的0
    fractionalStr = fractionalStr.replace(/0+$/, '');
    // 如果小数部分为空，返回整数部分
    if (!fractionalStr) {
      return integerPart.toString();
    }
    // 组合整数和小数部分
    return `${integerPart}.${fractionalStr}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">转账记录</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="mb-4">
          <Link href="/" className="text-blue-500 hover:underline">
            &larr; 返回首页
          </Link>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-lg">请先连接您的钱包查看转账记录</p>
            <Link href="/" className="mt-4 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
              前往连接钱包
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-gray-600">钱包地址:</p>
              <p className="font-mono break-all">{address}</p>
              <button
                onClick={fetchTransfers}
                className="mt-2 bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition-colors"
              >
                刷新数据
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <p>加载中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
              </div>
            ) : transfers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">发送方</th>
                      <th className="py-3 px-6 text-left">接收方</th>
                      <th className="py-3 px-6 text-right">金额</th>
                      <th className="py-3 px-6 text-left">代币地址</th>
                      <th className="py-3 px-6 text-left">时间</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {transfers.map((transfer) => (
                      <tr key={transfer.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">
                          {truncateAddress(transfer.from_address)}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {truncateAddress(transfer.to_address)}
                        </td>
                        <td className="py-3 px-6 text-right font-mono">
                          {formatTokenAmount(transfer.value)} {/* 使用格式化函数 */}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {truncateAddress(transfer.token_address)}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {formatTimestamp(transfer.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>暂无转账记录</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}