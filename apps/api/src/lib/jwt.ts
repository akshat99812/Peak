import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;       // userId
  email: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  tokenId: string;   // RefreshToken.id in DB — allows targeted revocation
}

// ─── Access Token ──────────────────────────────────────────────────────────

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not set");

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m") as string,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not set");

  return jwt.verify(token, secret) as AccessTokenPayload;
}

// ─── Refresh Token ─────────────────────────────────────────────────────────

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not set");

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as string,
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not set");

  return jwt.verify(token, secret) as RefreshTokenPayload;
}

// ─── Cookie Helper ─────────────────────────────────────────────────────────

/** Number of ms the refresh cookie lives (matches JWT expiry). */
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days