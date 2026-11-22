import { Router } from "express";

import createHandlers from "../controllers/recurring.controller.js";
import validate from "../middleware/validate.middleware.js";
import {
  idRule,
  recurringCreateRules,
  recurringUpdateRules,
} from "../validators/expense.js";

/** Mounted at /expenses/recurring and /income/recurring, behind their auth. */
export default function recurringRoutes(type) {
  const handlers = createHandlers(type);
  const router = Router();

  router.post("/", recurringCreateRules(type), validate, handlers.create);
  router.get("/", handlers.list);
  router.put("/:id", idRule, recurringUpdateRules(type), validate, handlers.update);
  router.delete("/:id", idRule, validate, handlers.remove);

  return router;
}
