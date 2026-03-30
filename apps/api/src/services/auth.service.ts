import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_MAX_AGE_MS,
} from "../lib/jwt";
import { ApiError } from "../lib/ApiError";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema";

const SALT_ROUNDS = 12;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Strip passwordHash before sending user to client */
function sanitizeUser(user: { passwordHash: string; [key: string]: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

function getRefreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS);
}

// ─── Service ───────────────────────────────────────────────────────────────

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw ApiError.conflict("Email is already in use");

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: "", // placeholder — we need the record id first
        expiresAt: getRefreshExpiry(),
      },
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    });

    // Store the actual signed token
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return { accessToken, refreshToken, user: sanitizeUser(user) };
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) throw ApiError.unauthorized("Invalid email or password");

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: "",
        expiresAt: getRefreshExpiry(),
      },
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    });

    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return { accessToken, refreshToken, user: sanitizeUser(user) };
  },

  async refresh(incomingToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(incomingToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.token !== incomingToken ||
      storedToken.expiresAt < new Date()
    ) {
      throw ApiError.unauthorized("Refresh token is invalid or has been revoked");
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const { user } = storedToken;

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const newRefreshRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: "",
        expiresAt: getRefreshExpiry(),
      },
    });

    const newRefreshToken = signRefreshToken({
      sub: user.id,
      tokenId: newRefreshRecord.id,
    });

    await prisma.refreshToken.update({
      where: { id: newRefreshRecord.id },
      data: { token: newRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
  },

  async logout(incomingToken: string) {
    try {
      const payload = verifyRefreshToken(incomingToken);
      await prisma.refreshToken.deleteMany({
        where: { id: payload.tokenId },
      });
    } catch {
      // Token already invalid — silently succeed
    }
  },

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};