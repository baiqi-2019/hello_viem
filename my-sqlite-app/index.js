const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors()); // 🟢 允许所有来源跨域访问
app.use(express.json());

app.get('/transfers/:address', (req, res) => {
  const address = req.params.address.toLowerCase();
  db.all(
    `SELECT * FROM transfers WHERE LOWER(from_address) = ? OR LOWER(to_address) = ? ORDER BY block_number DESC`,
    [address, address],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(3000, () => {
  console.log('REST API running on http://localhost:3000');
});
