# ThulasiBloom - Premium Health Mix

A responsive e-commerce website for premium health mix products with cart persistence and notification system.

## Project Structure

```
thulasibloom/
├── react-app/          # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Context providers
│   │   ├── data/        # Static data
│   │   └── pages/       # Page components
│   └── public/          # Static assets
└── server/              # Backend Node.js server
    ├── server.js        # Main server file
    └── thulasibloom.db  # SQLite database (auto-created)
```

## Features

### Frontend
- ✅ Fully responsive design for all mobile devices
- ✅ Product catalog with detailed views
- ✅ Shopping cart functionality
- ✅ Notify me system for out-of-stock products
- ✅ Touch-friendly interface

### Backend
- ✅ RESTful API with Express.js
- ✅ SQLite database for data persistence
- ✅ Cart management (add, update, remove, clear)
- ✅ Notification system (email/phone collection)

## Getting Started

### Start the Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### Start the Frontend
```bash
cd react-app
npm start
# Frontend runs on http://localhost:3000
```

## API Endpoints

### Cart Management
- `GET /api/cart` - Get all cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Notifications
- `POST /api/notify` - Save notification request
- `GET /api/notifications` - Get all notification requests

## Database Schema

### cart_items
- id (PRIMARY KEY)
- product_id (TEXT)
- product_name (TEXT)
- weight (TEXT)
- price (REAL)
- quantity (INTEGER)
- created_at (DATETIME)

### notifications
- id (PRIMARY KEY)
- product_id (TEXT)
- product_name (TEXT)
- email (TEXT, optional)
- phone (TEXT, optional)
- created_at (DATETIME)

## Mobile Responsiveness

The UI is optimized for:
- ✅ Large tablets (1024px and below)
- ✅ Tablets (768px and below)
- ✅ Mobile Large (480px and below)
- ✅ Mobile Small (375px and below)
- ✅ Mobile Extra Small (320px and below)
- ✅ Landscape orientation support
- ✅ Touch-friendly interactions

## Next Steps

1. **Hosting Setup** - Deploy to cloud platform
2. **Image Storage** - Implement cloud storage for product images
3. **Email/SMS Integration** - Add notification delivery system
4. **User Authentication** - Add user accounts and order history