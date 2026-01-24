import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { AppError } from './errorHandler.js';

export const authenticateAdmin = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Check if user is admin
        if (decoded.role !== 'admin') {
            throw new AppError('Access denied. Admin only.', 403);
        }

        // Attach admin info to request
        req.admin = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.adminRole, // OWNER, MANAGER, STAFF
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401));
        }
        next(error);
    }
};

// Check specific admin role
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return next(new AppError('Authentication required', 401));
        }

        if (!roles.includes(req.admin.role)) {
            return next(new AppError('Insufficient permissions', 403));
        }

        next();
    };
};
