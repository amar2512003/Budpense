import * as userService from "../services/user.service.js";

// protect has already loaded the profile for this request; /users/me returns
// it, while /auth/me uses the same lookup only to answer whether the session
// is still good.
export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

export async function updateMe(req, res) {
  // Read field by field: the id comes from the cookie, and nothing else in the
  // body is allowed anywhere near the document.
  const { name, email } = req.body;
  const user = await userService.updateProfile(req.user.id, { name, email });

  res.json({ success: true, data: { user } });
}

export async function changePassword(req, res) {
  const { currentPassword, password } = req.body;

  await userService.changePassword(req.user.id, { currentPassword, password });
  res.json({ success: true, data: { message: "Password updated" } });
}
