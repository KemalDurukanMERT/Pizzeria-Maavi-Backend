import crypto from "crypto";
import config from "../../../config/config.js";

class PaytrailProvider {
    constructor() {
        // Paytrail "checkout-account" = Merchant ID (numeric)
        let rawMerchantId = config?.payment?.verkkomaksu?.apiKey;

        // Clean and validate the ID. If it's 'placeholder' or non-numeric, use test ID.
        const isPlaceholder = !rawMerchantId ||
            String(rawMerchantId).toLowerCase() === 'placeholder' ||
            String(rawMerchantId).includes('YOUR_');

        if (isPlaceholder || isNaN(Number(rawMerchantId))) {
            this.merchantId = "375917"; // Public test account
            this.secret = "SAIPPUAKAUPPIAS"; // Public test secret
        } else {
            this.merchantId = String(rawMerchantId).trim();
            this.secret = String(config?.payment?.verkkomaksu?.secret || "SAIPPUAKAUPPIAS").trim();
        }

        this.baseUrl = "https://services.paytrail.com";
        this.backendBaseUrl = config.baseUrl;
    }

    /**
     * Paytrail signature (HMAC) base string:
     * - take all headers starting with "checkout-"
     * - sort keys alphabetically
     * - format each as "key:value"
     * - join with "\n"
     * - append raw body JSON (if provided) as the last line
     */
    calculateHmac(params, body = "") {
        const hmacData = Object.keys(params)
            .filter((key) => key.toLowerCase().startsWith("checkout-"))
            .sort()
            .map((key) => `${key}:${params[key]}`)
            .concat(body ? [body] : [])
            .join("\n");

        return crypto
            .createHmac("sha256", this.secret)
            .update(hmacData, "utf8")
            .digest("hex");
    }

    async createPayment(orderId, amount, customerEmail) {
        const amountInCents = Math.round(Number(amount) * 100);

        if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
            throw new Error(`Invalid amount: ${amount} (cents=${amountInCents})`);
        }

        const stamp = crypto.randomUUID();

        // PAYTRAIL FIX: All URLs must be HTTPS. 
        // We force https even for localhost to satisfy Paytrail API validation.
        const baseUrl = config.cors.customerUrl.replace('http://', 'https://');

        const body = {
            stamp,
            reference: String(orderId),
            amount: amountInCents,
            currency: "EUR",
            language: "FI",
            items: [
                {
                    unitPrice: amountInCents,
                    units: 1,
                    vatPercentage: 14,
                    productCode: "ORDER_TOTAL",
                    description: `Order #${orderId}`,
                },
            ],
            customer: {
                email: customerEmail || "customer@pizzeriamavi.fi",
            },
            redirectUrls: {
                success: `${baseUrl}/payment/success?orderId=${orderId}&provider=verkkomaksu`,
                cancel: `${baseUrl}/payment/cancel?orderId=${orderId}&provider=verkkomaksu`,
            },
            callbackUrls: {
                // Use a dummy https domain for callbacks during local dev because Paytrail 
                // cannot reach http://localhost anyway.
                success: `https://pizzeriamavi.fi/api/payments/webhook/verkkomaksu`,
                cancel: `https://pizzeriamavi.fi/api/payments/webhook/verkkomaksu`,
            },
        };

        const bodyJson = JSON.stringify(body);
        const datetime = new Date().toISOString();
        const nonce = crypto.randomBytes(16).toString("hex");

        const checkoutHeaders = {
            "checkout-account": this.merchantId,
            "checkout-algorithm": "sha256",
            "checkout-method": "POST",
            "checkout-nonce": nonce,
            "checkout-timestamp": datetime,
        };

        const signature = this.calculateHmac(checkoutHeaders, bodyJson);

        const headers = {
            ...checkoutHeaders,
            signature,
            "content-type": "application/json; charset=utf-8",
            // platform-name is optional; use only if Paytrail gave you one.
            // Leaving it here doesn't usually break anything, but remove if Paytrail asks.
            "platform-name": "PizzeriaMavi",
        };

        // Helpful debug (remove later)
        // console.log("Paytrail headers:", { ...headers, signature: "[hidden]" });

        const response = await fetch(`${this.baseUrl}/payments`, {
            method: "POST",
            headers,
            body: bodyJson,
        });

        // Paytrail error responses are JSON, but just in case:
        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = { raw: text };
        }

        if (!response.ok) {
            console.error("Paytrail API Error Response:", {
                status: response.status,
                data,
                merchantIdUsed: this.merchantId,
                checkoutAccountSent: headers["checkout-account"],
            });

            const msg =
                data?.message ||
                data?.error ||
                data?.status ||
                `Paytrail Error: ${response.status}`;

            throw new Error(msg);
        }

        // Payment URL can be in different places depending on API version/response
        const paymentUrl =
            data?.href ||
            data?.providers?.find((p) => p?.url)?.url ||
            data?.providers?.[0]?.url ||
            null;

        return {
            paymentUrl,
            transactionId: data?.transactionId || data?.transaction_id || null,
            stamp: data?.stamp || stamp,
            raw: data,
        };
    }

    /**
     * Webhook handling
     * NOTE: Real verification usually needs Paytrail webhook headers (checkout-* + signature)
     * This function is kept as a minimal placeholder.
     */
    async processWebhook(payload, signature) {
        const isValid = this.verifySignature(payload, signature);

        if (!isValid) {
            console.warn("Paytrail Webhook signature verification failed");
            return { success: false };
        }

        const status =
            payload?.status === "ok" || payload?.status === "paid"
                ? "COMPLETED"
                : "FAILED";

        return {
            success: true,
            status,
            orderId: payload?.reference,
            transactionId: payload?.transactionId || payload?.transaction_id,
        };
    }

    /**
     * Minimal demo verification (NOT a full Paytrail webhook verification).
     * For proper verification, you must use the webhook request HEADERS:
     * - collect checkout-* headers from the request
     * - compute HMAC over headers + body
     * - compare with signature header
     */
    verifySignature(params, signature) {
        if (!signature || !params) return false;

        // If your payload includes signature field, remove it
        const { signature: _ignored, ...verifyParams } = params;

        // This calculates HMAC over "checkout-*" keys inside verifyParams only,
        // which likely won't exist in webhook payload.
        // Kept to avoid breaking your flow, but consider upgrading to header-based verification.
        const calculated = this.calculateHmac(verifyParams);
        return calculated === signature;
    }

    async getStatus(transactionId) {
        if (!transactionId) throw new Error("transactionId is required");

        const datetime = new Date().toISOString();
        const nonce = crypto.randomBytes(16).toString("hex");

        const checkoutHeaders = {
            "checkout-account": this.merchantId,
            "checkout-algorithm": "sha256",
            "checkout-method": "GET",
            "checkout-nonce": nonce,
            "checkout-timestamp": datetime,
        };

        const signature = this.calculateHmac(checkoutHeaders);

        const headers = {
            ...checkoutHeaders,
            signature,
        };

        const response = await fetch(`${this.baseUrl}/payments/${transactionId}`, {
            method: "GET",
            headers,
        });

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = { raw: text };
        }

        if (!response.ok) {
            return { status: "FAILED", raw: data };
        }

        return {
            status: data?.status === "ok" ? "COMPLETED" : "PENDING",
            transactionId: data?.transactionId || data?.transaction_id || transactionId,
            raw: data,
        };
    }
}

export default new PaytrailProvider();
