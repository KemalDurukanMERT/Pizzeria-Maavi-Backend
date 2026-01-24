import prisma from '../../utils/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { hashPassword, comparePassword, generateToken } from '../../utils/helpers.js';

// Admin login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { email },
        });

        if (!admin) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check if admin is active
        if (!admin.isActive) {
            throw new AppError('Account is deactivated', 403);
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, admin.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate token
        const token = generateToken({
            sub: admin.id,
            email: admin.email,
            role: 'admin',
            adminRole: admin.role, // OWNER, MANAGER, STAFF
        });

        // Remove password from response
        const { passwordHash, ...adminWithoutPassword } = admin;

        res.json({
            success: true,
            data: {
                admin: adminWithoutPassword,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Verify admin token
export const verify = async (req, res, next) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id: req.admin.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                permissions: true,
            },
        });

        if (!admin) {
            throw new AppError('Admin not found', 404);
        }

        res.json({
            success: true,
            data: admin,
        });
    } catch (error) {
        next(error);
    }
};
