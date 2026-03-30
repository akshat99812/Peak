import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/ApiError";
import type { UpdateUserInput } from "../schemas/user.schema";

const SALT_ROUNDS = 12;

function sanitizeUser(user: { passwordHash: string; [key: string]: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export const userService = {
  async findAll() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    return sanitizeUser(user);
  },

  async update(id: string, data: UpdateUserInput) {
    // Check email uniqueness if changing email
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) throw ApiError.conflict("Email is already in use");
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return sanitizeUser(user);
  },

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw ApiError.unauthorized("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    await prisma.user.delete({ where: { id } });
  },
};