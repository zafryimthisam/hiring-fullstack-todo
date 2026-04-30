import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to TODO app Server!");
});

app.listen(port, () => {
  console.log(`TODO server listening on PORT: ${port}`);
});
