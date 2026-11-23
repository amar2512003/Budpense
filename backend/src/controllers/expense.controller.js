import { matchedData } from "express-validator";

import { EXPENSE } from "../constants/enums.js";
import { alertForNewExpense } from "../services/budget.service.js";
import * as expenseService from "../services/expense.service.js";

/**
 * /expenses and /income are the same five handlers over the same collection,
 * differing only in the type they pin. The type comes from here and the owner
 * from the cookie, so neither can be steered by the request body.
 */
export default function createHandlers(type) {
  return {
    async create(req, res) {
      const record = await expenseService.createRecord(req.user.id, type, req.body);
      const data = { [type]: record };

      if (type === EXPENSE) {
        // The expense is already saved. Failing the request here would invite
        // the user to submit it again and record it twice.
        data.budgetAlert = await alertForNewExpense(req.user.id, record).catch((error) => {
          console.error("Budget alert check failed:", error.message);
          return null;
        });
      }

      res.status(201).json({ success: true, data });
    },

    async list(req, res) {
      // Express 5 exposes req.query through a getter, so express-validator
      // cannot write its sanitised values back onto it — every filter would
      // arrive as the raw string. matchedData returns the converted values, and
      // only the ones a validator claimed, so unknown parameters are dropped.
      const filters = matchedData(req, { locations: ["query"] });
      const result = await expenseService.listRecords(req.user.id, type, filters);

      res.json({ success: true, data: result });
    },

    async getOne(req, res) {
      const record = await expenseService.getRecord(req.user.id, type, req.params.id);

      res.json({ success: true, data: { [type]: record } });
    },

    async update(req, res) {
      const record = await expenseService.updateRecord(
        req.user.id,
        type,
        req.params.id,
        req.body,
      );

      res.json({ success: true, data: { [type]: record } });
    },

    async remove(req, res) {
      await expenseService.deleteRecord(req.user.id, type, req.params.id);

      res.json({ success: true, data: { id: req.params.id } });
    },
  };
}
