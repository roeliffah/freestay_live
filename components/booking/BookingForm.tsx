'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar,
  MapPin,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingFormProps {
  hotelName: string;
  roomName: string;
  boardType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
}

export function BookingForm({
  hotelName,
  roomName,
  boardType,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  currency,
}: BookingFormProps) {
  const t = useTranslations('booking');
  const params = useParams();
  const locale = params.locale as string;
  
  const [formData, setFormData] = useState({
    // Misafir Bilgileri
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Türkiye',
    city: '',
    
    // Ödeme Bilgileri (UI only, not processed)
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    
    // Özel İstekler
    specialRequests: '',
    
    // Onaylar
    termsAccepted: false,
    marketingAccepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }
    if (!formData.phone.trim()) newErrors.phone = t('phoneRequired');
    if (!formData.cardNumber.trim()) newErrors.cardNumber = t('cardNumberRequired');
    if (!formData.cardName.trim()) newErrors.cardName = t('cardNameRequired');
    if (!formData.expiryMonth) newErrors.expiryMonth = t('expiryMonthRequired');
    if (!formData.expiryYear) newErrors.expiryYear = t('expiryYearRequired');
    if (!formData.cvv.trim()) newErrors.cvv = t('cvvRequired');
    if (!formData.termsAccepted) newErrors.termsAccepted = t('termsRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // TODO: API entegrasyonu buraya gelecek
    console.log('📋 Rezervasyon formu gönderildi:', {
      hotel: hotelName,
      room: roomName,
      guest: formData,
      checkIn,
      checkOut,
      totalPrice,
    });

    alert('Rezervasyon formu hazırlandı! (API entegrasyonu henüz yapılmadı)');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rezervasyon Özeti */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-bold text-lg mb-4">{t('reservationSummary')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('hotel')}</span>
            <span className="font-semibold">{hotelName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('roomType')}</span>
            <span className="font-semibold">{roomName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('boardType')}</span>
            <span className="font-semibold">{boardType}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {t('checkIn')}
            </div>
            <span className="font-semibold">{formatDate(checkIn)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {t('checkOut')}
            </div>
            <span className="font-semibold">{formatDate(checkOut)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              {t('guests')}
            </div>
            <span className="font-semibold">{guests} {t('person')}</span>
          </div>
          <div className="flex justify-between pt-3 border-t">
            <span className="text-muted-foreground">{nights} {t('nights')}</span>
            <span className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </Card>

      {/* Misafir Bilgileri */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-bold text-lg">{t('guestInformation')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('firstName')} *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder={t('firstNamePlaceholder')}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">{t('lastName')} *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')} *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('emailPlaceholder')}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')} *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('phonePlaceholder')}
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t('country')}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">{t('city')}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder={t('cityPlaceholder')}
            />
          </div>
        </div>
      </Card>

      {/* Ödeme Bilgileri */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-bold text-lg">{t('paymentInformation')}</h3>
        </div>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('paymentNote')}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">{t('cardNumber')} *</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder={t('cardNumberPlaceholder')}
              maxLength={19}
              className={errors.cardNumber ? 'border-red-500' : ''}
            />
            {errors.cardNumber && (
              <p className="text-sm text-red-500">{errors.cardNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">{t('cardName')} *</Label>
            <Input
              id="cardName"
              value={formData.cardName}
              onChange={(e) => handleInputChange('cardName', e.target.value)}
              placeholder={t('cardNamePlaceholder')}
              className={errors.cardName ? 'border-red-500' : ''}
            />
            {errors.cardName && (
              <p className="text-sm text-red-500">{errors.cardName}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">{t('expiryMonth')} *</Label>
              <Input
                id="expiryMonth"
                value={formData.expiryMonth}
                onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                placeholder={t('expiryMonthPlaceholder')}
                maxLength={2}
                className={errors.expiryMonth ? 'border-red-500' : ''}
              />
              {errors.expiryMonth && (
                <p className="text-sm text-red-500">{errors.expiryMonth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">{t('expiryYear')} *</Label>
              <Input
                id="expiryYear"
                value={formData.expiryYear}
                onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                placeholder={t('expiryYearPlaceholder')}
                maxLength={2}
                className={errors.expiryYear ? 'border-red-500' : ''}
              />
              {errors.expiryYear && (
                <p className="text-sm text-red-500">{errors.expiryYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">{t('cvv')} *</Label>
              <Input
                id="cvv"
                type="password"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder={t('cvvPlaceholder')}
                maxLength={3}
                className={errors.cvv ? 'border-red-500' : ''}
              />
              {errors.cvv && (
                <p className="text-sm text-red-500">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Özel İstekler */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">{t('specialRequests')}</h3>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
          placeholder={t('specialRequestsPlaceholder')}
          className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      {/* Onaylar */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={formData.termsAccepted}
              onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm">
              <span className={errors.termsAccepted ? 'text-red-500' : ''}>
                {t('termsAccept')} *
              </span>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketing"
              checked={formData.marketingAccepted}
              onChange={(e) => handleInputChange('marketingAccepted', e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="marketing" className="text-sm text-muted-foreground">
              {t('marketingAccept')}
            </label>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg" 
          className="w-full md:w-auto min-w-[250px]"
        >
          {t('completeReservation')}
        </Button>
      </div>
    </form>
  );
}
