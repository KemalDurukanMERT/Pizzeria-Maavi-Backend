import config from '../config/config.js';
import { AppError } from '../middleware/errorHandler.js';
import stripeProvider from './payment/providers/stripeProvider.js';
import paytrailProvider from './payment/providers/paytrailProvider.js';
import lounasseteliProvider from './payment/providers/lounasseteliProvider.js';
import ePassiProvider from './payment/providers/ePassiProvider.js';
import mockProvider from './payment/providers/mockProvider.js';
import cashProvider from './payment/providers/cashProvider.js';

class PaymentService {
    constructor() {
        this.providers = {
            STRIPE: stripeProvider,
            VERKKOMAKSU: paytrailProvider,
            LOUNASSETELI: lounasseteliProvider,
            EPASSI: ePassiProvider,
            MOCK: mockProvider,
            CASH: cashProvider,
        };
    }

    getProvider(providerName) {
        const provider = this.providers[providerName];
        if (!provider) {
            throw new AppError(`Payment provider ${providerName} not configured`, 500);
        }
        return provider;
    }

    // Initiate payment
    // We pass extra options like email for Stripe
    async initiatePayment(orderId, providerName, amount, options = {}) {
        const handler = this.getProvider(providerName);

        // Pass specific args based on provider
        if (['STRIPE', 'VERKKOMAKSU'].includes(providerName)) {
            return await handler.createPayment(orderId, amount, options.email);
        } else if (['LOUNASSETELI', 'EPASSI'].includes(providerName)) {
            return await handler.createPayment(orderId, amount, providerName);
        } else {
            return await handler.createPayment(orderId, amount);
        }
    }

    // Handle webhook
    async handleWebhook(providerName, payload, signature) {
        const handler = this.getProvider(providerName);
        return await handler.processWebhook(payload, signature);
    }

    // Get payment status
    async getPaymentStatus(providerName, transactionId) {
        const handler = this.getProvider(providerName);
        return await handler.getStatus(transactionId);
    }
}

export default new PaymentService();
