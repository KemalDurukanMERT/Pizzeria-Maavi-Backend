import prisma from '../../utils/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import printService from '../../services/printService.js';

// Get all orders with filters
export const getAllOrders = async (req, res, next) => {
    try {
        const {
            status,
            paymentMethod,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = req.query;

        const skip = (page - 1) * limit;

        const where = {
            ...(status && { status }),
            ...(paymentMethod && { paymentMethod }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                            customizations: {
                                include: {
                                    ingredient: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                    },
                    payment: {
                        select: {
                            status: true,
                            provider: true,
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product.name,
                customizations: item.customizations.map(c => ({
                    ...c,
                    name: c.ingredient.name
                }))
            }))
        }));

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Format order for emission
        const formattedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product.name
            }))
        };

        const io = req.app.get('io');

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

        io.to('admin').emit('order:statusChanged', formattedOrder);

        if (status === 'CONFIRMED') {
            try {
                const fullOrderForPrint = await prisma.order.findUnique({
                    where: { id },
                    include: {
                        user: true,
                        items: {
                            include: {
                                product: true,
                                customizations: {
                                    include: {
                                        ingredient: true
                                    }
                                }
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

                // Emit socket event to printer agent
                io.to('printer:main').emit('print:job:created', printJob);
                console.log('Print job created:', printJob);
            } catch (printError) {
                console.error('Auto-printing failed:', printError);
            }
        }

        res.json({
            success: true,
            data: formattedOrder,
        });
    } catch (error) {
        next(error);
    }
};

// Get order statistics
export const getOrderStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
        };

        const [
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue,
        ] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.count({ where: { ...where, status: 'PENDING' } }),
            prisma.order.count({ where: { ...where, status: { in: ['DELIVERED', 'COMPLETED'] } } }),
            prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma.order.aggregate({
                where: { ...where, status: { not: 'CANCELLED' } },
                _sum: { total: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue: totalRevenue._sum.total || 0,
            },
        });
    } catch (error) {
        next(error);
    }
};
// Print order manually (Reprint)
export const printOrderManually = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch full details for printing with customizations
        const fullOrderForPrint = await prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                        customizations: {
                            include: {
                                ingredient: true
                            }
                        }
                    }
                }
            }
        });

        if (!fullOrderForPrint) {
            throw new AppError('Order not found', 404);
        }

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

        // Emit socket event to printer agent
        const io = req.app.get('io');
        io.to('printer:main').emit('print:job:created', printJob);

        res.json({
            success: true,
            message: 'Print job sent successfully',
            data: printJob
        });
    } catch (error) {
        next(error);
    }
};
