import app from "./app.js";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";

const start = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
};

start();
