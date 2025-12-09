/**
 * Rate Limiter - Brute Force ve Spam ataklarına karşı koruma
 * IP bazlı deneme sınırlaması ve zaman bazlı kısıtlamalar
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;      // Maksimum deneme sayısı
  windowMs: number;         // Zaman penceresi (ms)
  blockDurationMs: number;  // Bloke süresi (ms)
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  
  constructor() {
    this.store = new Map();
    // Her 5 dakikada bir eski kayıtları temizle
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * IP adresinin rate limit durumunu kontrol et
   */
  check(
    identifier: string, 
    config: RateLimitConfig = {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,      // 15 dakika
      blockDurationMs: 30 * 60 * 1000 // 30 dakika
    }
  ): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Daha önce bloke edilmiş mi kontrol et
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockedUntil,
      };
    }

    // Yeni entry veya zaman penceresi dolmuşsa sıfırla
    if (!entry || (now - entry.firstAttempt > config.windowMs)) {
      this.store.set(identifier, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
      };
    }

    // Deneme sayısını artır
    entry.attempts += 1;
    entry.lastAttempt = now;

    // Limit aşıldı mı?
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      this.store.set(identifier, entry);
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockedUntil,
      };
    }

    this.store.set(identifier, entry);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - entry.attempts,
    };
  }

  /**
   * Başarılı işlem sonrası counter'ı sıfırla
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Eski kayıtları temizle
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 saat

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastAttempt > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Belirli bir identifier için durumu göster
   */
  getStatus(identifier: string): RateLimitEntry | null {
    return this.store.get(identifier) || null;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Form submission rate limiting için kısa süreli koruma
 */
export const formRateLimiter = {
  maxAttempts: 3,
  windowMs: 60 * 1000,           // 1 dakika
  blockDurationMs: 5 * 60 * 1000, // 5 dakika
};

/**
 * Login rate limiting için orta seviye koruma
 */
export const loginRateLimiter = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,       // 15 dakika
  blockDurationMs: 30 * 60 * 1000, // 30 dakika
};

/**
 * API rate limiting için genel koruma
 */
export const apiRateLimiter = {
  maxAttempts: 100,
  windowMs: 60 * 1000,            // 1 dakika
  blockDurationMs: 10 * 60 * 1000, // 10 dakika
};
