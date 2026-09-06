import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFound from "./middleware/notFound.js";
import routes from "./routes/index.js";

const app = express();

// Render and Railway put the app behind a proxy. Without this the rate limiter
// sees the proxy's IP for every request and puts all users in one bucket.
if (env.isProduction) {
  app.set("trust proxy", 1);
}

app.use(helmet());

// Explicit origin: a wildcard cannot be combined with credentialed requests.
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Try again later.",
    },
  })
);

if (!env.isProduction) {
  app.use(morgan("dev"));
}

app.use("/api", routes);

app.use(notFound);
app.use(errorMiddleware);

export default app;
