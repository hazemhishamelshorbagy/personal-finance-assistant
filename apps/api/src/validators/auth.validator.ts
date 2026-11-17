import { z } from "zod";

// اشتقاق نوع TypeScript من مخطط التسجيل لتجنب تكرار تعريف الحقول.
export type RegisterInput = z.infer<typeof registerSchema>;

// التحقق من البريد وكلمة المرور والاسم الاختياري عند إنشاء الحساب.
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .optional(),
});

// قواعد التحقق من بيانات تسجيل الدخول.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});