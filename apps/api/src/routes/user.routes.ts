import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate, requireRoles } from "../middleware/auth.middleware";
import { updateUserSchema, userIdParamSchema } from "../schemas/user.schema";

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticate);

// GET /api/users — ADMIN only
userRouter.get("/", requireRoles("ADMIN"), userController.getAll);

// GET /api/users/:id — ADMIN or own profile
userRouter.get("/:id", validate(userIdParamSchema), userController.getOne);

// PATCH /api/users/:id — ADMIN or own profile
userRouter.patch(
  "/:id",
  validate(userIdParamSchema),
  validate(updateUserSchema),
  userController.update
);

// PATCH /api/users/:id/password — own profile only
userRouter.patch("/:id/password", validate(userIdParamSchema), userController.updatePassword);

// DELETE /api/users/:id — ADMIN only
userRouter.delete("/:id", validate(userIdParamSchema), requireRoles("ADMIN"), userController.delete);