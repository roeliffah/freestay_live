import { PricingCalculation, SiteSettings } from '@/types/coupon';

/**
 * Calculate room price with all fees
 * Formula: roomPrice * profitMargin + vat + extraFee
 */
export function calculateRoomPricing(
  roomPrice: number,
  settings: SiteSettings
): PricingCalculation {
  const profitMargin = (roomPrice * settings.profitMargin) / 100;
  const vat = (roomPrice + profitMargin) * (settings.defaultVatRate / 100);
  const subtotal = roomPrice + profitMargin + vat + settings.extraFee;

  return {
    roomPrice,
    profitMargin: settings.profitMargin,
    profit: profitMargin,
    vat,
    extraFee: settings.extraFee,
    subtotal,
  };
}

/**
 * Apply coupon discount to pricing
 * When coupon is purchased: 15% discount on profit margin
 */
export function applyCouponDiscount(
  pricing: PricingCalculation
): PricingCalculation {
  const couponDiscount = (pricing.profit * 15) / 100;
  const discountedProfit = pricing.profit - couponDiscount;
  const totalWithCoupon =
    pricing.roomPrice + discountedProfit + pricing.vat + pricing.extraFee;

  return {
    ...pricing,
    couponDiscount,
    discountedProfit,
    totalWithCoupon,
  };
}

/**
 * Format price as currency with 2 decimal places
 * Safe for SSR (doesn't use locale-dependent formatting)
 */
export function formatPrice(price: number, currency = 'EUR'): string {
  const rounded = Math.round(price * 100) / 100;
  return `${rounded.toFixed(2)} ${currency}`;
}

/**
 * Calculate savings with coupon
 */
export function calculateSavings(
  originalPrice: number,
  couponPrice: number
): {
  savingsAmount: number;
  savingsPercent: number;
} {
  const savingsAmount = originalPrice - couponPrice;
  const savingsPercent = (savingsAmount / originalPrice) * 100;

  return {
    savingsAmount,
    savingsPercent,
  };
}
