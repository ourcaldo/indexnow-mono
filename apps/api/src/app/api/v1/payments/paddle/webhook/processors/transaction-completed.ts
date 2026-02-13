/**
 * Paddle Webhook Processor: transaction.completed
 * Handles completed transaction events
 * 
 * Architecture: 2-Table Pattern
 * 1. Insert into main transaction table (indb_payment_transactions)
 * 2. Insert into Paddle-specific table (indb_paddle_transactions) with FK
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { Json, TransactionMetadata } from '@indexnow/shared';
import { validateCustomData, safeGet, getPackageIdFromSubscription, CustomData } from './utils';

interface PaymentDetails {
    method_details?: {
        type?: string;
    };
}

interface TransactionTotals {
    total: string;
    currency_code: string;
}

interface TransactionDetails {
    totals: TransactionTotals;
    receipt_url?: string;
    invoice_number?: string;
}

interface PaddleTransactionData {
    id: string;
    customer_id?: string;
    subscription_id?: string;
    items?: unknown[];
    details?: TransactionDetails;
    payments?: PaymentDetails[];
    custom_data?: unknown;
}

export async function processTransactionCompleted(data: unknown) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid transaction data received');
    }

    const txData = data as PaddleTransactionData;
    const transaction_id = txData.id;
    const subscription_id = txData.subscription_id;
    const details = txData.details;
    const payments = txData.payments;
    const custom_data = txData.custom_data;

    if (!transaction_id) {
        throw new Error('Missing transaction_id in completed transaction event');
    }

    const validatedData = validateCustomData(custom_data, transaction_id);
    if (!validatedData || !validatedData.userId) {
        throw new Error('Invalid or missing custom_data with userId');
    }

    const userId = validatedData.userId;

    if (!details?.totals) {
        throw new Error('Missing details.totals in transaction data');
    }

    const amount = details.totals.total;
    const currency = details.totals.currency_code;

    if (!amount || !currency) {
        throw new Error('Missing amount or currency in transaction totals');
    }

    const paymentMethod = Array.isArray(payments) && payments.length > 0
        ? safeGet(payments[0] as unknown as Record<string, unknown>, 'method_details.type', 'unknown')
        : 'unknown';

    const packageId = await getPackageIdFromSubscription(
        subscription_id || null,
        validatedData as CustomData & { packageId?: string }
    );

    const transactionMetadata: TransactionMetadata = {
        custom_data: custom_data as Json,
        transactionId: subscription_id || undefined,
        user_id: userId,
        package_id: packageId,
    };

    await SecureServiceRoleWrapper.executeSecureOperation(
        {
            userId,
            operation: 'record_completed_transaction',
            reason: 'Paddle webhook transaction.completed event',
            source: 'webhook.processors.transaction-completed',
            metadata: { transaction_id, subscription_id: subscription_id || null },
        },
        {
            table: 'indb_payment_transactions',
            operationType: 'insert',
            data: { user_id: userId, status: 'completed', external_transaction_id: transaction_id },
        },
        async () => {
            const { data: mainTransaction, error: mainError } = await supabaseAdmin
                .from('indb_payment_transactions')
                .insert({
                    user_id: userId,
                    package_id: packageId,
                    amount: parseFloat(amount) / 100,
                    currency: currency,
                    status: 'completed',
                    external_transaction_id: transaction_id,
                    payment_method: paymentMethod,
                    metadata: transactionMetadata,
                })
                .select()
                .single();

            if (mainError || !mainTransaction) {
                throw new Error(`Failed to insert main transaction: ${mainError?.message || 'unknown error'}`);
            }

            const { error: paddleError } = await supabaseAdmin
                .from('indb_paddle_transactions')
                .insert({
                    transaction_id: mainTransaction.id,
                    paddle_transaction_id: transaction_id,
                    paddle_subscription_id: subscription_id || null,
                    paddle_customer_id: txData.customer_id || null,
                    event_type: 'transaction.completed',
                    event_data: { details, payments } as unknown as Json,
                    status: 'completed',
                });

            if (paddleError) {
                throw new Error(`Failed to insert Paddle transaction: ${paddleError.message}`);
            }
        }
    );
}
