/**
 * Booking API Types and Functions
 * Based on SunHotels API specification
 */

export interface Guest {
  firstName: string;
  lastName: string;
}

export interface ChildGuest extends Guest {
  age: number;
}

export interface CreditCard {
  cardType: 'VISA' | 'MC' | 'AMEX';
  cardNumber: string;
  cardHolder: string;
  cvv: string;
  expYear: string;  // "2026"
  expMonth: string; // "12"
}

export interface BookingRequest {
  preBookCode: string;        // PreBook'tan dönen kod (zorunlu)
  roomId: number;
  mealId: number;
  checkIn: string;            // "2026-02-15" formatında
  checkOut: string;           // "2026-02-20" formatında
  rooms: number;
  adults: number;
  children: number;
  infant: number;
  currency: string;
  language: string;
  email: string;
  yourRef?: string;           // Kendi referans numaranız
  specialRequest?: string;    // Özel istekler
  customerCountry?: string;   // "TR", "DE", "NL" gibi
  b2c: boolean;
  invoiceRef?: string;
  commissionAmount?: number;
  adultGuests: Guest[];       // Max 9 kişi
  childrenGuests: ChildGuest[]; // Max 9 çocuk
  // Stripe payment method identifier from stripe.createPaymentMethod
  paymentMethodId: string | number;    
  // Legacy credit card fields (not used when Stripe is enabled)
  creditCard?: CreditCard;    
  customerEmail?: string;
}

export interface BookingResponse {
  bookingNumber: string;
  voucher: string;
  hotelName: string;
  hotelAddress?: string;
  checkIn: string;
  checkOut: string;
  currency: string;
  totalPrice: number;
  message: string;
}

/**
 * Create a booking with SunHotels API
 */
export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/sunhotels/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Booking failed');
  }

  return await response.json();
}
