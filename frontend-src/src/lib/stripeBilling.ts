'use client';
import { functions } from '@/lib/api-client';
import { setPlusActive, setPlusPlan } from '@/lib/skinAccess';
import { pushUserSync } from '@/lib/userSync';
import { ensureMindlabUserId } from '@/lib/userSync';
import { getLanguage, t } from '@/lib/locale';

export async function startSubscriptionCheckout(planId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await functions.createSubscription({
    planId,
    userId: ensureMindlabUserId(),
    successUrl: origin + '/subscription?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: origin + '/subscription?cancelled=true',
  });
  return res;
}

export async function verifySubscriptionCheckout(sessionId) {
  const data = await functions.verifySubscription({ sessionId });
  if (!data?.ok || !data.plus_active) {
    throw new Error(data?.error || t('payErrVerifyFail', getLanguage()));
  }
  setPlusActive(true);
  if (data.plan_id) setPlusPlan(data.plan_id);
  await pushUserSync();
  return data;
}
