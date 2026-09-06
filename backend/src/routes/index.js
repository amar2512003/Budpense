import { Router } from "express";

import { isDBConnected } from "../config/db.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      db: isDBConnected() ? "connected" : "disconnected",
    },
  });
});

export default router;
