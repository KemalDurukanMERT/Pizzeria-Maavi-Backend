import paymentService from '../services/paymentService.js';
import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

// Initiate payment
export const initiatePayment = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        // Get order with user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                payment: true,
                user: true
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.payment?.status === 'COMPLETED') {
            throw new AppError('Order already paid', 400);
        }

        // Determine provider based on payment method
        let provider = order.paymentMethod;
        if (order.paymentMethod === 'CARD') {
            provider = 'STRIPE';
        }

        // For cash payments, no payment initiation needed
        if (provider === 'CASH') {
            return res.json({
                success: true,
                data: {
                    paymentUrl: null,
                    message: 'Cash payment - pay on delivery',
                },
            });
        }

        // Initiate payment with provider
        const paymentResult = await paymentService.initiatePayment(
            order.id,
            provider,
            order.total,
            { email: order.user?.email }
        );

        // Update payment record
        // Create if not exists (upsert logic if needed, but usually 1:1)
        // Order creation should have created generic payment record?
        // Checking orderController (createOrder) would confirm. 
        // Assuming update is safe if payment exists, otherwise create.
        if (order.payment) {
            await prisma.payment.update({
                where: { orderId: order.id },
                data: { transactionId: paymentResult.transactionId },
            });
        } else {
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: order.total,
                    provider: provider === 'STRIPE' ? 'STRIPE' : 'VERKKOMAKSU', // Map appropriately in real app
                    status: 'PENDING',
                    transactionId: paymentResult.transactionId
                }
            });
        }

        res.json({
            success: true,
            data: {
                paymentUrl: paymentResult.paymentUrl,
                transactionId: paymentResult.transactionId,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Handle payment webhook
export const handleWebhook = async (req, res, next) => {
    try {
        const { provider } = req.params;
        // Verify signature if Stripe
        const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature'];

        const result = await paymentService.handleWebhook(
            provider.toUpperCase(),
            req.body,
            signature
        );

        if (result.success && result.status === 'COMPLETED') {
            // Update Payment status
            await prisma.payment.update({
                where: { orderId: result.orderId },
                data: {
                    status: 'COMPLETED',
                    updatedAt: new Date()
                },
            });

            // Update Order status to CONFIRMED
            const order = await prisma.order.update({
                where: { id: result.orderId },
                data: { status: 'CONFIRMED' },
                include: { user: true } // for socket room
            });

            // Emit socket event
            const io = req.app.get('io');

            // Notify Customer
            if (order.userId) {
                io.to(`user:${order.userId}`).emit('order:statusChanged', {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    status: 'CONFIRMED',
                });
            } else {
                // If guest, maybe notify via orderId room if implemented
            }

            // Notify Admin with full details
            const fullOrder = await prisma.order.findUnique({
                where: { id: order.id },
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    items: {
                        include: {
                            product: { select: { name: true } },
                            customizations: { include: { ingredient: { select: { name: true } } } }
                        }
                    },
                    payment: true
                }
            });

            const formattedOrder = {
                ...fullOrder,
                items: fullOrder.items.map(item => ({
                    ...item,
                    productName: item.product?.name || 'Tuote',
                    customizations: item.customizations?.map(c => ({
                        ...c,
                        name: c.ingredient?.name || 'Lisuke'
                    }))
                }))
            };

            io.to('admin').emit('admin:newOrder', formattedOrder);
            io.to('admin').emit('order:statusChanged', formattedOrder);
        } else if (result.success && result.status === 'FAILED') {
            await prisma.payment.update({
                where: { orderId: result.orderId },
                data: { status: 'FAILED' },
            });
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};

// Get payment status
export const getPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { orderId },
        });

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        res.json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};
