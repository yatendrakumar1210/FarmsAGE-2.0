# FarmsAge 2.0 Backend Implementation Plan

## Goal Description
Build a robust, scalable, and secure backend RESTful API to support the FarmsAge 2.0 frontend application. The backend will handle user authentication, product catalog management, vendor location routing, cart persistence, order processing, and payment gateway integration.

## User Review Required
> [!IMPORTANT]
> Please review the chosen technology stack constraints. Specifically:
> 1. Is **MongoDB** acceptable for the database, or do you prefer SQL (PostgreSQL/MySQL)?
> 2. Are we using **Razorpay** as the payment gateway?
> 3. Does the application require Phone OTP login (via Twilio/Fast2SMS) or standard Email/Password + Google OAuth?

## Technology Stack
- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose ODM) for flexible product schema and geospatial indexing (for nearby vendors)
- **Authentication:** JWT (JSON Web Tokens) & Phone OTP provider
- **Payment Gateway:** Razorpay
- **Image Storage:** Cloudinary or AWS S3 (for product/vendor images)

## Database Schema Design (MongoDB)

### 1. User Model
- `_id`, `name`, `phone` (Unique), `email`, `role` (User/Admin)
- `addresses`: Array of `{ lat, lng, street, city, state, zip }`
- `createdAt`, `updatedAt`

### 2. Product Model
- `_id`, `name`, `category` (Enum: Fruits, Vegetables, Dairy, Organic)
- `brand`, `description`, `image`, `isOrganic`, `discount`, `oldPrice`
- `price` (Base price)
- `stock`, `vendorId` (Reference)

### 3. Vendor Model
- `_id`, `name`, `rating`, `deliveryTime`
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }` (requires `2dsphere` index for Haversine distance tracking)
- `isActive`

### 4. Order Model
- `_id`, `userId` (Ref), `vendorId` (Ref)
- `items`: Array of `{ productId, weight, quantity, price }`
- `status`: Enum (Pending, Processing, OutForDelivery, Delivered, Cancelled)
- `paymentStatus`: Enum (Pending, Paid, Failed)
- `deliveryAddress`, `totalAmount`, `createdAt`

## API Routes & Endpoints

### Authentication Routes (`/api/auth`)
- `POST /send-otp` - Generate and send OTP to phone number
- `POST /verify-otp` - Verify OTP and return JWT access token
- `GET /me` - Get current authenticated user profile

### Product Routes (`/api/products`)
- `GET /` - Fetch all products with filtering (category, search, organic, pagination)
- `GET /:id` - Get single product details
- `POST /` - (Admin) Create a new product

### Vendor Routes (`/api/vendors`)
- `GET /nearby` - Fetch vendors sorted by distance (requires `lat` and `lng` query params utilizing MongoDB geo-queries `nearSphere`)
- `GET /:id` - Get specific vendor info

### Order & Payment Routes (`/api/orders`)
- `POST /create` - Create an order and generate Razorpay payment order session
- `POST /verify-payment` - Webhook/callback to confirm Razorpay payment signature
- `GET /my-orders` - Fetch user's order history

## Step-by-Step Execution Plan

**Phase 1: Project Setup & Configuration**
1. Create a `backend` directory inside the project root limit.
2. Initialize Node.js (`npm init -y`) and install core dependencies (`express`, `mongoose`, `dotenv`, `cors`).
3. Create `backend/server.js` to set up the Express app and establish a local MongoDB connection.

**Phase 2: Database Modeling**
1. Create `models/User.js` containing user profile, addresses, and roles.
2. Create `models/Product.js` tailored to e-commerce (pricing array, categories, discounts).
3. Create `models/Vendor.js` and specifically apply a `2dsphere` index to its `location` field for Haversine geospatial proximity queries.
4. Create `models/Order.js` that references Users, Vendors, and embedded Product Items.

**Phase 3: Database Seeding**
1. Build a `backend/seeder.js` utility.
2. Port the existing mock data from your frontend (`src/data/products.js` and `vendors.js`) directly into your local MongoDB to give us real working data immediately.

**Phase 4: API Controllers & Routes**
1. **Products:** Build `/api/products` (Fetching all products, single products by ID, filtering by category).
2. **Vendors:** Build `/api/vendors/nearby` (Executing `$nearSphere` queries based on user coordinates).
3. **Cart & Orders:** Build `/api/orders` to accept incoming cart payloads from the frontend.

**Phase 5: Authentication Integration**
1. Install `jsonwebtoken` and `bcryptjs`.
2. Build `/api/auth/send-otp` and `/api/auth/verify-otp`. (We will initially log the OTP to the console instead of sending real SMS to avoid immediate Twilio charges, then integrate real SMS later).
3. Construct `authMiddleware.js` to verify JWTs for protected routes like Checkout or Profile.

**Phase 6: Frontend Wiring**
1. Modify the `src/utils/` and context files on the frontend to execute `fetch` or `axios` calls pointing to `http://localhost:5000` instead of reading static JS objects.








****************************************************************************


# 📱 OTP-Based Authentication System (FarmsAge)

## 🚀 Overview

This module implements a secure **OTP-based login and registration system** using phone numbers.
Users can authenticate without passwords using a one-time verification code (OTP).

---

## 🧠 Flow Diagram

```
User enters phone number
        ↓
Send OTP API generates OTP
        ↓
OTP stored in DB (with expiry)
        ↓
User enters OTP
        ↓
Verify OTP API
        ↓
If user exists → Login
Else → Register new user
        ↓
JWT token returned
```

---

## 🛠️ Tech Stack

* Backend: Node.js + Express
* Database: MongoDB (Mongoose)
* Auth: JWT (JSON Web Tokens)
* OTP Generator: otp-generator
* SMS Service: Twilio / Fast2SMS (optional)

---

## 📂 Folder Structure

```
src/
 ├── models/
 │   ├── userModel.js
 │   └── otpModel.js
 │
 ├── controllers/
 │   └── authController.js
 │
 ├── routes/
 │   └── authRoutes.js
 │
 ├── utils/
 │   ├── generateOtp.js
 │   └── sendSms.js
 │
 └── middleware/
     └── authMiddleware.js
```

---

## ⚙️ Implementation Steps

### 1️⃣ Create OTP Model

* Fields: `phone`, `otp`, `expiresAt`
* Store OTP with expiration time (5 min)

---

### 2️⃣ Generate OTP

* Use `otp-generator` package
* Generate 6-digit numeric OTP

---

### 3️⃣ Send OTP API

**Endpoint:** `/api/auth/send-otp`

* Accept phone number
* Generate OTP
* Save OTP in DB
* Send OTP via SMS (or console for testing)

---

### 4️⃣ Verify OTP API

**Endpoint:** `/api/auth/verify-otp`

* Accept `phone` + `otp`
* Validate OTP:

  * Exists in DB
  * Not expired
* If valid:

  * Check if user exists
  * If not → Create user (Register)
  * If yes → Login user

---

### 5️⃣ Generate JWT Token

* After successful verification
* Return token to client
* Used for protected routes

---

## 🔐 Security Best Practices

* Hash OTP before storing (bcrypt)
* Set OTP expiry (5 minutes)
* Limit OTP requests (rate limiting)
* Delete OTP after successful verification
* Use HTTPS in production

---

## 📦 Example API Requests

### Send OTP

```
POST /api/auth/send-otp
{
  "phone": "9876543210"
}
```

### Verify OTP

```
POST /api/auth/verify-otp
{
  "phone": "9876543210",
  "otp": "123456"
}
``




------------------------------------------------------------------------------


# Razorpay Payment Integration for FarmsAge 2.0

Integrate Razorpay payment gateway so users can pay for their cart orders. The flow:  
**Cart → Checkout Page (address) → Razorpay Popup → Payment Verified → Order Confirmed**

## User Review Required

> [!IMPORTANT]
> **Razorpay API Keys** — You will need a Razorpay account. Get your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the [Razorpay Dashboard](https://dashboard.razorpay.com/). We'll store them in the `.env` file.

> [!WARNING]
> **Webhook Secret** — For production, you should set up a Razorpay webhook at `https://your-domain/api/payment/webhook` and add the `RAZORPAY_WEBHOOK_SECRET` to `.env`. During development, webhook verification is optional.

> [!IMPORTANT]
> **User Address** — The current `User` model has no address fields. The plan adds a `deliveryAddress` field. Alternatively, the address can be collected only at checkout (not saved to profile). **Which approach do you prefer?**

---

## Proposed Changes

### Component 1: Backend — Dependencies & Environment

#### [MODIFY] [package.json](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/package.json)
- Add `razorpay` and `crypto` (built-in, used for signature verification) to dependencies:
```diff
  "dependencies": {
    ...
+   "razorpay": "^2.9.4"
  }
```

#### [MODIFY] [.env](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/.env)
- Add Razorpay environment variables:
```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

### Component 2: Backend — Order Model Update

#### [MODIFY] [order.model.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/src/models/order.model.js)
Add Razorpay-specific fields to track payments:

```diff
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },

+ razorpayOrderId: {
+   type: String,
+   default: null,
+ },
+
+ razorpayPaymentId: {
+   type: String,
+   default: null,
+ },
+
+ razorpaySignature: {
+   type: String,
+   default: null,
+ },
+
+ paymentMethod: {
+   type: String,
+   enum: ["online", "cod"],
+   default: "online",
+ },
```

---

### Component 3: Backend — Razorpay Instance Utility

#### [NEW] [razorpay.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/src/utils/razorpay.js)
Create a reusable Razorpay instance:

```js
const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
```

---

### Component 4: Backend — Payment Controller

#### [NEW] [payment.controller.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/src/controller/payment.controller.js)

Three endpoints:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/payment/create-order` | POST | ✅ | Creates Razorpay order + saves DB order |
| `/api/payment/verify` | POST | ✅ | Verifies payment signature, marks order Paid |
| `/api/payment/webhook` | POST | ❌ | Razorpay server-to-server callback (fallback) |

**Flow details:**

1. **`createOrder`** — Receives `{ items, deliveryAddress, totalAmount }` from frontend. Creates a Razorpay order via API, saves an Order document with `status: "Pending"` and `razorpayOrderId`, returns `{ orderId, razorpayOrderId, amount, currency, keyId }` to frontend.

2. **`verifyPayment`** — Receives `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Verifies signature using HMAC-SHA256 with `RAZORPAY_KEY_SECRET`. If valid, updates order to `paymentStatus: "Paid"`, `status: "Processing"`. Returns success.

3. **`webhookHandler`** — Receives Razorpay webhook events. Verifies webhook signature. On `payment.captured` event, marks the corresponding order as Paid (fallback if frontend verify call fails).

---

### Component 5: Backend — Payment Routes

#### [NEW] [payment.routes.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/src/routes/payment.routes.js)

```js
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), webhookHandler);
```

---

### Component 6: Backend — Register Payment Routes

#### [MODIFY] [app.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/Backend/src/app.js)

```diff
  const authSystem = require('./routes/auth.routes');
+ const paymentRoutes = require('./routes/payment.routes');

  app.use('/api/auth', authSystem);
+ app.use('/api/payment', paymentRoutes);
```

---

### Component 7: Frontend — Checkout Page

#### [NEW] [Checkout.jsx](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/Pages/Checkout.jsx)

A premium, animated checkout page with:

1. **Delivery Address Form** — Name, phone, address line 1 & 2, city, pincode, state
2. **Order Summary Panel** — Lists all cart items with prices (read-only)
3. **Payment Method Toggle** — "Pay Online (Razorpay)" or "Cash on Delivery"
4. **"Place Order" Button** — Triggers the payment flow

**Razorpay flow on button click:**
```
1. POST /api/payment/create-order → get razorpayOrderId
2. Open Razorpay checkout popup with order details
3. On success callback → POST /api/payment/verify with payment details
4. On verification success → Navigate to /order-success
5. On failure → Show error toast, allow retry
```

**Design:** Will match the existing emerald/slate design system with glassmorphism cards, `framer-motion` animations, and mobile-responsive layout.

---

### Component 8: Frontend — Order Success Page

#### [NEW] [OrderSuccess.jsx](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/Pages/OrderSuccess.jsx)

A confirmation page shown after successful payment:
- Animated checkmark (Lottie or framer-motion)
- Order ID display
- "Continue Shopping" and "View Orders" buttons
- Confetti or celebration micro-animation

---

### Component 9: Frontend — Cart Page Update

#### [MODIFY] [Cart.jsx](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/Pages/Cart.jsx)

Change the "Proceed to Checkout" button to navigate to `/checkout`:

```diff
- <button className="...">
-   Proceed to Checkout
- </button>
+ <Link to="/checkout">
+   <button className="...">
+     Proceed to Checkout
+   </button>
+ </Link>
```

---

### Component 10: Frontend — Route Registration

#### [MODIFY] [AppRoutes.jsx](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/routes/AppRoutes.jsx)

```diff
+ import Checkout from "../Pages/Checkout";
+ import OrderSuccess from "../Pages/OrderSuccess";

  <Route path="/category/all" element={<AllProducts />} />
+ <Route path="/checkout" element={<Checkout />} />
+ <Route path="/order-success" element={<OrderSuccess />} />
```

---

### Component 11: Frontend — Razorpay Script Loader

#### [NEW] [useRazorpay.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/utils/useRazorpay.js)

Custom hook to dynamically load the Razorpay checkout script (`https://checkout.razorpay.com/v1/checkout.js`):

```js
// Returns { isLoaded, error }
// Loads script on mount, prevents duplicate loading
```

---

### Component 12: Frontend — API Utility

#### [NEW] [api.js](file:///c:/Users/ks484/Desktop/FarmsAge%20front%20+%20backend/FarmsAGE-2.0/src/utils/api.js)

Centralized API helper with auth token injection:

```js
const API_BASE = "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });
  return res.json();
};
```

---

## File Summary

| # | File | Action | Location |
|---|------|--------|----------|
| 1 | `package.json` | MODIFY | Backend |
| 2 | `.env` | MODIFY | Backend |
| 3 | `order.model.js` | MODIFY | Backend/src/models |
| 4 | `razorpay.js` | NEW | Backend/src/utils |
| 5 | `payment.controller.js` | NEW | Backend/src/controller |
| 6 | `payment.routes.js` | NEW | Backend/src/routes |
| 7 | `app.js` | MODIFY | Backend/src |
| 8 | `Checkout.jsx` | NEW | FarmsAGE-2.0/src/Pages |
| 9 | `OrderSuccess.jsx` | NEW | FarmsAGE-2.0/src/Pages |
| 10 | `Cart.jsx` | MODIFY | FarmsAGE-2.0/src/Pages |
| 11 | `AppRoutes.jsx` | MODIFY | FarmsAGE-2.0/src/routes |
| 12 | `useRazorpay.js` | NEW | FarmsAGE-2.0/src/utils |
| 13 | `api.js` | NEW | FarmsAGE-2.0/src/utils |

---

## Open Questions

> [!IMPORTANT]
> 1. **Do you already have Razorpay API keys?** If not, you'll need to create a Razorpay account (test mode is free).

> [!IMPORTANT]
> 2. **Delivery address** — Should we save the address to the user profile for future orders, or collect it fresh each time at checkout?

> [!NOTE]
> 3. **Cash on Delivery** — Should we support COD as a payment option alongside Razorpay, or only online payments?

---

## Verification Plan

### Automated Tests
1. **Backend API test** — Use Postman/Thunder Client to:
   - `POST /api/payment/create-order` with a valid token and cart data → expect `razorpayOrderId` in response
   - `POST /api/payment/verify` with test signature → expect order status update
2. **Frontend build** — Run `npm run dev` on frontend to confirm no build errors

### Manual Verification
1. Navigate to Cart → Click "Proceed to Checkout" → Fill address → Click "Place Order"
2. Razorpay popup should open with correct amount
3. Complete payment with Razorpay test card (`4111 1111 1111 1111`)
4. Verify redirect to Order Success page
5. Check MongoDB — order should have `paymentStatus: "Paid"` and Razorpay IDs populated



GOOGLE AUTH SYSTEM----------------------

# Implementation Plan: Google Authorization (OAuth2)

This plan outlines the steps to integrate Google Sign-In into the FarmsAge application.

## 1. Prerequisites (Manual Setup)
Before coding, you must set up the Google Cloud Console:
- Go to [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project named **FarmsAge**.
- Navigate to **APIs & Services > OAuth consent screen**.
  - Internal or External? Select **External**.
  - Fill in App Name, User Support Email, and Developer Contact Info.
- Navigate to **APIs & Services > Credentials**.
  - Click **Create Credentials > OAuth client ID**.
  - Application type: **Web application**.
  - Name: **FarmsAge Client**.
  - Authorized JavaScript origins: `http://localhost:5173`.
  - Authorized redirect URIs: `http://localhost:5173`.
- Copy your **Client ID** and **Client Secret**.

## 2. Environment Configuration
Update the `.env` files in both Backend and Frontend.

**Backend (`Backend/.env`):**
```env
GOOGLE_CLIENT_ID=your_client_id_here
```

**Frontend (`FarmsAGE-2.0/.env` or `.env.local`):**
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

## 3. Backend Implementation

### Dependencies
Install the required library in the `Backend` directory:
```bash
npm install google-auth-library
```

### Route Updates
Add a new route to `Backend/src/routes/auth.routes.js`:
```javascript
router.post("/google-login", googleLogin);
```

### Controller Implementation
Implement `googleLogin` in `Backend/src/controller/auth.controller.js`:
- Verify the ID Token using `OAuth2Client`.
- Extract user info (email, name, picture).
- Check if user exists in MongoDB.
- If not, create a new user.
- Generate a JWT and return it to the frontend.

## 4. Frontend Implementation

### Dependencies
Install the required library in the `FarmsAGE-2.0` directory:
```bash
npm install @react-oauth/google
```

### Provider Setup
Wrap the application in `main.jsx`:
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
```

### Login Button Integration
Update the Login page (likely `FarmsAGE-2.0/src/Pages/Auth/Login.jsx`):
- Add the `GoogleLogin` component.
- On success, call the backend `/api/auth/google-login` with the `credential`.
- Update `AuthContext` to handle the returned token.

## 5. Testing
- Verify that a user can sign in with their Google account.
- Check that the user is correctly saved in the database.
- Ensure the profile information (name, email) is populated.
- Test both new user registration and existing user login via Google.
