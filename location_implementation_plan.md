# Location Detection implementation Plan

This document outlines how the real-time location detection feature is implemented in FarmsAge 2.0, from hardware coordinate capture to form auto-population.

## 1. System Architecture

The feature is split into three main layers:
- **Client-Side Detection**: Capturing raw GPS coordinates.
- **Geocoding Layer**: Converting coordinates to human-readable addresses.
- **Backend Storage**: Persisting the location for user history.

---

## 2. Technical Flow

### Step 1: Real-Time GPS Capture
When the user clicks **"Detect My Location"**, the `DetectLocation` component triggers the browser's Geolocation API.
- **Tool**: `navigator.geolocation.getCurrentPosition`
- **Configuration**:
  - `enableHighAccuracy: true`: Forces the use of GPS hardware if available.
  - `timeout: 20000`: Allows 20 seconds for a satellite/sensor fix.
  - `maximumAge: 0`: Prevents using old, cached location data.

### Step 2: Backend Persistence
Immediately after receiving coordinates, the app sends a payload to the backend to save the user's location history.
- **Endpoint**: `POST http://localhost:3000/api/address/save-address`
- **Payload**: `{ address, latitude, longitude }`
- **Backend Controller**: `address.controller.js` saves this into the `Address` MongoDB collection linked to the user's ID.

### Step 3: Reverse Geocoding (Convert to Text)
Since users need text fields (Street, City, Pincode) rather than just numbers, the app uses a geocoding utility.
- **Service**: **Nominatim (OpenStreetMap)**
- **Process**: Sends `latitude` and `longitude` to the Nominatim API.
- **Data Extracted**:
  - `fullAddress`: Complete descriptive string.
  - `city`: Parsed from `data.address.city` or `town`.
  - `pincode`: Parsed from `data.address.postcode`.
  - `street`: Parsed from `data.address.road`.

### Step 4: UI Synchronization (Form Autofill)
The `DetectLocation` component passes the parsed data back to the `Checkout.jsx` page via the `onLocationDetected` callback.
- **Logic**:
```javascript
setAddress(prev => ({
  ...prev,
  street: data.street || data.fullAddress,
  city: data.city,
  pincode: data.pincode
}));
```
- **Result**: The "Street Address", "City", and "Pincode" input fields are updated instantly without manual typing.

---

## 3. Files Involved

| File Name | Purpose |
| :--- | :--- |
| `DetectLocation.jsx` | UI Component & core logic for GPS capture. |
| `getAddress.js` | Utility that communicates with OpenStreetMap API. |
| `locationServices.js` | API service to communicate with your backend. |
| `Checkout.jsx` | Parent page that receives the data to fill the form. |
| `address.routes.js` | Backend route for saving addresses. |
| `address.controller.js` | Backend logic for Mongoose DB operations. |

---

## 4. Security & Privacy
- **HTTPS/Localhost**: The feature only works on `localhost` or `https://` secured domains due to browser security policies.
- **Permissions**: The user must explicitly click "Allow" when the browser asks for location access.
- **Manual Overwrite**: Users can still manually edit any field if the GPS detection is slightly off.
