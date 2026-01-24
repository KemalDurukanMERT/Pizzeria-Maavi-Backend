import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user profile
export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone && { phone }),
                ...(address && { address }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};
