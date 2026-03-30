import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { REFRESH_COOKIE_MAX_AGE_MS } from "../lib/jwt";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  path: "/",
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, user } = await authService.register(req.body);

      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
      res.status(201).json({ success: true, data: { accessToken, user } });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, user } = await authService.login(req.body);

      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
      res.json({ success: true, data: { accessToken, user } });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token: string | undefined = req.cookies[REFRESH_COOKIE];
      if (!token) {
        res.status(401).json({ success: false, message: "No refresh token provided" });
        return;
      }

      const { accessToken, refreshToken, user } = await authService.refresh(token);

      // Rotate cookie
      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
      res.json({ success: true, data: { accessToken, user } });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token: string | undefined = req.cookies[REFRESH_COOKIE];
      if (token) await authService.logout(token);

      res.clearCookie(REFRESH_COOKIE, { path: "/" });
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logoutAll(req.user!.sub);

      res.clearCookie(REFRESH_COOKIE, { path: "/" });
      res.json({ success: true, message: "Logged out from all devices" });
    } catch (err) {
      next(err);
    }
  },
};