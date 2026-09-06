import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

// Resolve .env against the backend root, not the current working directory,
// so the server starts the same way from anywhere.
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
      "Copy backend/.env.example to backend/.env and fill them in."
  );
}

const env = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

env.isProduction = env.nodeEnv === "production";

export default env;
