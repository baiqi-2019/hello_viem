// watcher.js
const { ethers } = require('ethers');
const db = require('./db');

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const tokenAddress = '0x77c1693F22B49381984377B190a15922b89fb64C'; // 替换为你的ERC20 Token地址

let provider;
let token;

function createProvider() {
  console.log('[Watcher] Connecting to provider...');
  provider = new ethers.WebSocketProvider('wss://sepolia.infura.io/ws/v3/da2de9befd37454aa8dc594c122102f1');
  token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // 在 ethers.js v6 中，Provider 只支持特定的事件类型
  // 有效的事件包括: "block", "error", "network", "pending", "debug"
  provider.on('error', (err) => {
    console.error('[Watcher] Provider error:', err.message);
    reconnect();
  });

  // 我们不能直接监听 'close' 事件，但可以在 WebSocket 连接断开时通过其他方式处理
  // 可以使用定时检查或依赖 'error' 事件来处理重连

  token.on('Transfer', (from, to, value, event) => {
    recordTransfer({
      from,
      to,
      value,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
    });
    console.log(`Logged Transfer: ${from} -> ${to}, value: ${value.toString()}`);
  });
}

function reconnect() {
  setTimeout(() => {
    try {
      if (token) token.removeAllListeners();
      if (provider) provider.destroy();
    } catch (e) {
      console.error('[Watcher] Cleanup error:', e.message);
    }
    createProvider();
  }, 3000);
}

function recordTransfer({ from, to, value, transactionHash, blockNumber }) {
  db.run(
    `INSERT INTO transfers (tx_hash, from_address, to_address, value, block_number, token_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [transactionHash, from, to, value.toString(), blockNumber, tokenAddress]
  );
}

// 添加一个简单的错误处理，以防全局未捕获的错误
process.on('uncaughtException', (err) => {
  console.error('[Watcher] Uncaught exception:', err);
  reconnect();
});

createProvider();
