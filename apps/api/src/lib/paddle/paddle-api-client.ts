/**
 * Paddle API Client
 * Server-side client for Paddle's REST API (v1).
 * Uses PADDLE_API_KEY from env for Bearer token auth.
 *
 * Base URLs:
 *   Production: https://api.paddle.com
 *   Sandbox:    https://sandbox-api.paddle.com
 *
 * Environment is derived from NEXT_PUBLIC_PADDLE_ENV (defaults to 'sandbox').
 */

import { logger } from '@/lib/monitoring/error-handling';

const PADDLE_BASE_URLS = {
  production: 'https://api.paddle.com',
  sandbox: 'https://sandbox-api.paddle.com',
} as const;

type PaddleEnvironment = keyof typeof PADDLE_BASE_URLS;

function getBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox') as PaddleEnvironment;
  return PADDLE_BASE_URLS[env] ?? PADDLE_BASE_URLS.sandbox;
}

function getApiKey(): string | undefined {
  return process.env.PADDLE_API_KEY;
}

/** Proration billing modes for subscription updates */
export type ProrationBillingMode =
  | 'prorated_immediately'
  | 'prorated_next_billing_period'
  | 'full_immediately'
  | 'full_next_billing_period'
  | 'do_not_bill';

/** What happens if the proration payment fails */
export type OnPaymentFailure = 'prevent_change' | 'apply_change';

/** Item on a subscription update request */
export interface PaddleSubscriptionItem {
  price_id: string;
  quantity?: number;
}

/** Request body for PATCH /subscriptions/{id} */
export interface UpdateSubscriptionRequest {
  items: PaddleSubscriptionItem[];
  proration_billing_mode: ProrationBillingMode;
  on_payment_failure?: OnPaymentFailure;
}

/** Paddle API error shape */
export interface PaddleApiError {
  type: string;
  code: string;
  detail: string;
  documentation_url?: string;
}

/** Paddle API error response */
export interface PaddleErrorResponse {
  error: PaddleApiError;
  meta: { request_id: string };
}

/** Paddle API success response for subscription update */
export interface PaddleSubscriptionResponse {
  data: {
    id: string;
    status: string;
    customer_id: string;
    items: Array<{
      price: { id: string; product_id: string };
      quantity: number;
      status: string;
    }>;
    current_billing_period?: {
      starts_at: string;
      ends_at: string;
    };
    next_billed_at?: string;
    updated_at: string;
  };
  meta: { request_id: string };
}

type PaddleUpdateResult =
  | { ok: true; data: PaddleSubscriptionResponse }
  | { ok: false; status: number; error: PaddleApiError; requestId: string };

/**
 * Update a Paddle subscription (upgrade/downgrade).
 *
 * Calls PATCH /subscriptions/{subscription_id} with the new items and proration mode.
 * Paddle handles proration, charges/credits automatically.
 * A subscription.updated webhook is sent by Paddle after the change is processed.
 */
export async function updatePaddleSubscription(
  subscriptionId: string,
  items: PaddleSubscriptionItem[],
  prorationBillingMode: ProrationBillingMode = 'prorated_immediately',
  onPaymentFailure: OnPaymentFailure = 'prevent_change'
): Promise<PaddleUpdateResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not configured');
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/subscriptions/${subscriptionId}`;

  const body: UpdateSubscriptionRequest = {
    items,
    proration_billing_mode: prorationBillingMode,
    on_payment_failure: onPaymentFailure,
  };

  logger.info(
    { subscriptionId, prorationBillingMode, itemCount: items.length },
    'Calling Paddle API to update subscription'
  );

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as PaddleErrorResponse;
    logger.error(
      {
        subscriptionId,
        status: response.status,
        paddleError: errorBody.error,
        requestId: errorBody.meta?.request_id,
      },
      'Paddle API subscription update failed'
    );

    return {
      ok: false,
      status: response.status,
      error: errorBody.error,
      requestId: errorBody.meta?.request_id ?? 'unknown',
    };
  }

  const successBody = (await response.json()) as PaddleSubscriptionResponse;

  logger.info(
    {
      subscriptionId,
      newStatus: successBody.data.status,
      requestId: successBody.meta.request_id,
    },
    'Paddle subscription updated successfully'
  );

  return { ok: true, data: successBody };
}
