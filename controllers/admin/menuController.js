import prisma from '../../utils/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { slugify } from '../../utils/helpers.js';

// Get all categories for admin
export const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true },
            orderBy: { displayOrder: 'asc' },
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// Get all products for admin
export const getProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' },
            include: { category: true }
        });
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

// Get all ingredients for admin
export const getIngredients = async (req, res, next) => {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: ingredients });
    } catch (error) {
        next(error);
    }
};

// Create category
export const createCategory = async (req, res, next) => {
    try {
        const { name, description, displayOrder, imageUrl } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
                slug: slugify(name),
                description,
                displayOrder: displayOrder || 0,
                imageUrl,
            },
        });

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// Update category
export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, displayOrder, imageUrl, isActive } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(name && { name, slug: slugify(name) }),
                ...(description !== undefined && { description }),
                ...(displayOrder !== undefined && { displayOrder }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// Delete category
export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if category has products
        const productCount = await prisma.product.count({
            where: { categoryId: id },
        });

        if (productCount > 0) {
            throw new AppError('Cannot delete category with products', 400);
        }

        await prisma.category.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Create product
export const createProduct = async (req, res, next) => {
    try {
        const {
            categoryId,
            name,
            description,
            basePrice,
            imageUrl,
            isCustomizable,
            preparationTime,
            allergens,
            nutritionalInfo,
        } = req.body;

        const product = await prisma.product.create({
            data: {
                categoryId,
                name,
                slug: slugify(name),
                description,
                basePrice,
                imageUrl,
                isCustomizable: isCustomizable || false,
                preparationTime: preparationTime || 15,
                allergens: allergens || [],
                nutritionalInfo,
            },
        });

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// Update product
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.name) {
            updateData.slug = slugify(updateData.name);
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Create ingredient
export const createIngredient = async (req, res, next) => {
    try {
        const { name, price, allergens, nutritionalInfo, imageUrl, isAvailable } = req.body;

        const ingredient = await prisma.ingredient.create({
            data: {
                name,
                price: price || 0,
                allergens: allergens || [],
                nutritionalInfo,
                imageUrl,
                isAvailable: isAvailable !== undefined ? isAvailable : true,
            },
        });

        res.status(201).json({
            success: true,
            data: ingredient,
        });
    } catch (error) {
        next(error);
    }
};

// Update ingredient
export const updateIngredient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const ingredient = await prisma.ingredient.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: ingredient,
        });
    } catch (error) {
        next(error);
    }
};
