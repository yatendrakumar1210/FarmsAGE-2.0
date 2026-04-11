import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  XCircle, 
  Search,
  Truck,
  CreditCard,
  FileText,
  RefreshCcw,
  Sparkles,
  Calendar,
  Box
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import products from "../data/products";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getProductDetails = (id) => {
    return products.find(p => p.id == id) || { name: "Organic Produce", image: "" };
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/orders/get-order", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Delivered": 
        return { 
          color: "bg-emerald-50 text-emerald-600 border-emerald-100", 
          dot: "bg-emerald-500",
          icon: <CheckCircle2 size={12} className="shrink-0" />,
          text: "Delivered"
        };
      case "Processing": 
        return { 
          color: "bg-amber-50 text-amber-600 border-amber-100", 
          dot: "bg-amber-500",
          icon: <Clock size={12} className="shrink-0 animate-pulse" />,
          text: "Processing"
        };
      case "OutForDelivery": 
        return { 
          color: "bg-blue-50 text-blue-600 border-blue-100", 
          dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
          icon: <Truck size={12} className="shrink-0" />,
          text: "Out for Delivery"
        };
      case "Cancelled": 
        return { 
          color: "bg-rose-50 text-rose-600 border-rose-100", 
          dot: "bg-rose-500",
          icon: <XCircle size={12} className="shrink-0" />,
          text: "Cancelled"
        };
      default: 
        return { 
          color: "bg-slate-50 text-slate-600 border-slate-100", 
          dot: "bg-slate-500",
          icon: <Package size={12} className="shrink-0" />,
          text: status 
        };
    }
  };

  const filteredOrders = orders.filter(order => 
    order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="flex flex-col items-center gap-6 relative z-10">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               className="w-12 h-12 border-2 border-slate-100 border-t-emerald-600 rounded-full"
            />
            <div className="text-center">
              <p className="font-semibold text-slate-900 tracking-wider text-[10px] mb-1">FARMSAGE</p>
              <p className="text-slate-400 font-medium text-xs">Getting your orders...</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] min-h-screen flex flex-col font-sans selection:bg-emerald-100">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-10 pb-24">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Link
                to="/home"
                className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all group"
              >
                <ArrowLeft size={18} className="text-slate-600" />
              </Link>
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">Order History</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              My <span className="text-emerald-600">Orders</span>
            </h1>
          </div>

          <div className="relative group md:max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </motion.div>

        {filteredOrders.length === 0 ? (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="bg-white rounded-[2rem] p-16 text-center border border-slate-50 shadow-sm"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
               <ShoppingBag size={48} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders yet</h2>
            <p className="text-slate-400 max-w-xs mx-auto mb-8 text-sm font-medium">
              Looks like you haven't placed any orders from our farms.
            </p>
            <Link to="/category/all">
              <button className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
                 Start Shopping
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
                const status = getStatusConfig(order.status);
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-emerald-100 transition-all group lg:flex"
                  >
                    {/* Left Section: Meta Box */}
                    <div className="p-6 md:p-8 lg:w-72 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</span>
                           <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-white ${status.color}`}>
                              {status.text}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">#{order._id.slice(-6).toUpperCase()}</h3>
                        
                        <div className="space-y-3">
                           <div className="flex items-center gap-2.5 text-slate-500 font-medium text-xs">
                              <Calendar size={14} className="text-slate-300" />
                              {orderDate}
                           </div>
                           <div className="flex items-center gap-2.5 text-slate-500 font-medium text-xs">
                              <CreditCard size={14} className="text-slate-300" />
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                           </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order Amount</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">₹{order.totalAmount}</p>
                      </div>
                    </div>

                    {/* Right Section: Items & Actions */}
                    <div className="flex-1 flex flex-col p-6 md:p-8">
                       <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Order Items ({order.items.length})</p>
                          <div className="space-y-5">
                            {order.items.map((item, iIdx) => {
                              const name = item.name || getProductDetails(item.productId).name;
                              const image = item.image || getProductDetails(item.productId).image;

                              return (
                                <div key={iIdx} className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 p-1.5 grayscale-[0.2] hover:grayscale-0 transition-all">
                                    <img src={image} alt={name} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-800 text-sm truncate">{name}</h4>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                      {item.weight} <span className="mx-1.5 text-slate-200">|</span> Qty: {item.quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                     <p className="font-bold text-slate-700 text-sm">₹{item.price * item.quantity}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                       </div>

                       <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                               <MapPin size={14} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Ships to</p>
                               <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[150px] md:max-w-xs">{order.deliveryAddress.city}</p>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                               <FileText size={14} /> Invoice
                            </button>
                            <button 
                              onClick={() => navigate('/category/all')}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all flex items-center justify-center gap-2"
                            >
                               Reorder
                               <ChevronRight size={14} />
                            </button>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default MyOrders;
