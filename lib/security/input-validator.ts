/**
 * Input Validation - XSS, SQL Injection ve diğer güvenlik tehditlerini önler
 */

/**
 * HTML karakterlerini escape et (XSS koruması)
 */
export function sanitizeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * SQL Injection karakterlerini temizle
 */
export function sanitizeSql(input: string): string {
  // Tehlikeli SQL karakterlerini kaldır
  return input.replace(/['";\\]/g, '');
}

/**
 * Email validasyonu (RFC 5322 standardına yakın)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Uzunluk kontrolü
  if (email.length > 254) {
    return false;
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > 64 || domain.length > 253) {
    return false;
  }

  return true;
}

/**
 * Güçlü şifre kontrolü
 */
export function isStrongPassword(password: string): { 
  valid: boolean; 
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  // Minimum uzunluk
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Büyük harf
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermelidir');
  } else {
    score += 1;
  }

  // Küçük harf
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermelidir');
  } else {
    score += 1;
  }

  // Rakam
  if (!/[0-9]/.test(password)) {
    errors.push('En az bir rakam içermelidir');
  } else {
    score += 1;
  }

  // Özel karakter
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('En az bir özel karakter içermelidir');
  } else {
    score += 1;
  }

  // Yaygın şifreler kontrolü
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', '111111', '123123', 'admin', 'letmein'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Çok yaygın bir şifre kullanıyorsunuz');
    score = Math.max(0, score - 2);
  }

  // Strength hesaplama
  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Telefon numarası validasyonu (Türkiye formatı)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Türk telefon formatları: +905xxxxxxxxx, 05xxxxxxxxx, 5xxxxxxxxx
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * URL validasyonu
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Genel string validasyonu - tehlikeli karakterleri kontrol et
 */
export function isCleanString(input: string, options?: {
  allowSpaces?: boolean;
  allowSpecialChars?: boolean;
  maxLength?: number;
}): { valid: boolean; error?: string } {
  const {
    allowSpaces = true,
    allowSpecialChars = false,
    maxLength = 1000,
  } = options || {};

  if (input.length > maxLength) {
    return { valid: false, error: `Maksimum ${maxLength} karakter olmalıdır` };
  }

  // Script tag kontrolü (XSS)
  if (/<script|<iframe|javascript:|onerror=/i.test(input)) {
    return { valid: false, error: 'Geçersiz karakterler içeriyor' };
  }

  // SQL Injection kontrolü
  if (/(\bOR\b|\bAND\b).*=|['";]--/i.test(input)) {
    return { valid: false, error: 'Geçersiz karakterler içeriyor' };
  }

  if (!allowSpaces && /\s/.test(input)) {
    return { valid: false, error: 'Boşluk karakteri içeremez' };
  }

  if (!allowSpecialChars && /[^a-zA-Z0-9\s]/.test(input)) {
    return { valid: false, error: 'Özel karakterler içeremez' };
  }

  return { valid: true };
}

/**
 * IBAN validasyonu (Türkiye)
 */
export function isValidIban(iban: string): boolean {
  const cleanIban = iban.replace(/[\s-]/g, '').toUpperCase();
  
  // TR ile başlamalı ve 26 karakter olmalı
  if (!cleanIban.startsWith('TR') || cleanIban.length !== 26) {
    return false;
  }

  // Mod 97 kontrolü (IBAN algoritması)
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  );

  let remainder = '';
  for (const digit of numeric) {
    remainder = (parseInt(remainder + digit, 10) % 97).toString();
  }

  return remainder === '1';
}

/**
 * TC Kimlik No validasyonu
 */
export function isValidTcKimlikNo(tcKimlik: string): boolean {
  if (!/^\d{11}$/.test(tcKimlik) || tcKimlik[0] === '0') {
    return false;
  }

  const digits = tcKimlik.split('').map(Number);
  
  // İlk 10 rakamın toplamının mod 10'u 11. rakama eşit olmalı
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) {
    return false;
  }

  // 1,3,5,7,9. rakamların toplamının 7 katından 2,4,6,8. rakamların toplamını çıkarıp
  // mod 10'unu aldığımızda 10. rakama eşit olmalı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  if ((oddSum * 7 - evenSum) % 10 !== digits[9]) {
    return false;
  }

  return true;
}

/**
 * Kredi kartı numarası validasyonu (Luhn algoritması)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Luhn algoritması
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
