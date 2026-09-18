import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Truck, CreditCard, Box, CheckCircle2, User, Phone, MapPin, Plus, Minus, Trash2, Check, Edit3, Navigation, Crosshair } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import MapLocationPicker from "../components/location/MapLocationPicker";
import { calculateNewUnitPrice } from "../utils/weightUtils";
import { playOrderSuccessSound } from "../utils/playOrderSound";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const Checkout = () => {
  const { cart, clearCart, updateQuantity, removeFromCart, updateItemWeight } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
    houseNumber: "",
    landmark: "",
    latitude: null,
    longitude: null,
    label: "Home",
  });

  const handleMapLocationSelected = (data) => {
    setAddress((prev) => ({
      ...prev,
      street: data.street,
      city: data.city,
      pincode: data.pincode,
      houseNumber: data.houseNumber || prev.houseNumber,
      landmark: data.landmark || prev.landmark,
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label || "Home",
      name: prev.name || data.name,
      phone: prev.phone || data.phone,
    }));
    setShowNewAddressForm(true);
    setSelectedAddressIndex(null);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const userAddrs = data.user.addresses || [];
        const defaultAddr = data.user.defaultAddress;

        setSavedAddresses(userAddrs);

        if (defaultAddr && defaultAddr.street) {
          setAddress({
            name: defaultAddr.name || data.user.name || "",
            phone: defaultAddr.phone || data.user.phone || "",
            street: defaultAddr.street || "",
            city: defaultAddr.city || "",
            pincode: defaultAddr.pincode || "",
            houseNumber: defaultAddr.houseNumber || "",
            landmark: defaultAddr.landmark || "",
            latitude: defaultAddr.latitude || null,
            longitude: defaultAddr.longitude || null,
            label: defaultAddr.label || "Home",
          });
          const foundIdx = userAddrs.findIndex(a => a.street === defaultAddr.street);
          setSelectedAddressIndex(foundIdx >= 0 ? foundIdx : 0);
        } else if (userAddrs.length > 0) {
          setAddress(userAddrs[0]);
          setSelectedAddressIndex(0);
        } else {
          setAddress(prev => ({
            ...prev,
            name: data.user.name || "",
            phone: data.user.phone || "",
          }));
          setShowNewAddressForm(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const saveCurrentAddressToProfile = async (addrToSave) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch(`${API}/api/auth/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addrToSave),
      });
    } catch (err) {
      console.error("Failed to save address to profile:", err);
    }
  };

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

  const selectSavedAddress = (addr, index) => {
    setAddress(addr);
    setSelectedAddressIndex(index);
    setShowNewAddressForm(false);
  };

  const handleOnlinePayment = async () => {
    if (!validateAddress()) {
      alert("Please fill in all address details");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Auto-save address to user profile
      saveCurrentAddressToProfile(address);

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      const orderData = {
        items: cart.map(item => ({
          productId: item._id || item.id,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight,
          name: item.name,
          image: item.image,
          vendorId: item.vendorId || null
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
              totalAmount: total
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
              playOrderSuccessSound();
              clearCart();
              navigate("/order-success", { 
                state: { 
                  orderId: verifyResult.order._id,
                  paymentMethod: 'online',
                  order: verifyResult.order
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

      // Auto-save address to user profile
      saveCurrentAddressToProfile(address);

      const orderData = {
        items: cart.map(item => ({
          productId: item._id || item.id,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight,
          name: item.name,
          image: item.image,
          vendorId: item.vendorId || null
        })),
        deliveryAddress: address,
        totalAmount: total
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
        playOrderSuccessSound();
        clearCart();
        navigate("/order-success", { 
          state: { 
            orderId: result.order._id,
            paymentMethod: 'cod',
            order: result.order
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
      <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20 font-sans">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100/80 text-emerald-600">
                      <Truck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-800">Delivery Address</h2>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          ⚡ 10-15 Mins
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-semibold">Select saved address or pinpoint on interactive map</p>
                    </div>
                  </div>

                  {/* Pick on Map Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
                  >
                    <Navigation size={15} />
                    <span>Pick on Map</span>
                  </button>
                </div>

                {/* GPS Pin Confirmation Banner */}
                {address.latitude && address.longitude && (
                  <div className="mb-6 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        📍
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-950">GPS Location Pin Confirmed</p>
                        <p className="text-[11px] font-semibold text-emerald-700 truncate">
                          {address.street || "Pin Dropped"}, {address.city} (Lat: {Number(address.latitude).toFixed(4)}, Lng: {Number(address.longitude).toFixed(4)})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm shrink-0 ml-2"
                    >
                      Adjust Pin
                    </button>
                  </div>
                )}

                {/* 1-Click Saved Addresses List */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Saved Addresses</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr, idx) => {
                        const isSelected = selectedAddressIndex === idx && !showNewAddressForm;
                        return (
                          <div
                            key={idx}
                            onClick={() => selectSavedAddress(addr, idx)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-50"
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-extrabold text-sm text-slate-800">{addr.name}</p>
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                    {addr.label || "Address"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                  {addr.houseNumber ? `${addr.houseNumber}, ` : ""}{addr.street}, {addr.city} - {addr.pincode}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold">📞 {addr.phone}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Toggle to Add New Address */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(!showNewAddressForm);
                      if (!showNewAddressForm) {
                        setSelectedAddressIndex(null);
                        setAddress({ name: "", phone: "", street: "", city: "", pincode: "", houseNumber: "", landmark: "", latitude: null, longitude: null, label: "Home" });
                      }
                    }}
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 transition-colors"
                  >
                    {showNewAddressForm ? <Edit3 size={15} /> : <Plus size={15} />}
                    {showNewAddressForm ? "Use Saved Address" : "+ Enter Different Address Form"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Navigation size={14} className="text-emerald-600" />
                    <span>Drop Pin on Map</span>
                  </button>
                </div>

                {/* Address Form */}
                {(showNewAddressForm || savedAddresses.length === 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <User size={13} className="text-emerald-500" /> Full Name
                      </label>
                      <input 
                        name="name"
                        value={address.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-500" /> Phone Number
                      </label>
                      <input 
                        name="phone"
                        value={address.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Flat / House / Floor No.</label>
                      <input 
                        name="houseNumber"
                        value={address.houseNumber || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. Flat 301, 3rd Floor"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Landmark</label>
                      <input 
                        name="landmark"
                        value={address.landmark || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. Near Community Center"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin size={13} className="text-emerald-500" /> Street / Society / Area
                      </label>
                      <input 
                        name="street"
                        value={address.street}
                        onChange={handleInputChange}
                        placeholder="Street Name, Locality"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">City</label>
                      <input 
                        name="city"
                        value={address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Pincode</label>
                      <input 
                        name="pincode"
                        value={address.pincode}
                        onChange={handleInputChange}
                        placeholder="Pincode"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Payment Section */}
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
                
                <div className="space-y-3 mb-6 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map((item, idx) => {
                    const itemId = item._id || item.id;
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                          <div className="mt-0.5 flex items-center">
                            <select
                              value={item.weight}
                              onChange={(e) => {
                                const newWeight = e.target.value;
                                const { newUnitPrice } = calculateNewUnitPrice(item, newWeight);
                                updateItemWeight(itemId, item.weight, newWeight, newUnitPrice);
                              }}
                              className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-200 hover:border-emerald-300 transition-colors block px-1.5 py-0.5 cursor-pointer outline-none"
                            >
                              <option value="1 kg">1 kg</option>
                              <option value="500 g">500 g</option>
                              <option value="250 g">250 g</option>
                              <option value="1 pack">1 pack</option>
                              <option value="1 Piece">1 Piece</option>
                            </select>
                          </div>
                          <p className="font-black text-emerald-600 text-xs mt-1">
                            ₹{item.price * item.quantity} 
                            <span className="text-[10px] text-slate-400 font-normal ml-1">(₹{item.price}/unit)</span>
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(itemId, item.weight, -1);
                              } else {
                                removeFromCart(itemId, item.weight);
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {item.quantity === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                          </button>
                          <span className="text-xs font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemId, item.weight, 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
      {/* Map Location Picker Modal */}
      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelected}
        initialCoords={address.latitude ? { lat: address.latitude, lng: address.longitude } : null}
        initialAddress={address}
      />
      <Footer />
    </>
  );
};

export default Checkout;
