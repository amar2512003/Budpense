import app from "./app.js";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";

async function start() {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
