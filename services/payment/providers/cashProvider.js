class CashProvider {
    async createPayment(orderId, amount) {
        return {
            success: true,
            paymentUrl: null, // No URL for cash
            transactionId: `CASH-${orderId}`,
            status: 'PENDING',
        };
    }

    async processWebhook(payload) {
        return { success: true };
    }

    async getStatus(transactionId) {
        return { status: 'PENDING' };
    }
}

export default new CashProvider();
