import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app";
import connectDB from "./config/database";

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
      throw error;
    });
  } catch (error) {
    console.log("MongoDB connection failed!", error);
    process.exit(1);
  }
};

startServer();
