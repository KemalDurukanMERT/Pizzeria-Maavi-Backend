import Stripe from 'stripe';
import config from '../../../config/config.js';

class StripeProvider {
    constructor() {
        this.stripe = new Stripe(config.payment.stripe.secretKey, {
            apiVersion: '2023-10-16',
        });
    }

    async createPayment(orderId, amount, customerEmail) {
        try {
            // Amount is in cents
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: `Order #${orderId}`,
                            },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${config.cors.customerUrl}/track/${orderId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${config.cors.customerUrl}/checkout?canceled=true&order_id=${orderId}`,
                customer_email: customerEmail,
                metadata: {
                    orderId: orderId,
                },
            });

            return {
                success: true,
                paymentUrl: session.url,
                transactionId: session.id,
                status: 'PENDING',
            };
        } catch (error) {
            console.error('Stripe createPayment error:', error);
            // Wrap Stripe errors to avoid 401 propagating to frontend (which would trigger logout)
            throw new Error(`Stripe Gateway Error: ${error.message}`);
        }
    }

    async processWebhook(payload, signature) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                config.payment.stripe.webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed.', err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            return {
                success: true,
                orderId: session.metadata.orderId,
                transactionId: session.id,
                status: 'COMPLETED',
                metadata: session,
            };
        }

        return { success: true, ignored: true };
    }

    async getStatus(transactionId) {
        const session = await this.stripe.checkout.sessions.retrieve(transactionId);
        return {
            status: session.payment_status === 'paid' ? 'COMPLETED' : 'PENDING',
        };
    }
}

export default new StripeProvider();
