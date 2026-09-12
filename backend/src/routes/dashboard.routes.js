import { Router } from "express";

import * as dashboardController from "../controllers/dashboard.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = Router();

// Summarises the caller's own ledger and nothing else.
router.use(protect);

router.get("/", dashboardController.get);

export default router;
