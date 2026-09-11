import { Router } from "express";

import { INCOME } from "../constants/enums.js";
import createHandlers from "../controllers/expense.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idRule, listRules, recordRules } from "../validators/expense.js";

// The income side of the same collection: identical routes over the same
// controller and service, pinned to the income type.
const income = createHandlers(INCOME);
const router = Router();

router.use(protect);

router.post("/", recordRules(INCOME), validate, income.create);
router.get("/", listRules(INCOME), validate, income.list);
router.get("/:id", idRule, validate, income.getOne);
router.put("/:id", idRule, recordRules(INCOME), validate, income.update);
router.delete("/:id", idRule, validate, income.remove);

export default router;
