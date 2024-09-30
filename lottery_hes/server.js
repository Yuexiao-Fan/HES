const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析POST请求的body

// 创建数据库连接
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678", // 替换为你的数据库密码
  database: "HES", // 替换为你的数据库名
});

db.connect((err) => {
  if (err) {
    console.error("数据库连接失败:", err);
  } else {
    console.log("已连接到数据库");
  }
});

// 获取奖品库存数据的API
app.get("/api/prizes", (req, res) => {
  db.query("SELECT prize_name, stock FROM prizeStock", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "数据库查询失败" });
    }
    res.json(results);
  });
});

// 更新奖品库存的API
app.post("/api/update-prize", (req, res) => {
  const { prizeName } = req.body;
  db.query(
    "UPDATE prizeStock SET stock = stock - 1 WHERE prize_name = ? AND stock > 0",
    [prizeName],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "更新库存失败" });
      }
      res.json({ success: true });
    }
  );
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器正在端口 ${PORT} 上运行`);
});
