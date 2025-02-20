const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to SQLite database
let db = new sqlite3.Database("./transactions.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

// Route to handle root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Example API endpoint to get transactions
app.get("/transactions", (req, res) => {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      data: rows,
    });
  });
});

// Example API endpoint to add a transaction
app.post("/api/transactions", (req, res) => {
  const { date, description, amount, type } = req.body;

  // Get the last transaction to calculate runningBalance
  db.get(
    "SELECT runningBalance FROM transactions ORDER BY date DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      let runningBalance = row ? row.runningBalance : 0;

      if (type.toLowerCase() === "credit") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      // Insert the new transaction
      db.run(
        `INSERT INTO transactions (date, description, amount, type, runningBalance) VALUES (?, ?, ?, ?, ?)`,
        [date, description, amount, type, runningBalance],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
