import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  forgotPasswordRules,
  loginRules,
  registerRules,
  resetPasswordRules,
} from "../validators/auth.js";

// Credential endpoints get their own budget on top of the global 100/15 min:
// five attempts per IP per window makes password guessing impractical. A fresh
// limiter per route, so failed registrations don't spend the login allowance.
const credentialLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many attempts, please try again in 15 minutes.",
    },
  });

const router = Router();

router.post("/register", credentialLimiter(), registerRules, validate, authController.register);
router.post("/login", credentialLimiter(), loginRules, validate, authController.login);
// Unprotected and idempotent: clearing a cookie that is already gone, or was
// never valid, should still answer 200 rather than strand the client.
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);
// Limited like the other credential routes: without it this endpoint would
// happily issue reset links for an address list all afternoon.
router.post(
  "/forgot-password",
  credentialLimiter(),
  forgotPasswordRules,
  validate,
  authController.forgotPassword,
);
router.post("/reset-password/:token", resetPasswordRules, validate, authController.resetPassword);

export default router;
