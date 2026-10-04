import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Truck, 
  CreditCard, 
  Box, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Edit3, 
  Navigation, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import MapLocationPicker from "../components/location/MapLocationPicker";
import { calculateNewUnitPrice } from "../utils/weightUtils";
import { API_BASE_URL as API } from "../config/api";
import { playOrderSuccessSound } from "../utils/playOrderSound";

const Checkout = () => {
  const { cart, clearCart, updateQuantity, removeFromCart, updateItemWeight, appliedCoupon } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");

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

  const handleAuthError = (message) => {
    alert(message || "Your session has expired or is invalid. Please log in again to place your order.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { state: { from: "/checkout" } });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || token === "null" || token === "undefined") {
        handleAuthError("Please log in to continue with checkout.");
        return;
      }
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleAuthError("Your login session has expired. Please log in again.");
        return;
      }
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
      if (!token || token === "null" || token === "undefined") return;
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
  const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    return (
      address.name && 
      address.name.trim() !== "" && 
      address.phone && 
      address.phone.trim() !== "" && 
      address.street && 
      address.street.trim() !== "" && 
      address.city && 
      address.city.trim() !== "" && 
      address.pincode && 
      address.pincode.trim() !== ""
    );
  };

  const selectSavedAddress = (addr, index) => {
    setAddress(addr);
    setSelectedAddressIndex(index);
    setShowNewAddressForm(false);
  };

  const handleOnlinePayment = async () => {
    if (!validateAddress()) {
      alert("Please fill in all address details (Name, Phone, Street, City, Pincode)");
      setShowNewAddressForm(true);
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === "null" || token === "undefined") {
      handleAuthError("Please log in to place your order.");
      return;
    }

    setLoading(true);
    try {
      saveCurrentAddressToProfile(address);

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const orderData = {
        deliveryAddress: address,
        couponCode: appliedCoupon?.code || null,
        items: cart.map(item => ({
          productId: String(item._id || item.id),
          price: Number(item.price),
          quantity: item.quantity,
          weight: item.weight || "1 kg",
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
      if (res.status === 401 || data.message?.toLowerCase().includes("token")) {
        handleAuthError("Session expired. Please log in again to complete your order.");
        return;
      }
      if (!res.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      const razorpayOrder = data.order;
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error(
          data.message || "Failed to initialize payment gateway order"
        );
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || data.key_id;
      if (!razorpayKey) {
        throw new Error("Online payment gateway key is not configured. Please use Cash on Delivery or try again later.");
      }

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "FarmsAGE 2.0",
        description: "Organic Fresh Produce",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          setLoading(true);
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

            if (verifyRes.status === 401) {
              handleAuthError("Session expired during payment verification. Please log in again.");
              return;
            }

            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              playOrderSuccessSound();
              clearCart();
              const returnedOrder = verifyResult.order || (verifyResult.allOrders && verifyResult.allOrders[0]) || { _id: "FARMS-" + Date.now() };
              const returnedId = verifyResult.orderId || returnedOrder._id || "FARMS-" + Date.now();

              navigate("/order-success", { 
                state: { 
                  orderId: returnedId,
                  paymentMethod: 'online',
                  order: returnedOrder
                } 
              });
            } else {
              alert(verifyResult.message || "Payment verification failed");
            }
          } catch (err) {
            console.error("Verification failed", err);
            alert("Payment verification failed: " + (err.message || "Please try again"));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
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
      rzp.on('payment.failed', function (response) {
        console.error("Payment failed:", response.error);
        alert(`Payment Failed: ${response.error.description || "Reason unknown"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Order creation failed", err);
      alert(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleCOD = async () => {
    if (!validateAddress()) {
      alert("Please fill in all address details (Name, Phone, Street, City, Pincode)");
      setShowNewAddressForm(true);
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === "null" || token === "undefined") {
      handleAuthError("Please log in to place your order.");
      return;
    }

    setLoading(true);
    try {
      saveCurrentAddressToProfile(address);

      const orderData = {
        items: cart.map(item => ({
          productId: String(item._id || item.id),
          price: Number(item.price),
          quantity: item.quantity,
          weight: item.weight || "1 kg",
          name: item.name,
          image: item.image,
          vendorId: item.vendorId || null
        })),
        deliveryAddress: address,
        couponCode: appliedCoupon?.code || null,
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
      if (res.status === 401 || result.message?.toLowerCase().includes("token")) {
        handleAuthError("Session expired. Please log in again to place your COD order.");
        return;
      }

      if (result.success) {
        playOrderSuccessSound();
        clearCart();
        const returnedOrder = result.order || (result.allOrders && result.allOrders[0]) || { _id: "FARMS-" + Date.now() };
        const returnedId = result.orderId || returnedOrder._id || "FARMS-" + Date.now();

        navigate("/order-success", { 
          state: { 
            orderId: returnedId,
            paymentMethod: 'cod',
            order: returnedOrder
          } 
        });
      } else {
        alert(result.message || "Failed to place COD order");
      }
    } catch (err) {
      console.error("COD creation failed", err);
      alert("Failed to place COD order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "online") {
      handleOnlinePayment();
    } else {
      handleCOD();
    }
  };

  if (cart.length === 0) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
         <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-md">
           <ShoppingBag size={48} className="mx-auto text-emerald-500 mb-4" />
           <h2 className="text-xl font-black text-slate-800 mb-2">Your Cart is Empty</h2>
           <p className="text-sm text-slate-500 mb-6">Add fresh produce to your cart before proceeding to checkout.</p>
           <Link to="/category/all" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all inline-block">
             Explore Fresh Produce
           </Link>
         </div>
       </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#F8FAFC] min-h-screen pt-4 sm:pt-8 pb-32 sm:pb-20 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link to="/cart" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200 shrink-0">
              <ArrowLeft size={22} />
            </Link>
            <h1 className="text-xl sm:text-3xl font-black text-slate-800 truncate">Checkout</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start w-full min-w-0">
            <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
              {/* Address Section */}
              <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-emerald-50 p-2.5 sm:p-3 rounded-2xl border border-emerald-100/80 text-emerald-600 shrink-0">
                      <Truck size={22} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-slate-800">Delivery Address</h2>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                          ⚡ 10-15 Mins
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-semibold truncate sm:whitespace-normal">Select saved address or pinpoint on interactive map</p>
                    </div>
                  </div>

                  {/* Pick on Map Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
                  >
                    <Navigation size={15} />
                    <span>Pick on Map</span>
                  </button>
                </div>

                {/* GPS Pin Confirmation Banner */}
                {address.latitude && address.longitude && (
                  <div className="mb-6 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        📍
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-emerald-950">GPS Location Pin Confirmed</p>
                        <p className="text-[11px] font-semibold text-emerald-700 truncate">
                          {address.street || "Pin Dropped"}, {address.city} (Lat: {Number(address.latitude).toFixed(4)}, Lng: {Number(address.longitude).toFixed(4)})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm shrink-0 self-start sm:self-auto"
                    >
                      Adjust Pin
                    </button>
                  </div>
                )}

                {/* 1-Click Saved Addresses List */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 space-y-3 min-w-0">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Saved Addresses</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {savedAddresses.map((addr, idx) => {
                        const isSelected = selectedAddressIndex === idx && !showNewAddressForm;
                        return (
                          <div
                            key={idx}
                            onClick={() => selectSavedAddress(addr, idx)}
                            className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all min-w-0 ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-50"
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">{addr.name}</p>
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                                    {addr.label || "Address"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-snug break-words">
                                  {addr.houseNumber ? `${addr.houseNumber}, ` : ""}{addr.street}, {addr.city} - {addr.pincode}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold truncate">📞 {addr.phone}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
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
                    className="inline-flex items-center justify-center gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 transition-colors shrink-0"
                  >
                    {showNewAddressForm ? <Edit3 size={15} /> : <Plus size={15} />}
                    <span>{showNewAddressForm ? "Use Saved Address" : "+ Enter Different Address Form"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="inline-flex items-center justify-center gap-2 text-xs font-black text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition-colors shrink-0"
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
                    className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6 min-w-0"
                  >
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <User size={13} className="text-emerald-500" /> Full Name *
                      </label>
                      <input 
                        name="name"
                        value={address.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-500" /> Phone Number *
                      </label>
                      <input 
                        name="phone"
                        value={address.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700">Flat / House / Floor No.</label>
                      <input 
                        name="houseNumber"
                        value={address.houseNumber || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. Flat 301, 3rd Floor"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700">Landmark</label>
                      <input 
                        name="landmark"
                        value={address.landmark || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. Near Community Center"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin size={13} className="text-emerald-500" /> Street / Society / Area *
                      </label>
                      <input 
                        name="street"
                        value={address.street}
                        onChange={handleInputChange}
                        placeholder="Street Name, Locality"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700">City *</label>
                      <input 
                        name="city"
                        value={address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-bold text-slate-700">Pincode *</label>
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

              {/* Payment Option Selection */}
              <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm min-w-0 w-full">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="bg-emerald-50 p-2.5 sm:p-3 rounded-2xl shrink-0">
                    <CreditCard size={22} className="text-emerald-600 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-800">Payment Option</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">Select payment method & click Place Order</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6 min-w-0 mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("online")}
                    className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center gap-2 sm:gap-4 transition-all text-center min-w-0 cursor-pointer ${
                      paymentMethod === "online"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm text-emerald-600 shrink-0">
                      <CreditCard size={20} className="sm:w-8 sm:h-8" />
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="font-black text-xs sm:text-base text-slate-900 truncate">Pay Online</p>
                      <p className="text-[9px] sm:text-xs text-emerald-700 font-bold mt-0.5 truncate">UPI, Cards, NetBanking</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center gap-2 sm:gap-4 transition-all text-center min-w-0 cursor-pointer ${
                      paymentMethod === "cod"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm text-slate-700 shrink-0">
                      <Box size={20} className="sm:w-8 sm:h-8" />
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="font-black text-xs sm:text-base text-slate-900 truncate">Cash On Delivery</p>
                      <p className="text-[9px] sm:text-xs text-slate-500 font-bold mt-0.5 truncate">Pay on doorstep delivery</p>
                    </div>
                  </motion.div>
                </div>

                {/* Primary Place Order Action Button inside Payment Section */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : paymentMethod === "online" ? (
                    <>
                      <CreditCard size={18} />
                      <span>Pay ₹{total} Online Now</span>
                    </>
                  ) : (
                    <>
                      <Box size={18} />
                      <span>Place Cash on Delivery Order (₹{total})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="space-y-6 min-w-0 w-full">
              <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-100/20 sticky top-8 min-w-0 w-full">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar min-w-0">
                  {cart.map((item, idx) => {
                    const itemId = item._id || item.id;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 sm:gap-3 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-100">
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
                              className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-200 hover:border-emerald-300 transition-colors block px-1 py-0.5 cursor-pointer outline-none max-w-full"
                            >
                              <option value="1 kg">1 kg</option>
                              <option value="500 g">500 g</option>
                              <option value="250 g">250 g</option>
                              <option value="1 pack">1 pack</option>
                              <option value="1 Piece">1 Piece</option>
                            </select>
                          </div>
                          <p className="font-black text-emerald-600 text-xs mt-1 truncate">
                            ₹{item.price * item.quantity} 
                            <span className="text-[10px] text-slate-400 font-normal ml-1">(₹{item.price}/unit)</span>
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
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
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold text-sm">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-4">
                    <span className="text-base font-black text-slate-800">Total Amount</span>
                    <span className="text-2xl font-black text-emerald-600">₹{total}</span>
                  </div>
                </div>

                {/* Primary Place Order Button in Order Summary Box */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : paymentMethod === "online" ? (
                    <>
                      <CreditCard size={18} />
                      <span>Pay ₹{total} Online</span>
                    </>
                  ) : (
                    <>
                      <Box size={18} />
                      <span>Place COD Order (₹{total})</span>
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
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

      {/* Mobile Sticky Payment Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-3 pb-safe flex items-center justify-between gap-3">
        <div className="pl-1 leading-tight shrink-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total to Pay</p>
          <p className="text-lg font-black text-slate-950">₹{total}</p>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="flex-1 max-w-[240px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-0 truncate disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : paymentMethod === "online" ? (
            `Pay ₹${total} Online`
          ) : (
            `Place COD (₹${total})`
          )}
        </button>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
