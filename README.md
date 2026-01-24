# Pizzeria Mavi - Backend API

Restaurant ordering platform backend built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- RESTful API with Express
- PostgreSQL database with Prisma ORM
- JWT authentication for customers and admins
- Role-based access control
- Real-time order updates with Socket.io
- Payment integration abstraction layer
- Input validation with Joi
- Rate limiting and security headers
- GDPR-compliant data handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Strong secret key for JWT tokens
   - Other configuration as needed

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # Seed the database with sample data
   npm run seed
   ```

## 🏃 Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## 📚 API Documentation

### Authentication Endpoints

#### Customer Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Customer login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires auth)

#### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/verify` - Verify admin token

### Menu Endpoints (Public)
- `GET /api/menu` - Get full menu with categories
- `GET /api/menu/categories` - List all categories
- `GET /api/menu/products` - List products (with filters)
- `GET /api/menu/products/:id` - Get product details
- `GET /api/menu/ingredients` - List all ingredients

### Order Endpoints
- `POST /api/orders` - Create new order (optional auth)
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/user/history` - Get user's order history (requires auth)

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/webhook/:provider` - Payment webhook handler
- `GET /api/payments/:orderId` - Get payment status

### Admin - Order Management
- `GET /api/admin/orders` - List all orders (with filters)
- `GET /api/admin/orders/stats` - Get order statistics
- `PATCH /api/admin/orders/:id/status` - Update order status

### Admin - Menu Management
- `POST /api/admin/menu/categories` - Create category
- `PUT /api/admin/menu/categories/:id` - Update category
- `DELETE /api/admin/menu/categories/:id` - Delete category
- `POST /api/admin/menu/products` - Create product
- `PUT /api/admin/menu/products/:id` - Update product
- `DELETE /api/admin/menu/products/:id` - Delete product
- `POST /api/admin/menu/ingredients` - Create ingredient
- `PUT /api/admin/menu/ingredients/:id` - Update ingredient

## 🔐 Default Admin Credentials

After running the seed script:
- **Email:** `admin@pizzeriamavi.fi`
- **Password:** `admin123`

⚠️ **Important:** Change these credentials in production!

## 🗄️ Database Schema

The database includes the following main models:
- **User** - Customer accounts
- **Admin** - Admin users with roles
- **Category** - Menu categories
- **Product** - Menu items
- **Ingredient** - Individual ingredients
- **ProductIngredient** - Default product ingredients
- **CustomizableIngredient** - Available customizations
- **Order** - Customer orders
- **OrderItem** - Items in an order
- **OrderItemCustomization** - Applied customizations
- **Payment** - Payment records
- **Translation** - Multilingual content

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed the database
npm run seed
```

## 🌐 WebSocket Events

### Client → Server
- `join` - Join a room (admin or user-specific)

### Server → Client
- `order:statusChanged` - Order status updated (to customer)
- `admin:newOrder` - New order notification (to admin)

## 🔒 Security Features

- Helmet.js for HTTP security headers
- CORS with whitelist
- Rate limiting (general and endpoint-specific)
- JWT token authentication
- Password hashing with bcrypt (cost factor: 12)
- Input validation and sanitization
- SQL injection prevention (Prisma parameterized queries)

## 💳 Payment Integration

The payment service supports multiple providers:
- **Stripe** (for card payments)
- **Verkkomaksu**
- **Lounasseteli**
- **ePassi**
- **Cash** (manual confirmation)

Payment provider credentials should be configured in `.env` when available.

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CUSTOMER_URL` | Customer frontend URL (CORS) | http://localhost:5173 |
| `ADMIN_URL` | Admin frontend URL (CORS) | http://localhost:5174 |
| `STRIPE_SECRET_KEY` | Stripe API key | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Project Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Request handlers
│   └── admin/       # Admin-specific controllers
├── middleware/       # Express middleware
├── routes/          # API routes
│   └── admin/       # Admin routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── server.js        # Main application file
└── package.json
```

## 🚢 Deployment

### Using a free PostgreSQL database:
- **Neon** (https://neon.tech) - Free PostgreSQL with generous limits
- **Supabase** (https://supabase.com) - Free tier with PostgreSQL
- **ElephantSQL** (https://www.elephantsql.com) - Free tier available

### Deploying the backend:
- **Render** (https://render.com) - Free tier for Node.js apps
- **Railway** (https://railway.app) - Free tier with good limits
- **Fly.io** (https://fly.io) - Free tier available

## 📄 License

ISC

## 👥 Support

For issues or questions, please contact the development team.
