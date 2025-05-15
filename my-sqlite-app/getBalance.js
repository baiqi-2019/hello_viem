const db = require('./db');

// 查询指定地址的余额
function getAddressBalance(address) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN to_address = ? THEN CAST(value AS DECIMAL) ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN from_address = ? THEN CAST(value AS DECIMAL) ELSE 0 END), 0) as total_out,
        COUNT(*) as total_transactions
      FROM transfers
      WHERE to_address = ? OR from_address = ?
    `;

    db.get(query, [address, address, address, address], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      const balance = row.total_in - row.total_out;
      resolve({
        address,
        balance: balance.toString(),
        totalIn: row.total_in.toString(),
        totalOut: row.total_out.toString(),
        totalTransactions: row.total_transactions
      });
    });
  });
}

// 查询所有地址的余额
function getAllBalances() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        address,
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as total_out,
        COUNT(*) as total_transactions
      FROM (
        SELECT 
          to_address as address,
          CAST(value AS DECIMAL) as amount,
          'in' as type
        FROM transfers
        UNION ALL
        SELECT 
          from_address as address,
          CAST(value AS DECIMAL) as amount,
          'out' as type
        FROM transfers
      ) t
      GROUP BY address
      HAVING total_in > 0 OR total_out > 0
      ORDER BY (total_in - total_out) DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const balances = rows.map(row => ({
        address: row.address,
        balance: (row.total_in - row.total_out).toString(),
        totalIn: row.total_in.toString(),
        totalOut: row.total_out.toString(),
        totalTransactions: row.total_transactions
      }));
      
      resolve(balances);
    });
  });
}

// 如果提供了地址参数，则查询特定地址的余额，否则查询所有地址的余额
const address = process.argv[2];
if (address) {
  getAddressBalance(address)
    .then(result => {
      console.log('地址余额信息：');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('查询失败：', err);
    })
    .finally(() => {
      db.close();
    });
} else {
  getAllBalances()
    .then(results => {
      console.log('所有地址余额信息：');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
      console.error('查询失败：', err);
    })
    .finally(() => {
      db.close();
    });
}