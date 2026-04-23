import crypto from "crypto";

/**
 * Генерирует инициалы из имени или email
 */
export function getInitials(name?: string, email?: string): string {
  if (name) {
    // Разделяем имя на слова и берем первые буквы
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return words
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");
    } else {
      // Если одно слово, берем первые 2 символа
      return name.slice(0, 2).toUpperCase();
    }
  }
  
  if (email) {
    // Для email берем первые 2 символа до @
    const localPart = email.split("@")[0];
    return localPart.slice(0, 2).toUpperCase();
  }
  
  return "?";
}

/**
 * Генерирует цвет для аватара на основе строки
 */
export function getAvatarColor(input?: string): string {
  if (!input) return "#6b7280"; // gray-500 по умолчанию
  
  const colors = [
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#f59e0b", // amber-500
    "#eab308", // yellow-500
    "#84cc16", // lime-500
    "#22c55e", // green-500
    "#10b981", // emerald-500
    "#14b8a6", // teal-500
    "#06b6d4", // cyan-500
    "#0ea5e9", // sky-500
    "#3b82f6", // blue-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#a855f7", // purple-500
    "#d946ef", // fuchsia-500
    "#ec4899", // pink-500
    "#f43f5e", // rose-500
  ];
  
  // Создаем хеш из строки и выбираем цвет
  const hash = crypto.createHash("md5").update(input).digest("hex");
  const index = parseInt(hash.slice(0, 8), 16) % colors.length;
  
  return colors[index];
}

/**
 * Проверяет, является ли URL валидным изображением
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Проверяем протокол
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Проверяем домен (избегаем localhost и приватные сети)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.startsWith("127.") || hostname.startsWith("192.168.")) {
      return false;
    }
    
    // Проверяем расширение файла
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const pathname = parsedUrl.pathname.toLowerCase();
    
    return imageExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes("/avatar") || 
           pathname.includes("/image") ||
           pathname.includes("/photo");
  } catch {
    return false;
  }
}

/**
 * Создает URL для Gravatar
 */
export function getGravatarUrl(email: string, size = 80): string {
  const cleanEmail = email.toLowerCase().trim();
  const hash = crypto.createHash("md5").update(cleanEmail).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

/**
 * Получает URL аватара с приоритетом: пользовательский URL > Gravatar
 */
export function getAvatarUrl(avatarUrl?: string | null, email?: string | null, size = 80): string | null {
  if (avatarUrl && isValidImageUrl(avatarUrl)) {
    return avatarUrl;
  }
  
  if (email) {
    return getGravatarUrl(email, size);
  }
  
  return null;
}
