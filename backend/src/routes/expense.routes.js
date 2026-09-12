import { Router } from "express";

import { EXPENSE } from "../constants/enums.js";
import createHandlers from "../controllers/expense.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idRule, listRules, recordRules } from "../validators/expense.js";

const expenses = createHandlers(EXPENSE);
const router = Router();

// Every route here reads and writes the caller's own records only.
router.use(protect);

router.post("/", recordRules(EXPENSE), validate, expenses.create);
router.get("/", listRules(EXPENSE), validate, expenses.list);
router.get("/:id", idRule, validate, expenses.getOne);
router.put("/:id", idRule, recordRules(EXPENSE), validate, expenses.update);
router.delete("/:id", idRule, validate, expenses.remove);

export default router;
