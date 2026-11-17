// أنواع مشتركة بين تطبيقات المشروع لتوحيد العملات وأنواع المعاملات.
export type Currency = "EGP" | "USD" | "EUR";

// الأنواع المدعومة لتصنيف السجلات المالية.
export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "ADJUSTMENT";