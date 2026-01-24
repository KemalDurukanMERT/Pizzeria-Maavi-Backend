import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// Hash password
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refreshSecret);
};

// Generate order number
export const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `ORD-${year}${month}${day}-${random}`;
};

// Calculate order total
export const calculateOrderTotal = (items, deliveryFee = 0) => {
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = (item.basePrice + item.customizationPrice) * item.quantity;
        return sum + itemTotal;
    }, 0);

    const tax = subtotal * 0.14; // 14% VAT in Finland for food
    const total = subtotal + tax + deliveryFee;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
    };
};

// Slugify text
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};
