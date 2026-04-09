# FarmsAge 2.0 - End-to-End Project Documentation

## 1. Project Overview
**FarmsAge 2.0** is a modern e-commerce platform designed to bridge the gap between local vendors/farmers and urban households in Bulandshahr & Noida. It provides a seamless interface for customers to browse fresh produce, dairy, and organic products, while offering robust management tools for administrators.

---

## 2. Technology Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (via Vite)
- **Styling**: TailwindCSS & Vanilla CSS for custom components
- **State Management**: React Context API (Auth, Cart)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Networking**: Axios (Base URL: `http://localhost:3000`)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Security**: JWT-based Authentication & Password hashing
- **Environment Management**: dotenv
- **Middleware**: CORS, JSON Parsing, custom Auth/Admin handlers

---

## 3. Project Structure

### Root Directory
```text
/Backend/           - Node.js server and API
/FarmsAGE-2.0/      - React frontend application
implementation_plan.md - Project roadmap and requirements
```

### Backend (`/Backend/src`)
- **models/**: Mongoose schemas (User, Product, Order)
- **routes/**: API endpoint definitions (auth, admin, order)
- **controller/**: Business logic for routes
- **middleware/**: Security checks (auth.middleware, admin.middleware)
- **db/**: Database connection configuration

### Frontend (`/FarmsAGE-2.0/src`)
- **Pages/**: Application views (Home, Cart, Checkout, etc.)
- **Pages/Admin/**: Dedicated administration workspace (Dashboard, Inventory, Orders)
- **components/layout/**: Global UI elements (Navbar, Footer, MainLayout)
- **context/**: State management for Login and Shopping Cart
- **routes/**: Dynamic routing system and access protection (AdminRoute)

---

## 4. Key Feature Modules

### 🔐 Authentication System
- **Flow**: Phone Number + OTP-based verification.
- **Roles**: Distinct roles for `user`, `vendor`, and `admin`.
- **Profile Completion**: Mandatory profile setup for new users (Address, Name).

### 🛒 Shopping Experience
- **Categories**: Seasonal Fruits, Fresh Vegetables, Dairy, and Organic Selection.
- **Cart System**: Live quantity updates, weight-based calculations, and persistence.
- **Checkout**: Delivery address selection/editing and total calculation.

### 📦 Order Fulfillment
- **Tracking**: Users can track their previous orders and current status.
- **Backend**: Robust order logging with item snapshots and payment ID tracking.

### 🛠️ Professional Admin Panel
- **Dashboard**: High-level business intelligence (Sales, Users, Orders).
- **Product Inventory**: Full CRUD (Create, Read, Update, Delete) for managing store items.
- **Order Management**: Real-time status updates (Pending → Processing → Delivered).
- **Security**: Case-insensitive role verification and route protection.

---

## 5. Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB instance (local or Atlas)

### Backend Setup
1. Open terminal in `/Backend`.
2. Run `npm install`.
3. Create a `.env` file with `MONGO_URI`, `PORT=3000`, and `JWT_SECRET`.
4. Start the server: `npm run dev`.

### Frontend Setup
1. Open terminal in `/FarmsAGE-2.0`.
2. Run `npm install`.
3. Start the Vite server: `npm run dev`.
4. Access the app at `http://localhost:5173`.

---

## 6. Technical Deep-Dive

### 🛡️ Middleware & Security
- **`authMiddleware`**: Verifies the JWT token from the `Authorization` header. If valid, attaches the `user` object to the request.
- **`adminMiddleware`**: Executes after `authMiddleware`. It checks if `req.user.role === 'admin'`. If not, it blocks the request with a 403 Forbidden status.
- **`AdminRoute` (Frontend)**: A wrapper component that checks the `AuthContext` status. It prevents unauthorized users from even seeing the Admin components, redirecting them to `/login`.

### 📊 Database Models
- **User**: Stores phone (unique), name, addresses, and `role` (enum: user, vendor, admin).
- **Product**: Stores name, category (Fruits, Vegetables, etc.), price, image URL, and organic status.
- **Order**: Captures the full snapshot of items purchased, total amount, shipping address, and live status.

---

## 7. API Roadmap
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/send-otp` | POST | Triggers phone verification |
| `/api/auth/verify-otp` | POST | Authenticates user and returns JWT |
| `/api/orders` | GET | Fetch current user's order history |
| `/api/admin/orders` | GET | Global order list for staff |
| `/api/admin/products` | POST | Add new items to the inventory |

---

## 8. Deployment Strategy
- **Frontend**: Can be built using `npm run build` and hosted on platforms like Vercel or Netlify.
- **Backend**: Can be deployed on Render, Heroku, or AWS with a persistent MongoDB Atlas cluster.
- **CORS**: Ensure the backend CORS configuration is updated with the production frontend URL.

---

## 9. Future Enhancements
- Integration with live payment gateways (Razorpay/Paytm).
- Vendor-specific dashboards for secondary sellers.
- Multi-city expansion with geo-fencing.
- Real-time delivery tracking via Maps integration.

---

*Documentation maintained and expanded by Antigravity AI.*
