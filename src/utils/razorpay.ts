/**
 * Razorpay Payment Gateway Client Integration
 * Handles script injection, order generation, checkout triggering, and verification
 */

export interface RazorpayConfig {
  isConfigured: boolean;
  isLive: boolean;
  keyId: string | null;
  businessName: string;
  description: string;
  themeColor: string;
  currency: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isLive?: boolean;
  isSandbox?: boolean;
  message?: string;
  error?: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  verified: boolean;
  message: string;
  plan: string;
  paymentId: string;
  orderId: string;
  amount: number;
  activatedAt: string;
  isSandbox?: boolean;
  error?: string;
}

/**
 * Loads Razorpay Standard Checkout SDK into document
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load external Razorpay checkout.js script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Fetches Razorpay public status and configuration
 */
export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  try {
    const res = await fetch('/api/razorpay/config');
    if (!res.ok) throw new Error('Failed to load razorpay config');
    return await res.json();
  } catch {
    return {
      isConfigured: false,
      isLive: false,
      keyId: null,
      businessName: 'Focura Smart Study',
      description: 'AI Focus Platform & Study Mastery',
      themeColor: '#f59e0b',
      currency: 'INR',
    };
  }
}

/**
 * Creates Razorpay order on backend server
 */
export async function createRazorpayOrder(params: {
  plan: string;
  amount: number;
  currency?: string;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<RazorpayOrderResponse> {
  const res = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initialize payment order');
  }

  return await res.json();
}

/**
 * Verifies Razorpay payment signature and activates plan
 */
export async function verifyRazorpayPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  plan: string;
  amount: number;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<RazorpayVerifyResponse> {
  const res = await fetch('/api/razorpay/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Payment verification failed');
  }

  return await res.json();
}
