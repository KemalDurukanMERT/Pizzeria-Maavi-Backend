import config from '../../../config/config.js';

class MockProvider {
    async createPayment(orderId, amount, providerName) {
        // Return a URL to the frontend's mock payment page
        const params = new URLSearchParams({
            orderId,
            amount: amount.toString(),
            provider: providerName,
            redirect: 'true'
        });

        return {
            success: true,
            // Pass params to a specialized mock payment route on the frontend
            paymentUrl: `${config.cors.customerUrl}/mock-payment?${params.toString()}`,
            transactionId: `MOCK-${providerName}-${orderId}-${Date.now()}`,
            status: 'PENDING',
        };
    }

    async processWebhook(payload) {
        // The mock bank (frontend) will send a simple JSON payload
        // { orderId: "...", status: "success" }

        if (payload.status === 'success') {
            return {
                success: true,
                orderId: payload.orderId,
                transactionId: payload.transactionId,
                status: 'COMPLETED',
            };
        } else {
            return {
                success: true, // Webhook received but payment failed/cancelled
                orderId: payload.orderId,
                status: 'FAILED',
            };
        }
    }

    async getStatus(transactionId) {
        // Mock always checks DB or assumes pending if not found in memory (stateless)
        // For simplicity, we just return nothing or rely on webhook.
        return { status: 'UNKNOWN' };
    }
}

export default new MockProvider();
