import { Router } from "express";

import * as budgetController from "../controllers/budget.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { budgetRules, idRule } from "../validators/budget.js";

const router = Router();

// Budgets belong to the caller and to nobody else.
router.use(protect);

router.post("/", budgetRules, validate, budgetController.create);
router.get("/", budgetController.list);
router.get("/:id", idRule, validate, budgetController.getOne);
router.put("/:id", idRule, budgetRules, validate, budgetController.update);
router.delete("/:id", idRule, validate, budgetController.remove);

export default router;
