import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/config.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminAuthRoutes from './routes/admin/authRoutes.js';
import adminOrderRoutes from './routes/admin/orderRoutes.js';
import adminMenuRoutes from './routes/admin/menuRoutes.js';
import adminUserRoutes from './routes/admin/userRoutes.js';
import adminPrintRoutes from './routes/admin/printRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [config.cors.customerUrl, config.cors.adminUrl],
        credentials: true,
    },
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", config.baseUrl, "blob:"],
            connectSrc: ["'self'", config.baseUrl, config.baseUrl.replace('http', 'ws')],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - Revised for Production
const allowedOrigins = [
    config.cors.customerUrl?.replace(/\/$/, ""),
    config.cors.adminUrl?.replace(/\/$/, ""),
    'http://localhost:5173',
    'http://localhost:5174'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or our Printer Bridge script)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS Blocked for origin:', origin);
            // Optionally allows it anyway for debugging if strict is off
            // For now, let's keep strict but ensure empty origin is handled above
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimiter);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/menu', adminMenuRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/print', adminPrintRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// SOCKET.IO
// ============================================

// Middleware for Socket Authentication
io.use((socket, next) => {
    // 1. Allow connections from trusted origins (Browser Clients)
    const origin = socket.handshake.headers.origin;
    const isTrustedOrigin = allowedOrigins.includes(origin?.replace(/\/$/, ""));

    if (isTrustedOrigin) {
        return next();
    }

    // 2. Allow connections with valid Printer API Key (Server-to-Server / Bridge)
    const token = socket.handshake.auth?.token || socket.handshake.headers?.['x-api-key'];
    const PRINTER_SECRET = process.env.PRINTER_SECRET_KEY || config.jwt.secret; // Fallback to JWT secret if specific key not set

    if (token === PRINTER_SECRET) {
        // Mark socket as a trusted printer
        socket.isPrinter = true;
        return next();
    }

    console.log(`🚫 Socket connection rejected from: ${origin || 'unknown'} (No valid token)`);
    return next(new Error('Authentication failed: Invalid credentials'));
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, socket.isPrinter ? '(PRINTER)' : '(WEB)');

    // Join room based on user type
    socket.on('join', (data) => {
        if (data.type === 'admin') {
            // Extra check: Only allow admin room if user is authenticated via web or is a verified printer
            // (For web, you might decode the JWT here, but for now we rely on the connection check)
            socket.join('admin');
            console.log('Admin/Printer joined:', socket.id);
        } else if (data.userId) {
            socket.join(`user:${data.userId}`);
            console.log('User joined:', data.userId);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = config.port;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Customer URL: ${config.cors.customerUrl}`);
    console.log(`👨‍💼 Admin URL: ${config.cors.adminUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
