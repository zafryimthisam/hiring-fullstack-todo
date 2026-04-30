import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import todos from "./models/todos.js";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL);

app.get("/", (req, res) => {
  res.send("Welcome to TODO app Server!");
});
app.post("/api/todos", async (req, res) => {
  try {
    const todo = await todos.create(req.body);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

app.listen(port, async () => {
  console.log(`TODO server listening on PORT: ${port}`);
  await connectDB();
});
