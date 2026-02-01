import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateOrderNumber, calculateOrderTotal } from '../utils/helpers.js';

// Create new order
export const createOrder = async (req, res, next) => {
    try {
        const {
            items,
            deliveryType,
            deliveryAddress,
            paymentMethod,
            customerNotes,
            customerName,
        } = req.body;

        const userId = req.user?.id || null;

        // Validate products and calculate prices
        const orderItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: {
                    customizableIngredients: {
                        include: {
                            ingredient: true,
                        },
                    },
                },
            });

            if (!product || !product.isAvailable) {
                throw new AppError(`Product ${item.productId} is not available`, 400);
            }

            let customizationPrice = 0;
            const customizations = [];

            // Validate and calculate customizations
            if (item.customizations && item.customizations.length > 0) {
                for (const customization of item.customizations) {
                    const validCustomization = product.customizableIngredients.find(
                        (ci) =>
                            ci.ingredientId === customization.ingredientId &&
                            ci.action === customization.action
                    );

                    if (!validCustomization) {
                        throw new AppError(
                            `Invalid customization for product ${product.name}`,
                            400
                        );
                    }

                    customizationPrice += validCustomization.priceModifier;
                    customizations.push({
                        ingredientId: customization.ingredientId,
                        action: customization.action,
                        priceModifier: validCustomization.priceModifier,
                    });
                }
            }

            const itemTotalPrice = (product.basePrice + customizationPrice) * item.quantity;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                basePrice: product.basePrice,
                customizationPrice,
                totalPrice: itemTotalPrice,
                specialInstructions: item.specialInstructions,
                customizations,
            });
        }

        // Calculate order totals
        const deliveryFee = deliveryType === 'DELIVERY' ? 5.0 : 0;
        const totals = calculateOrderTotal(orderItems, deliveryFee);

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order with items
        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber,
                status: 'PENDING',
                subtotal: totals.subtotal,
                tax: totals.tax,
                deliveryFee: totals.deliveryFee,
                total: totals.total,
                paymentMethod,
                deliveryType,
                deliveryAddress,
                customerNotes,
                customerName,
                estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
                items: {
                    create: orderItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        basePrice: item.basePrice,
                        customizationPrice: item.customizationPrice,
                        totalPrice: item.totalPrice,
                        specialInstructions: item.specialInstructions,
                        customizations: {
                            create: item.customizations,
                        },
                    })),
                },
                payment: {
                    create: {
                        provider: paymentMethod === 'CARD' ? 'STRIPE' : paymentMethod,
                        status: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
                        amount: totals.total,
                        currency: 'EUR',
                    },
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                imageUrl: true,
                            },
                        },
                        customizations: {
                            include: {
                                ingredient: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                payment: true,
            },
        });

        // Format order for admin
        const formattedOrderForAdmin = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product?.name || 'Tuote',
                customizations: item.customizations?.map(c => ({
                    ...c,
                    name: c.ingredient?.name || 'Lisuke',
                    // Ensure priceModifier is included for admin view if needed
                    priceModifier: c.priceModifier // Add this line if it's missing and needed
                }))
            }))
        };

        // Emit socket event to admin
        const io = req.app.get('io');
        io.to('admin').emit('admin:newOrder', formattedOrderForAdmin);

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// Get order by ID
export const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                imageUrl: true,
                            },
                        },
                        customizations: {
                            include: {
                                ingredient: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                payment: true,
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Check if user owns this order (if authenticated)
        if (req.user && order.userId && order.userId !== req.user.id) {
            throw new AppError('Access denied', 403);
        }

        const formattedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product?.name || 'Tuote',
                customizations: item.customizations?.map(c => ({
                    ...c,
                    name: c.ingredient?.name || 'Lisuke'
                }))
            }))
        };

        res.json({
            success: true,
            data: formattedOrder,
        });
    } catch (error) {
        next(error);
    }
};

// Get user's order history
export const getUserOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: req.user.id },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                            customizations: {
                                include: {
                                    ingredient: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
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
            prisma.order.count({ where: { userId: req.user.id } }),
        ]);

        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.product?.name || 'Tuote',
                customizations: item.customizations?.map(c => ({
                    ...c,
                    name: c.ingredient?.name || 'Lisuke'
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
