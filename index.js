const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite
const db = new sqlite3.Database("./transactions.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create transactions table
db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    description TEXT,
    amount INTEGER,
    type TEXT,
    runningBalance INTEGER
)`);

// Get all transactions
app.get("/transactions", (req, res) => {
  db.all(`SELECT * FROM transactions ORDER BY date DESC`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

// Add a new transaction
app.post("/transactions", (req, res) => {
  const { date, description, amount, type } = req.body;

  db.get(
    `SELECT runningBalance FROM transactions ORDER BY date DESC LIMIT 1`,
    [],
    (err, row) => {
      if (err) {
        throw err;
      }

      let runningBalance = row ? row.runningBalance : 0;

      if (type === "Credit") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      db.run(
        `INSERT INTO transactions (date, description, amount, type, runningBalance) VALUES (?, ?, ?, ?, ?)`,
        [date, description, amount, type, runningBalance],
        function (err) {
          if (err) {
            return console.log(err.message);
          }
          res.json({
            id: this.lastID,
            date,
            description,
            amount,
            type,
            runningBalance,
          });
        }
      );
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
