export const CONFIRMATION_MESSAGE_EMAIL = (
  code: number,
) => ` <p>Uz:\nSizning elektron pochtangiz manzilini tasdiqlash va ro'yxatdan o'tish jarayonini yakunlash uchun quyidagi tasdiqlash kodini kiriting:</p><h3><strong>${code}</strong></h3>\n,
   <p>Ru: \nДля подтверждения адреса электронной почты и завершения регистрации введите следующий код подтверждения:</p> <h3><strong>${code}</strong></h3>\n`;

export const CONFIRMATION_MESSAGE_PHONE = (code: number) =>
  `Uz: Tasdiqlash kodi : ${code}\nRu: Код подтверждения : ${code}`;
