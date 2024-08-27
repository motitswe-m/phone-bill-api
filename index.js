import express from "express";
import * as sqlite from "sqlite";
import sqlite3 from "sqlite3";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4011;

// Middleware setup
app.use(express.json());
app.use(express.static("public"));

// Initialize SQLite database and migrations
(async () => {
  const db = await sqlite.open({
    filename: "./data_plan.db",
    driver: sqlite3.Database,
  });

  await db.migrate();

  // Get all price plans
  app.get("/api/price_plans", async (req, res) => {
    try {
      const plans = await db.all("SELECT * FROM price_plan");
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve price plans" });
    }
  });

  // Create a new price plan
  app.post("/api/price_plan/create", async (req, res) => {
    const { name, sms_cost, call_cost } = req.body;
    try {
      await db.run(
        "INSERT INTO price_plan (plan_name, sms_price, call_price) VALUES (?, ?, ?)",
        [name, sms_cost, call_cost]
      );
      res.json({ status: "success" });
    } catch (err) {
      res.status(500).json({ error: "Failed to create price plan" });
    }
  });

  // Update a price plan
  app.post("/api/price_plan/update", async (req, res) => {
    const { name, sms_cost, call_cost } = req.body;
    try {
      await db.run(
        "UPDATE price_plan SET sms_price = ?, call_price = ? WHERE plan_name = ?",
        [sms_cost, call_cost, name]
      );
      res.json({ status: "success" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update price plan" });
    }
  });

  // Delete a price plan
  app.post("/api/price_plan/delete", async (req, res) => {
    const { id } = req.body;
    try {
      await db.run("DELETE FROM price_plan WHERE id = ?", [id]);
      res.json({ status: "success" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete price plan" });
    }
  });

  // Calculate phone bill total
  app.post("/api/phonebill", async (req, res) => {
    const { price_plan, actions } = req.body;
    try {
      const plan = await db.get(
        "SELECT * FROM price_plan WHERE plan_name = ?",
        [price_plan]
      );

      if (!plan) {
        return res.status(400).json({ error: "Invalid price plan" });
      }

      const actionsArray = actions.split(",").map((action) => action.trim());
      let total = 0;

      actionsArray.forEach((action) => {
        if (action === "sms") {
          total += plan.sms_price;
        } else if (action === "call") {
          total += plan.call_price;
        }
      });

      res.json({ total });
    } catch (err) {
      res.status(500).json({ error: "Failed to calculate phone bill total" });
    }
  });

  // Start the server
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})();
