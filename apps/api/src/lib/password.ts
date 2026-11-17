import argon2 from "argon2";

// تخزين كلمة المرور بصيغة مجزأة باستخدام Argon2id بدل حفظ النص الأصلي.
export async function hashPassword(
  password: string,
): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

// مقارنة كلمة المرور المدخلة بالتجزئة المخزنة دون كشف كلمة المرور الأصلية.
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}