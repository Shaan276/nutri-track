import { z } from "zod";

/**
 * Validation schema for user registration
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters long")
      .max(60, "Full name must be under 60 characters"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username must be under 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .max(100, "Email must be under 100 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be under 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Please enter your email or username"),
  password: z
    .string()
    .min(1, "Please enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
