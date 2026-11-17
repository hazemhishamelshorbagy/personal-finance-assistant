// خطأ خاص بأخطاء التطبيق التي تحتاج إلى رمز HTTP محدد.
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);

    // تمييز هذا الخطأ ليتعامل معه معالج الأخطاء العام.
    this.name = "AppError";
  }
}