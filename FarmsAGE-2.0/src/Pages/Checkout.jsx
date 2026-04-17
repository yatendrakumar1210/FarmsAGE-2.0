import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, Truck, CreditCard, Box, CheckCircle2, User, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import DetectLocation from "../components/location/DetectLocation";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
  });

  // Dynamically load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryCharge;

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    return address.name && address.phone && address.street && address.city && address.pincode;
  };

  const handleOnlinePayment = async () => {
    if (!validateAddress()) {
      alert("Please fill in all address details");
      return;
    }

    setLoading(true);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      
      // 1. Create Razorpay Order
      const orderData = {
        items: cart.map(item => ({
          productId: item._id || item.id,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight,
          name: item.name,
          image: item.image
        }))
      };

      const res = await fetch(`${API}/api/orders/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");
      const { order } = data;

      // 2. Open Razorpay Checkout
      const options = {
        key: "rzp_test_SWa3PA5oApBh4b",
        amount: order.amount,
        currency: "INR",
        name: "FarmsAGE 2.0",
        description: "Organic Fresh Produce",
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: orderData.items,
              deliveryAddress: address,
              totalAmount: total,
              vendorId: cart[0]?.vendorId || null
            };

            const verifyRes = await fetch(`${API}/api/orders/verify-payment`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify(verifyData)
            });

            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              clearCart();
              navigate("/order-success", { 
                state: { 
                  orderId: verifyResult.order._id,
                  paymentMethod: 'online'
                } 
              });
            } else {
              alert("Payment verification failed");
            }
          } catch (err) {
            console.error("Verification failed", err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
        console.error("Order creation failed", err);
        alert("Failed to initiate payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCOD = async () => {
    if (!validateAddress()) {
      alert("Please fill in all address details");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map(item => ({
          productId: item._id || item.id,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight,
          name: item.name,
          image: item.image
        })),
        deliveryAddress: address,
        totalAmount: total,
        vendorId: cart[0]?.vendorId || null
      };

      const res = await fetch(`${API}/api/orders/cod`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(orderData)
      });

      const result = await res.json();
      if (result.success) {
        clearCart();
        navigate("/order-success", { 
          state: { 
            orderId: result.order._id,
            paymentMethod: 'cod'
          } 
        });
      } else {
        alert("Failed to place COD order");
      }
    } catch (err) {
      console.error("COD creation failed", err);
      alert("Failed to place COD order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
       <div className="min-h-screen flex items-center justify-center">
         <p>Your cart is empty. <Link to="/category/all" className="text-emerald-600 underline">Go back to shopping</Link></p>
       </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/cart" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">Checkout</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <Truck size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Delivery Address</h2>
                    <p className="text-slate-500 text-sm">Where should we deliver your fresh produce?</p>
                    <DetectLocation onLocationDetected={(data) => {
                      setAddress(prev => ({
                        ...prev,
                        street: data.street || data.fullAddress,
                        city: data.city,
                        pincode: data.pincode
                      }));
                    }}/>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                      <User size={14} className="text-emerald-500" /> Full Name
                    </label>
                    <input 
                      name="name"
                      value={address.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                      <Phone size={14} className="text-emerald-500" /> Phone Number
                    </label>
                    <input 
                      name="phone"
                      value={address.phone}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" /> Street Address
                    </label>
                    <input 
                      name="street"
                      value={address.street}
                      onChange={handleInputChange}
                      placeholder="Flat/House No., Street Name"
                      className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">City</label>
                    <input 
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      placeholder="City Name"
                      className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Pincode</label>
                    <input 
                      name="pincode"
                      value={address.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit Pincode"
                      className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <CreditCard size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Payment Option</h2>
                    <p className="text-slate-500 text-sm">Choose how you'd like to pay</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOnlinePayment}
                    disabled={loading}
                    className="p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50 flex flex-col items-center gap-4 group hover:bg-emerald-100 transition-colors"
                  >
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-600">
                      <CreditCard size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-emerald-600">Pay Online</p>
                      <p className="text-xs text-emerald-500 font-bold">Debit, Credit, UPI, NetBanking</p>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCOD}
                    disabled={loading}
                    className="p-6 rounded-3xl border-2 border-slate-200 bg-white flex flex-col items-center gap-4 group hover:border-emerald-200 transition-colors"
                  >
                    <div className="bg-slate-50 p-3 rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500">
                      <Box size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-slate-700 group-hover:text-emerald-600">Cash On Delivery</p>
                      <p className="text-xs text-slate-400 font-bold">Pay when you receive</p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-100/20 sticky top-8">
                <h3 className="text-xl font-black text-slate-800 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.weight} × {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-700 text-sm">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-gray-50 pt-6">
                  <div className="flex justify-between text-slate-500 font-bold text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold text-sm">
                    <span>Delivery Charge</span>
                    <span className={deliveryCharge === 0 ? "text-emerald-500" : ""}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-4">
                    <span className="text-base font-black text-slate-800">Total Amount</span>
                    <span className="text-2xl font-black text-emerald-600">₹{total}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Fastest Delivery Guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;


