import * as budgetService from "../services/budget.service.js";

export async function create(req, res) {
  const { category, amount, month, year, rollover } = req.body;
  const budget = await budgetService.createBudget(req.user.id, {
    category,
    amount,
    month,
    year,
    rollover,
  });

  res.status(201).json({ success: true, data: { budget } });
}

export async function list(req, res) {
  const budgets = await budgetService.listBudgets(req.user.id);

  res.json({ success: true, data: { budgets } });
}

export async function getOne(req, res) {
  const budget = await budgetService.getBudget(req.user.id, req.params.id);

  res.json({ success: true, data: { budget } });
}

export async function update(req, res) {
  const { category, amount, month, year, rollover } = req.body;
  const budget = await budgetService.updateBudget(req.user.id, req.params.id, {
    category,
    amount,
    month,
    year,
    rollover,
  });

  res.json({ success: true, data: { budget } });
}

export async function remove(req, res) {
  await budgetService.deleteBudget(req.user.id, req.params.id);

  res.json({ success: true, data: { id: req.params.id } });
}
