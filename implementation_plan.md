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
```

---

## 📈 Future Enhancements

* 🔁 Resend OTP feature
* 🚫 OTP attempt limit (max 5 tries)
* 📱 Auto OTP detection (frontend)
* 🌍 International phone support
* 🔐 Role-based authentication (User/Admin)

---

## 🧪 Testing

* Use Postman / Thunder Client
* Test:

  * Send OTP
  * Verify OTP
  * Invalid OTP
  * Expired OTP

---

## 🚀 Deployment Notes

* Store secrets in `.env`
* Use services like MongoDB Atlas
* Integrate SMS provider (Twilio/Fast2SMS)
* Enable logging & monitoring

---

## 🧑‍💻 Author

Developed as part of **FarmsAge Project** 🌱
