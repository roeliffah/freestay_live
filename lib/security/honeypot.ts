/**
 * Honeypot - Bot saldırılarını tespit etmek için gizli alan
 * Gerçek kullanıcılar görmez, botlar doldurur
 */

export interface HoneypotField {
  name: string;
  value: string;
  timestamp: number;
}

/**
 * Honeypot field oluştur
 * CSS ile gizlenecek, botlar dolduracak
 */
export function createHoneypot(): HoneypotField {
  return {
    name: 'website', // Bot'ların genelde doldurduğu bir field adı
    value: '',
    timestamp: Date.now(),
  };
}

/**
 * Honeypot kontrolü - Bot tespit et
 */
export function validateHoneypot(
  honeypotValue: string,
  honeypotTimestamp: number
): { isBot: boolean; reason?: string } {
  // Honeypot doldurulduysa bot
  if (honeypotValue && honeypotValue.trim() !== '') {
    return { isBot: true, reason: 'Honeypot field filled' };
  }

  // Çok hızlı form submission (< 2 saniye) - muhtemelen bot
  const submissionTime = Date.now() - honeypotTimestamp;
  if (submissionTime < 2000) {
    return { isBot: true, reason: 'Submission too fast' };
  }

  // Çok yavaş form submission (> 30 dakika) - session timeout olabilir
  if (submissionTime > 30 * 60 * 1000) {
    return { isBot: true, reason: 'Session timeout' };
  }

  return { isBot: false };
}

/**
 * Honeypot field için CSS class
 */
export const honeypotClassName = 'hnpt-field';

/**
 * Honeypot CSS stilleri (form componentlerine eklenecek)
 */
export const honeypotStyles = `
  .${honeypotClassName} {
    position: absolute !important;
    left: -9999px !important;
    width: 1px !important;
    height: 1px !important;
    opacity: 0 !important;
    pointer-events: none !important;
    tab-index: -1 !important;
  }
`;
