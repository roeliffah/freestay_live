'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Gift, Check, Zap, Star } from 'lucide-react';
import { CouponType, SiteSettings } from '@/types/coupon';
import { formatPrice, calculateSavings } from '@/lib/utils/coupon';

interface CouponSelectorProps {
  roomPrice: number;
  settings: SiteSettings;
  selectedCoupon: CouponType | null;
  onCouponSelect: (couponType: CouponType | null) => void;
  onPurchase: (couponType: CouponType) => void;
  isLoading?: boolean;
  requiresLogin?: boolean;
}

export function CouponSelector({
  roomPrice,
  settings,
  selectedCoupon,
  onCouponSelect,
  onPurchase,
  isLoading = false,
  requiresLogin = false,
}: CouponSelectorProps) {
  const t = useTranslations();
  const locale = useLocale();

  const couponOptions = [
    {
      id: 'one-time' as CouponType,
      title: t('booking.coupon.oneTime') || 'One-Time Discount',
      description: t('booking.coupon.oneTimeDesc') || '15% off on your current booking',
      price: settings.oneTimeCouponPrice,
      icon: Gift,
      badge: 'Quick Save',
    },
    {
      id: 'annual' as CouponType,
      title: t('booking.coupon.annual') || 'Annual Pass',
      description: t('booking.coupon.annualDesc') || '15% off on all bookings for 1 year',
      price: settings.annualCouponPrice,
      icon: Star,
      badge: 'Best Value',
      popular: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          {t('booking.coupon.title') || 'Save with Coupon'}
        </h3>

        <div className="space-y-3">
          {/* No Coupon Option */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
            <input
              type="radio"
              id="no-coupon"
              name="coupon"
              value=""
              checked={selectedCoupon === null}
              onChange={() => onCouponSelect(null)}
              className="w-4 h-4 cursor-pointer"
            />
            <Label htmlFor="no-coupon" className="flex-1 cursor-pointer">
              <div className="font-medium">{t('booking.coupon.skip') || 'Skip for now'}</div>
              <div className="text-sm text-muted-foreground">
                {t('booking.coupon.skipDesc') || 'Continue without a coupon'}
              </div>
            </Label>
          </div>

          {/* Coupon Options */}
          {couponOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedCoupon === option.id;
            const savings = calculateSavings(roomPrice, option.price);

            return (
              <div
                key={option.id}
                className={`relative p-4 border rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'hover:border-primary/50 hover:bg-secondary/30'
                }`}
                onClick={() => onCouponSelect(option.id)}
              >
                {option.popular && (
                  <Badge className="absolute -top-2 right-4 bg-green-500">
                    {option.badge}
                  </Badge>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id={option.id}
                    name="coupon"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onCouponSelect(option.id)}
                    className="w-4 h-4 cursor-pointer mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={option.id} className="cursor-pointer flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{option.title}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold text-primary">
                          {formatPrice(option.price, 'EUR')}
                        </div>
                        <div className="text-xs text-green-600">
                          {t('booking.coupon.save') || 'Save'}:{' '}
                          <span className="font-medium">
                            {savings.savingsPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Button
                    onClick={() => onPurchase(option.id)}
                    disabled={isLoading || requiresLogin}
                    className="w-full mt-3"
                    size="sm"
                  >
                    {requiresLogin ? (
                      t('booking.coupon.loginRequired') || 'Login to Purchase'
                    ) : isLoading ? (
                      t('booking.coupon.processing') || 'Processing...'
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {t('booking.coupon.purchase') || 'Purchase Coupon'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          {t('booking.coupon.info') || 
            '💡 Purchase a coupon to get 15% discount on your booking fees. You\'ll receive a unique code to use anytime.'}
        </p>
      </div>
    </div>
  );
}
