import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

// Get full menu with categories and products
export const getMenu = async (req, res, next) => {
    try {
        const { lang = 'EN' } = req.query;

        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
                products: {
                    where: { isAvailable: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        basePrice: true,
                        imageUrl: true,
                        isCustomizable: true,
                        preparationTime: true,
                        allergens: true,
                    },
                },
            },
        });

        // TODO: Apply translations based on lang parameter

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// Get all categories
export const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                imageUrl: true,
                _count: {
                    select: { products: true },
                },
            },
        });

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// Get products with filters
export const getProducts = async (req, res, next) => {
    try {
        const { categoryId, search, page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const where = {
            isAvailable: true,
            ...(categoryId && { categoryId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),
            prisma.product.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                products,
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

// Get single product with full details
export const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                defaultIngredients: {
                    include: {
                        ingredient: {
                            select: {
                                id: true,
                                name: true,
                                allergens: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                customizableIngredients: {
                    include: {
                        ingredient: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                allergens: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (!product.isAvailable) {
            throw new AppError('Product is not available', 400);
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// Get all ingredients
export const getIngredients = async (req, res, next) => {
    try {
        const ingredients = await prisma.ingredient.findMany({
            where: { isAvailable: true },
            select: {
                id: true,
                name: true,
                price: true,
                allergens: true,
                imageUrl: true,
            },
        });

        res.json({
            success: true,
            data: ingredients,
        });
    } catch (error) {
        next(error);
    }
};
