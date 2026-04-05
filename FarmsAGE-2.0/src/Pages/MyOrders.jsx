import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Package, Clock, MapPin, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import products from "../data/products";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "bg-emerald-100 text-emerald-600";
      case "Processing": return "bg-amber-100 text-amber-600";
      case "OutForDelivery": return "bg-blue-100 text-blue-600";
      case "Cancelled": return "bg-rose-100 text-rose-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-bold text-slate-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-10">
            <Link to="/home" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">My Orders</h1>
          </div>

          {orders.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm"
            >
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
                <ShoppingBag size={48} className="text-slate-200" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">No orders yet!</h2>
              <p className="text-slate-500 mb-10">Looks like you haven't placed any orders with us yet.</p>
              <Link to="/category/all">
                <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">
                   Start Shopping
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {orders.map((order, idx) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                          <Package size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Order ID</p>
                          <p className="font-bold text-slate-800 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                          {order.paymentStatus === "Paid" ? "Paid" : order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 sm:p-8">
                       <div className="space-y-4 mb-6">
                         {order.items.map((item, iIdx) => {
                           // Use saved data if exists, otherwise fallback to lookup
                           const name = item.name || getProductDetails(item.productId).name;
                           const image = item.image || getProductDetails(item.productId).image;

                           return (
                             <div key={iIdx} className="flex items-center gap-4 group">
                               <div className="w-16 h-16 bg-slate-50 rounded-2xl p-1 border border-slate-100 group-hover:border-emerald-100 transition-colors overflow-hidden shrink-0">
                                 {image ? (
                                   <img src={image} alt={name} className="w-full h-full object-cover rounded-xl" />
                                 ) : (
                                   <div className="w-full h-full bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                      <Leaf size={24}/>
                                   </div>
                                 )}
                               </div>
                               <div className="flex-1">
                                 <p className="font-bold text-slate-800 text-sm truncate">{name}</p>
                                 <p className="text-xs font-bold text-slate-500">{item.weight} × {item.quantity}</p>
                               </div>
                               <div className="text-right shrink-0">
                                 <p className="font-black text-slate-800 text-sm">₹{item.price * item.quantity}</p>
                               </div>
                             </div>
                           );
                         })}
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-6 text-slate-400">
                            <div className="flex items-center gap-2">
                               <Clock size={16} />
                               <span className="text-xs font-bold">
                                 {new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} at {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                               <MapPin size={16} />
                               <span className="text-xs font-bold truncate max-w-[150px]">{order.deliveryAddress.city}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                             <p className="text-xl font-black text-emerald-600 leading-none">₹{order.totalAmount}</p>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

const Leaf = ({size, className}) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C10.5 14.28 12 14 15 12c-2 3-2.33 4.5-2 8.5C11 21 11 21 2 21Z"/>
    </svg>
)

export default MyOrders;
