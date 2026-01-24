import crypto from 'crypto';
import config from '../../../config/config.js';

class EpassiProvider {
    constructor() {
        this.apiKey = config.payment.epassi.apiKey;
        this.secret = config.payment.epassi.secret;
        this.baseUrl = 'https://api.epassi.fi';
    }

    async createPayment(orderId, amount) {
        const transactionId = `EP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const paymentUrl = `${config.cors.customerUrl}/mock-payment?orderId=${orderId}&provider=epassi&amount=${amount}&transactionId=${transactionId}`;

        return {
            paymentUrl,
            transactionId
        };
    }

    async processWebhook(payload, signature) {
        return {
            success: true,
            status: 'COMPLETED',
            orderId: payload.orderId,
            transactionId: payload.transactionId
        };
    }

    async getStatus(transactionId) {
        return {
            status: 'COMPLETED',
            transactionId
        };
    }
}

export default new EpassiProvider();
