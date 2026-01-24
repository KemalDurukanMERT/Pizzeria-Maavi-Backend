import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export default {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS & URLs
  cors: {
    customerUrl: process.env.CUSTOMER_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  },
  baseUrl: process.env.BACKEND_URL || 'http://localhost:3000',

  // Payment Providers
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    verkkomaksu: {
      apiKey: process.env.VERKKOMAKSU_API_KEY,
      secret: process.env.VERKKOMAKSU_SECRET,
    },
    lounasseteli: {
      apiKey: process.env.LOUNASSETELI_API_KEY,
      secret: process.env.LOUNASSETELI_SECRET,
    },
    epassi: {
      apiKey: process.env.EPASSI_API_KEY,
      secret: process.env.EPASSI_SECRET,
    },
  },

  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@pizzeriamavi.fi',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
