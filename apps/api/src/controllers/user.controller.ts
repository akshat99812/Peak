import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { ApiError } from "../lib/ApiError";

export const userController = {
  /** GET /api/users — ADMIN only */
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/users/:id — ADMIN or own profile */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requester = req.user!;

      // Users can only fetch their own profile unless they're an admin
      if (id !== requester.sub && !requester.roles.includes("ADMIN")) {
        throw ApiError.forbidden();
      }

      const user = await userService.findById(id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/users/:id — ADMIN or own profile */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requester = req.user!;

      if (id !== requester.sub && !requester.roles.includes("ADMIN")) {
        throw ApiError.forbidden();
      }

      const user = await userService.update(id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/users/:id/password — own profile only */
  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requester = req.user!;

      if (id !== requester.sub) throw ApiError.forbidden();

      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      if (!currentPassword || !newPassword) {
        throw ApiError.badRequest("currentPassword and newPassword are required");
      }

      await userService.updatePassword(id, currentPassword, newPassword);
      res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/users/:id — ADMIN only */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
};