import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Attach user info to request
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
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

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.jwt.secret);

            req.user = {
                id: decoded.sub,
                email: decoded.email,
                role: decoded.role,
            };
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
