import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, { message: 'Name is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export class RegisterDto implements z.infer<typeof RegisterSchema> {
  email: string
  name: string
  password: string
}

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export class LoginDto implements z.infer<typeof LoginSchema> {
  email: string
  password: string
}
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export class RefreshTokenDto implements z.infer<typeof RefreshTokenSchema> {
  refreshToken: string
}