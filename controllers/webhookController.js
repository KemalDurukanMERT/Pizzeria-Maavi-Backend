import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import printService from '../services/printService.js';

export const handleOrderStatusWebhook = async (req, res, next) => {
    try {
        const { orderId, status, secret } = req.body;

        // Simple security check (in production you'd use a more robust verification)
        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mavipizza_secret_123';
        if (secret !== WEBHOOK_SECRET) {
            throw new AppError('Unauthorized webhook call', 401);
        }

        if (!orderId || !status) {
            throw new AppError('Missing orderId or status', 400);
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        // Format for emission
        const formattedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product.name
            }))
        };

        const io = req.app.get('io');

        // Notify customer
        io.to(`order:${order.id}`).emit('order:statusChanged', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
        });

        if (order.userId) {
            io.to(`user:${order.userId}`).emit('order:statusChanged', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
            });
        }

        // Notify admin
        io.to('admin').emit('order:statusChanged', formattedOrder);

        // Auto-print if confirmed
        if (status === 'CONFIRMED') {
            try {
                const fullOrderForPrint = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        user: true,
                        items: {
                            include: {
                                product: true,
                                customizations: { include: { ingredient: true } }
                            }
                        }
                    }
                });

                const printData = {
                    ...fullOrderForPrint,
                    items: fullOrderForPrint.items.map(item => ({
                        ...item,
                        productName: item.product.name,
                        customizations: item.customizations.map(c => ({
                            ...c,
                            name: c.ingredient.name
                        }))
                    }))
                };

                const printJob = await printService.printOrder(printData);
                io.to('printer:main').emit('print:job:created', printJob);
            } catch (printError) {
                console.error('Webhook auto-print failed:', printError);
            }
        }

        res.json({ success: true, message: 'Status updated via webhook' });
    } catch (error) {
        next(error);
    }
};
