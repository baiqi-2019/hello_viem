'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, WagmiProvider, createConfig } from 'wagmi';
import { foundry, optimism, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// 创建WalletConnect项目ID（您需要从WalletConnect获取一个项目ID）
const projectId = 'f219d703444c6e1a29c755144d3bcd5e';

// 导出config对象，使其可以在其他文件中使用
export const config = createConfig({
  chains: [foundry, optimism, sepolia],
  transports: {
    [foundry.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http('https://eth-sepolia.public.blastapi.io'),
  },
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}