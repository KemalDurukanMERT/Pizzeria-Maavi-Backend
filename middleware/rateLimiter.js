import rateLimit from 'express-rate-limit';
import config from '../config/config.js';

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    skipSuccessfulRequests: true,
});

// Moderate limiter for order creation
export const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many orders, please try again later.',
    },
});

export default generalLimiter;
