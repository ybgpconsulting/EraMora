import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  computeRazorpayPaymentSignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from './razorpay';
import type { Env } from './env';

const env = {} as Env;

test('verifyRazorpayPaymentSignature accepts valid HMAC and rejects forged signatures', async () => {
  const secret = 'test_rzp_secret_123';
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';
  const validSig = await computeRazorpayPaymentSignature(env, orderId, paymentId, secret);

  assert.equal(
    await verifyRazorpayPaymentSignature(env, {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSig,
      secret,
    }),
    true
  );

  assert.equal(
    await verifyRazorpayPaymentSignature(env, {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'forged_signature_value',
      secret,
    }),
    false
  );
});

test('verifyRazorpayWebhookSignature validates raw payload HMAC-SHA256', async () => {
  const secret = 'whsec_test_999';
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_1' } } },
  });
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  assert.equal(await verifyRazorpayWebhookSignature(env, body, signature, secret), true);
  assert.equal(await verifyRazorpayWebhookSignature(env, body, 'bad_sig', secret), false);
});
