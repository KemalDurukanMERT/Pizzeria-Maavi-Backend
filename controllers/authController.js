import prisma from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import {
    hashPassword,
    comparePassword,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../utils/helpers.js';

export const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone, address } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                address: address || null,
            },
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

        const token = generateToken({
            sub: user.id,
            email: user.email,
            role: 'customer',
        });

        const refreshToken = generateRefreshToken({
            sub: user.id,
            email: user.email,
        });

        res.status(201).json({
            success: true,
            data: {
                user,
                token,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Login user
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AppError('Account is deactivated', 403);
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate tokens
        const token = generateToken({
            sub: user.id,
            email: user.email,
            role: 'customer',
        });

        const refreshToken = generateRefreshToken({
            sub: user.id,
            email: user.email,
        });

        // Remove password from response
        const { passwordHash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Refresh token
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token required', 400);
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Check if user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        if (!user || !user.isActive) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new access token
        const token = generateToken({
            sub: user.id,
            email: user.email,
            role: 'customer',
        });

        res.json({
            success: true,
            data: {
                token,
            },
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new AppError('Invalid refresh token', 401));
        }
        next(error);
    }
};

// Get current user
export const me = async (req, res, next) => {
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
