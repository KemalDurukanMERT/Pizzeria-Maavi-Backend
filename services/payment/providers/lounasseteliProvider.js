import crypto from 'crypto';
import config from '../../../config/config.js';

class LounasseteliProvider {
    constructor() {
        this.apiKey = config.payment.lounasseteli.apiKey;
        this.secret = config.payment.lounasseteli.secret;
        this.baseUrl = 'https://api.lounasseteli-simulator.fi';
    }

    async createPayment(orderId, amount, providerType) {

        console.log(`Initiating ${providerType} payment for order ${orderId} amount €${amount}`);

        const transactionId = `LS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const paymentUrl = `${config.cors.customerUrl}/mock-payment?orderId=${orderId}&provider=lounasseteli&amount=${amount}&transactionId=${transactionId}`;

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

export default new LounasseteliProvider();
