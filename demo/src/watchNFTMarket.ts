import {
    createPublicClient,
    formatEther,
    http,
    publicActions,
    parseEventLogs,
    type AbiEvent,
} from "viem";
import { foundry } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// 使用index.ts中定义的地址
const NFTMARKET_ADDRESS = "0xF1Fdf263226C94Fb8664C3f3Acdf176b607E5460";

// NFTMarket合约的事件ABI定义
const NFT_MARKET_EVENTS = [
    {
        type: "event",
        name: "NFTListed",
        inputs: [
            { type: "uint256", name: "listingId", indexed: true },
            { type: "address", name: "seller", indexed: true },
            { type: "address", name: "nftContract", indexed: true },
            { type: "uint256", name: "tokenId" },
            { type: "uint256", name: "price" }
        ]
    },
    {
        type: "event",
        name: "NFTSold",
        inputs: [
            { type: "uint256", name: "listingId", indexed: true },
            { type: "address", name: "buyer", indexed: true },
            { type: "address", name: "seller", indexed: true },
            { type: "address", name: "nftContract" },
            { type: "uint256", name: "tokenId" },
            { type: "uint256", name: "price" }
        ]
    },
    {
        type: "event",
        name: "NFTListingCancelled",
        inputs: [
            { type: "uint256", name: "listingId", indexed: true }
        ]
    }
] as const;

const main = async () => {
    // 创建公共客户端
    const publicClient = createPublicClient({
        chain: foundry,
        transport: http(process.env.RPC_URL!),
    }).extend(publicActions);

    console.log('开始监听 NFTMarket 合约事件...');
    console.log(`监听地址: ${NFTMARKET_ADDRESS}`);

    // 监听NFT上架事件
    const unwatchListed = publicClient.watchEvent({
        address: NFTMARKET_ADDRESS,
        event: NFT_MARKET_EVENTS[0] as AbiEvent,
        onLogs: (logs) => {
            logs.forEach((log) => {
                // 解析事件日志
                const parsedLogs = parseEventLogs({
                    abi: [NFT_MARKET_EVENTS[0]],
                    logs: [log],
                });
                
                if (parsedLogs.length > 0) {
                    const eventData = parsedLogs[0];
                    console.log('\n检测到新的NFT上架事件:');
                    console.log(`上架ID: ${eventData.args.listingId}`);
                    console.log(`卖家: ${eventData.args.seller}`);
                    console.log(`NFT合约: ${eventData.args.nftContract}`);
                    console.log(`Token ID: ${eventData.args.tokenId}`);
                    console.log(`价格: ${formatEther(eventData.args.price)} ETH`);
                    console.log(`交易哈希: ${log.transactionHash}`);
                    console.log(`区块号: ${log.blockNumber}`);
                }
            });
        }
    });

    // 监听NFT售出事件
    const unwatchSold = publicClient.watchEvent({
        address: NFTMARKET_ADDRESS,
        event: NFT_MARKET_EVENTS[1] as AbiEvent,
        onLogs: (logs) => {
            logs.forEach((log) => {
                // 解析事件日志
                const parsedLogs = parseEventLogs({
                    abi: [NFT_MARKET_EVENTS[1]],
                    logs: [log],
                });
                
                if (parsedLogs.length > 0) {
                    const eventData = parsedLogs[0];
                    console.log('\n检测到新的NFT售出事件:');
                    console.log(`上架ID: ${eventData.args.listingId}`);
                    console.log(`买家: ${eventData.args.buyer}`);
                    console.log(`卖家: ${eventData.args.seller}`);
                    console.log(`NFT合约: ${eventData.args.nftContract}`);
                    console.log(`Token ID: ${eventData.args.tokenId}`);
                    console.log(`价格: ${formatEther(eventData.args.price)} ETH`);
                    console.log(`交易哈希: ${log.transactionHash}`);
                    console.log(`区块号: ${log.blockNumber}`);
                }
            });
        }
    });

    // 监听NFT上架取消事件
    const unwatchCancelled = publicClient.watchEvent({
        address: NFTMARKET_ADDRESS,
        event: NFT_MARKET_EVENTS[2] as AbiEvent,
        onLogs: (logs) => {
            logs.forEach((log) => {
                // 解析事件日志
                const parsedLogs = parseEventLogs({
                    abi: [NFT_MARKET_EVENTS[2]],
                    logs: [log],
                });
                
                if (parsedLogs.length > 0) {
                    const eventData = parsedLogs[0];
                    console.log('\n检测到NFT上架取消事件:');
                    console.log(`上架ID: ${eventData.args.listingId}`);
                    console.log(`交易哈希: ${log.transactionHash}`);
                    console.log(`区块号: ${log.blockNumber}`);
                }
            });
        }
    });

    // 保持程序运行
    process.on('SIGINT', () => {
        console.log('\n停止监听...');
        unwatchListed();
        unwatchSold();
        unwatchCancelled();
        process.exit();
    });
};

main().catch((error) => {
    console.error('发生错误:', error);
    process.exit(1);
});