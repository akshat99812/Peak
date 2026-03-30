import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login
authRouter.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/refresh  — reads httpOnly cookie
authRouter.post("/refresh", authController.refresh);

// POST /api/auth/logout   — clears the refresh cookie
authRouter.post("/logout", authController.logout);

// POST /api/auth/logout-all  — revokes all refresh tokens for this user
authRouter.post("/logout-all", authenticate, authController.logoutAll);