// Coupon types and interfaces

export type CouponType = 'one-time' | 'annual';

export interface CouponOffer {
  type: CouponType;
  price: number;
  discountPercent: number;
  validDays?: number;
  description: string;
}

export interface PricingCalculation {
  roomPrice: number;
  profitMargin: number;
  profit: number;
  vat: number;
  extraFee: number;
  subtotal: number;
  // When coupon is purchased
  couponDiscount?: number;
  discountedProfit?: number;
  totalWithCoupon?: number;
}

export interface CouponRequest {
  code: string;
  amount: number;
  bookingType: string;
  userId: string;
  email: string;
}

export interface CouponPurchaseIntent {
  couponType: CouponType;
  couponPrice: number;
  bookingTotal: number;
  userId?: string;
  userEmail?: string;
  requiresLogin: boolean;
}

export interface SiteSettings {
  oneTimeCouponPrice: number;
  annualCouponPrice: number;
  profitMargin: number;
  defaultVatRate: number;
  extraFee: number;
}
