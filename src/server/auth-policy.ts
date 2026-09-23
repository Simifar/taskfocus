export const MIN_PASSWORD_LENGTH = 8;

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normaliseUsername(username: string): string {
  return username.trim();
}

export function normaliseDisplayName(name: string | null | undefined): string | null {
  const value = name?.trim();
  return value ? value : null;
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= 256;
}

export const GENERIC_REGISTRATION_ERROR = "Не удалось создать аккаунт. Проверьте введённые данные.";
