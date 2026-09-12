import * as dashboardService from "../services/dashboard.service.js";

export async function get(req, res) {
  const dashboard = await dashboardService.getDashboard(req.user.id);

  res.json({ success: true, data: dashboard });
}
