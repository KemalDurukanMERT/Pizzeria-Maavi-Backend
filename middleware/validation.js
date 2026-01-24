import Joi from 'joi';
import { AppError } from './errorHandler.js';

// Validation middleware factory
export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return next(new AppError(JSON.stringify(errors), 400));
        }

        next();
    };
};

// Common validation schemas
export const schemas = {
    // User registration
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
        address: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            postalCode: Joi.string().required(),
        }).optional(),
    }),

    // User login
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    // Create order
    createOrder: Joi.object({
        items: Joi.array().items(
            Joi.object({
                productId: Joi.string().uuid().required(),
                quantity: Joi.number().integer().min(1).required(),
                customizations: Joi.array().items(
                    Joi.object({
                        ingredientId: Joi.string().uuid().required(),
                        action: Joi.string().valid('ADD', 'REMOVE', 'EXTRA').required(),
                        priceModifier: Joi.number().min(0).required(),
                    })
                ).optional(),
                specialInstructions: Joi.string().max(500).allow('').optional(),
            })
        ).min(1).required(),
        deliveryType: Joi.string().valid('DELIVERY', 'PICKUP').required(),
        deliveryAddress: Joi.when('deliveryType', {
            is: 'DELIVERY',
            then: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                postalCode: Joi.string().required(),
                instructions: Joi.string().max(500).allow('').optional(),
            }).required(),
            otherwise: Joi.optional(),
        }),
        paymentMethod: Joi.string().valid('CARD', 'VERKKOMAKSU', 'LOUNASSETELI', 'EPASSI', 'CASH').required(),
        customerNotes: Joi.string().max(1000).allow('').optional(),
    }),

    // Create product (admin)
    createProduct: Joi.object({
        categoryId: Joi.string().uuid().required(),
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(1000).optional(),
        basePrice: Joi.number().min(0).required(),
        imageUrl: Joi.string().uri().optional(),
        isCustomizable: Joi.boolean().optional(),
        preparationTime: Joi.number().integer().min(1).optional(),
        allergens: Joi.array().items(Joi.string()).optional(),
        nutritionalInfo: Joi.object().optional(),
    }),

    // Create category (admin)
    createCategory: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).optional(),
        displayOrder: Joi.number().integer().optional(),
        imageUrl: Joi.string().uri().optional(),
    }),

    // Update order status (admin)
    updateOrderStatus: Joi.object({
        status: Joi.string().valid('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED').required(),
    }),
};
