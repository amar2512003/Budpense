import { Router } from "express";

import * as userController from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { changePasswordRules, updateProfileRules } from "../validators/user.js";

const router = Router();

// Every route here acts on the signed-in user's own record and on no other, so
// the guard is mounted once for the whole router rather than route by route.
router.use(protect);

router.get("/me", userController.me);
router.put("/me", updateProfileRules, validate, userController.updateMe);
router.put("/change-password", changePasswordRules, validate, userController.changePassword);

export default router;
