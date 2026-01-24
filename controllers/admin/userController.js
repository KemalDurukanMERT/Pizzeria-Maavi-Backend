import prisma from '../../utils/db.js';
import { AppError } from '../../middleware/errorHandler.js';

// Get all customers with basic stats
export const getAllCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const where = {
            OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ],
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    address: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: { orders: true }
                    },
                    orders: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: { createdAt: true }
                    }
                }
            }),
            prisma.user.count({ where }),
        ]);

        const formattedUsers = users.map(user => ({
            ...user,
            orderCount: user._count.orders,
            lastOrderAt: user.orders[0]?.createdAt || null,
            orders: undefined,
            _count: undefined
        }));

        res.json({
            success: true,
            data: {
                users: formattedUsers,
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

// Toggle user status
export const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                isActive: true,
            }
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};
