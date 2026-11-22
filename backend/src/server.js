import app from "./app.js";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";
import { generateDue } from "./services/recurring.service.js";

const HOUR_MS = 60 * 60 * 1000;

// Runs at boot as well as hourly, so entries that fell due while the server
// was down are created as soon as it is back.
function generateRecurring() {
  generateDue().catch((error) => {
    console.error("Generating recurring entries failed:", error.message);
  });
}

async function start() {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    generateRecurring();
    setInterval(generateRecurring, HOUR_MS);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
