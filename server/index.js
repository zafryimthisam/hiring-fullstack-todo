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

//Get all TODO items
app.get("/api/todos", async (req, res) => {
  try {
    const allTodos = await todos.find();
    res.json(allTodos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Create a new TODO item
app.post("/api/todos", async (req, res) => {
  try {
    const todo = await todos.create(req.body);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

//Update a TODO (title/description)
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTodo = await todos.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
        description: req.body.description,
      },
      { new: true, runValidators: true },
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Toggle the done status
app.patch("/api/todos/:id/done", async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await todos.findById(id);

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    todo.done = !todo.done;

    await todo.save();

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Delete a TODO
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTodo = await todos.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, async () => {
  console.log(`TODO server listening on PORT: ${port}`);
  await connectDB();
});
