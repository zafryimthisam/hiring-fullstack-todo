import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGODB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Mongoose connected!");
  } catch (error) {
    console.log("Connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
