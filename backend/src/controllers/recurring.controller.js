import * as recurringService from "../services/recurring.service.js";

/** Pinned to one type, like the expense handlers. */
export default function createHandlers(type) {
  return {
    async create(req, res) {
      const rule = await recurringService.createRule(req.user.id, type, req.body);

      res.status(201).json({ success: true, data: { recurring: rule } });
    },

    async list(req, res) {
      const items = await recurringService.listRules(req.user.id, type);

      res.json({ success: true, data: { items } });
    },

    async update(req, res) {
      const rule = await recurringService.updateRule(req.user.id, type, req.params.id, req.body);

      res.json({ success: true, data: { recurring: rule } });
    },

    async remove(req, res) {
      await recurringService.deleteRule(req.user.id, type, req.params.id);

      res.json({ success: true, data: { id: req.params.id } });
    },
  };
}
