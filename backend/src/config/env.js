import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Every other module imports from here rather than reading process.env directly,
// so a missing variable fails once at boot instead of surfacing as undefined deep
// inside a request.
const REQUIRED = [
  "PORT",
  "NODE_ENV",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
];

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      `Copy backend/.env.example to backend/.env and fill them in.`,
  );
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a positive integer, received "${process.env.PORT}".`);
}

const env = {
  port,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  // CORS cannot use a wildcard origin with credentialed requests, so this is required.
  clientUrl: process.env.CLIENT_URL,
  isProduction: process.env.NODE_ENV === "production",
};

export default env;
