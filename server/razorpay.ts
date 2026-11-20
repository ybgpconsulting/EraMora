import { hmacSha256Hex, randomHex, timingSafeEqualString } from './crypto';
import { getSessionSecret } from './db';
import type { Env } from './env';

/**
 * Payment integration is optional. When live keys are absent the store uses a
 * clearly-labelled sandbox flow that still verifies an HMAC server-side, so the
 * checkout can be exercised end-to-end without any external account.
 */
export function isRazorpayLiveConfigured(env: Env): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayPublicKeyId(env: Env): string | null {
  return env.RAZORPAY_KEY_ID || null;
}

async function getVerificationSecret(env: Env): Promise<string> {
  return env.RAZORPAY_KEY_SECRET || env.SESSION_SECRET || (await getSessionSecret(env));
}

export async function computeRazorpayPaymentSignature(
  env: Env,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  secret?: string
): Promise<string> {
  const key = secret || (await getVerificationSecret(env));
  return hmacSha256Hex(key, `${razorpayOrderId}|${razorpayPaymentId}`);
}

export async function verifyRazorpayPaymentSignature(
  env: Env,
  params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    secret?: string;
  }
): Promise<boolean> {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, secret } = params;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = await computeRazorpayPaymentSignature(env, razorpayOrderId, razorpayPaymentId, secret);
  return timingSafeEqualString(expected, razorpaySignature);
}

export async function verifyRazorpayWebhookSignature(
  env: Env,
  rawBody: string,
  signatureHeader: string | undefined,
  secret?: string
): Promise<boolean> {
  const webhookSecret = secret || env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!webhookSecret || !signatureHeader) return false;
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  return timingSafeEqualString(expected, signatureHeader);
}

export async function createGatewayOrder(
  env: Env,
  params: { amountInPaise: number; receipt: string }
): Promise<{ id: string; amount: number; currency: string; mode: 'live' | 'sandbox' }> {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    const auth = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        currency: 'INR',
        receipt: params.receipt,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Razorpay order creation failed: ${text}`);
    }

    const data = (await response.json()) as { id: string; amount: number; currency: string };
    return { id: data.id, amount: data.amount, currency: data.currency, mode: 'live' };
  }

  return {
    id: `order_rzp_sandbox_${randomHex(6)}`,
    amount: params.amountInPaise,
    currency: 'INR',
    mode: 'sandbox',
  };
}
