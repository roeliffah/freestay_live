'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Hotel,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Home,
  Printer,
  Download,
  Info,
  Utensils,
  BedDouble,
  AlertCircle,
} from 'lucide-react';

interface VoucherData {
  bookingNumber: string;
  hotelBookingCode: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  hotel: {
    id: number;
    name: string;
    address: string;
    phone: string;
  };
  room: {
    type: string;
    englishType: string;
    count: number;
  };
  meal: {
    id: number;
    name: string;
    englishName: string;
    label: string;
  };
  dates: {
    checkIn: string;
    checkOut: string;
    bookingDate: string;
    timezone: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  guest: {
    name: string;
    email: string;
  };
  cancellation: {
    percentage: number;
    text: string;
    earliestDate: string;
  };
  hotelNotes: Array<{
    startDate: string;
    endDate: string;
    text: string;
  }>;
  paymentMethod: {
    id: number;
    name: string;
  };
  yourRef: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export default function VoucherPage() {
  const t = useTranslations('voucher');
  const tBooking = useTranslations('booking');
  const params = useParams();
  const locale = params.locale as string;
  const bookingNumber = params.bookingNumber as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVoucher = async () => {
      if (!bookingNumber) {
        setError('No booking number provided');
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5240/api/v1';
        
        const response = await fetch(`${API_URL}/bookings/${bookingNumber}/voucher-data`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Booking not found');
          }
          throw new Error('Failed to load voucher');
        }

        const data = await response.json();
        setVoucher(data);
      } catch (err: any) {
        console.error('Voucher loading error:', err);
        setError(err.message || 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };

    loadVoucher();
  }, [bookingNumber]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const calculateNights = () => {
    if (!voucher) return 0;
    const checkIn = new Date(voucher.dates.checkIn);
    const checkOut = new Date(voucher.dates.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">{t('loading') || 'Loading voucher...'}</p>
        </Card>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">{t('error') || 'Error'}</h1>
          <p className="text-muted-foreground mb-6">{error || t('notFound') || 'Voucher not found'}</p>
          <Link href={`/${locale}`}>
            <Button className="w-full">
              <Home className="w-5 h-5 mr-2" />
              {tBooking('backToHome') || 'Back to Home'}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if cancelled
  if (voucher.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-background to-background">
        {/* Header */}
        <div className="bg-red-600 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="font-serif text-3xl font-semibold mb-2">
                {t('cancelled.title') || 'Reservation Cancelled'}
              </h1>
              <p className="text-red-100">
                {t('cancelled.subtitle') || 'This reservation has been cancelled and is no longer valid.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cancelled Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 border-red-200 bg-red-50/50">
              <div className="space-y-6">
                <div className="text-center">
                  <Badge variant="destructive" className="mb-4 text-lg px-6 py-2">
                    {t('cancelled.badge') || 'CANCELLED'}
                  </Badge>
                </div>

                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Hotel className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('hotel') || 'Hotel'}</p>
                      <p className="font-semibold">{voucher.hotel.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookingNumber') || 'Booking Number'}</p>
                      <p className="font-mono font-semibold">{voucher.bookingNumber}</p>
                    </div>
                  </div>

                  {voucher.cancelledAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('cancelled.date') || 'Cancelled On'}</p>
                        <p className="font-semibold">{formatDate(voucher.cancelledAt)}</p>
                      </div>
                    </div>
                  )}

                  {voucher.cancellationReason && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('cancelled.reason') || 'Reason'}</p>
                        <p className="font-medium">{voucher.cancellationReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center pt-4">
                  <p className="text-muted-foreground mb-6">
                    {t('cancelled.message') || 'If you have any questions about your cancellation, please contact our support team.'}
                  </p>
                  <div className="space-y-3">
                    <Link href={`/${locale}/contact`} className="block">
                      <Button className="w-full">
                        {t('contactSupport') || 'Contact Support'}
                      </Button>
                    </Link>
                    <Link href={`/${locale}`} className="block">
                      <Button variant="outline" className="w-full">
                        <Home className="w-5 h-5 mr-2" />
                        {tBooking('backToHome') || 'Back to Home'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const nights = calculateNights();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header with Actions */}
      <div className="bg-primary text-white py-6 no-print">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold">
                {t('title') || 'Hotel Voucher'}
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                {t('subtitle') || 'Present this voucher at check-in'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                {t('print') || 'Print'}
              </Button>
              <Link href={`/${locale}`}>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/30 hover:bg-white/20">
                  <Home className="w-4 h-4 mr-2" />
                  {tBooking('backToHome') || 'Home'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto print-area" ref={printRef}>
          {/* Status Banner */}
          <Card className="p-4 mb-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  {t('confirmed') || 'Reservation Confirmed'}
                </p>
                <p className="text-sm text-green-700">
                  {t('confirmedMessage') || 'Your booking has been confirmed. Please present this voucher at check-in.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Main Voucher Card */}
          <Card className="overflow-hidden shadow-lg mb-6">
            {/* Voucher Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">
                    {t('bookingNumber') || 'Booking Number'}
                  </p>
                  <p className="font-mono text-2xl font-bold">{voucher.hotelBookingCode || voucher.bookingNumber}</p>
                  {voucher.yourRef && (
                    <p className="text-sm text-primary-foreground/70 mt-1">
                      Ref: {voucher.yourRef}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-primary bg-white">
                  {t('validVoucher') || 'VALID'}
                </Badge>
              </div>
            </div>

            {/* Hotel Information */}
            <div className="p-6 border-b">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hotel className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{voucher.hotel.name}</h2>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{voucher.hotel.address}</span>
                    </div>
                    {voucher.hotel.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{voucher.hotel.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates and Room */}
            <div className="p-6 grid md:grid-cols-2 gap-6 border-b">
              {/* Check-in/out Dates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('stayDates') || 'Stay Dates'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{tBooking('checkIn')}</p>
                    <p className="font-semibold">{formatShortDate(voucher.dates.checkIn)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('checkInTime') || 'From 15:00'}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{tBooking('checkOut')}</p>
                    <p className="font-semibold">{formatShortDate(voucher.dates.checkOut)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('checkOutTime') || 'Until 12:00'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg">
                    {nights} {nights === 1 ? tBooking('night') : tBooking('nights')}
                  </Badge>
                </div>
              </div>

              {/* Room & Meal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-primary" />
                  {t('roomDetails') || 'Room Details'}
                </h3>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <BedDouble className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{tBooking('roomType')}</p>
                      <p className="font-medium">{voucher.room.type || voucher.room.englishType}</p>
                      <p className="text-sm text-muted-foreground">
                        {voucher.room.count} {voucher.room.count === 1 ? t('room') : t('rooms')}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Utensils className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{tBooking('boardType')}</p>
                      <p className="font-medium">{voucher.meal.name || voucher.meal.englishName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest & Payment Information */}
            <div className="p-6 grid md:grid-cols-2 gap-6 border-b">
              {/* Guest Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t('guestInfo') || 'Guest Information'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{voucher.guest.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{voucher.guest.email}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {t('paymentInfo') || 'Payment Information'}
                </h3>
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('totalPaid') || 'Total Paid'}</span>
                    <span className="text-2xl font-bold text-primary">
                      {voucher.price.currency === 'EUR' ? '€' : voucher.price.currency}
                      {voucher.price.amount.toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('paymentMethod')}: {voucher.paymentMethod.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            {voucher.cancellation && (
              <div className="p-6 border-b bg-amber-50/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2">
                      {t('cancellationPolicy') || 'Cancellation Policy'}
                    </h3>
                    <p className="text-sm text-amber-700">
                      {voucher.cancellation.text}
                    </p>
                    {voucher.cancellation.percentage === 100 && (
                      <Badge variant="destructive" className="mt-2">
                        {t('nonRefundable') || 'Non-Refundable'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Notes */}
            {voucher.hotelNotes && voucher.hotelNotes.length > 0 && (
              <div className="p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  {t('importantInfo') || 'Important Information'}
                </h3>
                <div className="space-y-4">
                  {voucher.hotelNotes.map((note, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Booking Date Footer */}
          <div className="text-center text-muted-foreground text-sm mb-6">
            <p>
              {t('bookedOn') || 'Booked on'}: {formatDate(voucher.dates.bookingDate)}
              {voucher.dates.timezone && ` (${voucher.dates.timezone})`}
            </p>
          </div>

          {/* Support Information */}
          <Card className="p-6 no-print">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('needHelp') || 'Need Help?'}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('supportMessage') || 'If you have any questions about your booking, our support team is here to help.'}
                </p>
                <Link href={`/${locale}/contact`}>
                  <Button variant="outline">
                    {t('contactSupport') || 'Contact Support'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
