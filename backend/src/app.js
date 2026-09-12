import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import incomeRoutes from "./routes/income.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// Render/Railway terminate TLS at a proxy; without this the rate limiter sees
// every request as coming from the proxy's single IP.
if (env.isProduction) app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
// Must precede any route reading req.cookies.
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  }),
);
if (!env.isProduction) app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", environment: env.nodeEnv } });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
