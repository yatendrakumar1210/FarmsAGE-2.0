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
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import products from "../data/products";

const MyOrders = () => {
  const navigate = useNavigate();
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
      // Sort orders by most recent first
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
          icon: <CheckCircle2 size={14} />,
          text: "Delivered"
        };
      case "Processing": 
        return { 
          color: "bg-amber-50 text-amber-600 border-amber-100", 
          icon: <Clock size={14} />,
          text: "Processing"
        };
      case "OutForDelivery": 
        return { 
          color: "bg-blue-50 text-blue-600 border-blue-100", 
          icon: <Truck size={14} />,
          text: "Out for Delivery"
        };
      case "Cancelled": 
        return { 
          color: "bg-rose-50 text-rose-600 border-rose-100", 
          icon: <XCircle size={14} />,
          text: "Cancelled"
        };
      default: 
        return { 
          color: "bg-slate-50 text-slate-600 border-slate-100", 
          icon: <Package size={14} />,
          text: status 
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-800 uppercase tracking-widest text-xs">Fetching Freshness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-10 pb-24">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/home')}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 hover:-translate-x-1 transition-transform border border-gray-100"
            >
              <ArrowLeft size={24} className="text-slate-800" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Order History</h1>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Total {orders.length} orders placed
              </p>
            </div>
          </div>

          <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm md:w-64">
            <Search size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search by ID or Product" 
              className="bg-transparent border-none outline-none px-3 text-sm font-medium w-full"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-[3rem] p-16 text-center border border-gray-100 shadow-2xl shadow-emerald-100/20"
          >
            <div className="w-36 h-36 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
              <ShoppingBag size={56} className="text-emerald-300" />
              <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full border-4 border-emerald-50 flex items-center justify-center text-emerald-600">
                <Package size={16} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">No orders joined yet!</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">
              Start your organic journey today. Explore our fresh harvests and direct-from-farm products.
            </p>
            <Link to="/category/all">
              <button className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all">
                 Browse Marketplace
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence>
              {orders.map((order, idx) => {
                const status = getStatusConfig(order.status);
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-100/30 transition-all duration-500"
                  >
                    {/* Header: ID, Date, Amount */}
                    <div className="p-8 pb-4 flex flex-wrap items-start justify-between gap-6">
                      <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${status.color}`}>
                          {status.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xl font-black text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</span>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
                              {status.text}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                            <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={12}/> {order.deliveryAddress.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">₹{order.totalAmount}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-2 text-slate-400">
                          <CreditCard size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{order.paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Horizontal Scroll / List */}
                    <div className="px-8 py-6">
                      <div className="space-y-4">
                        {order.items.map((item, iIdx) => {
                          const name = item.name || getProductDetails(item.productId).name;
                          const image = item.image || getProductDetails(item.productId).image;

                          return (
                            <div key={iIdx} className="flex items-center gap-5 p-3 rounded-2xl border border-transparent hover:border-emerald-50 hover:bg-emerald-50/10 transition-all group/item">
                              <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                <img src={image} alt={name} className="w-full h-full object-contain p-2" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-800">{name}</h4>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                  <span>{item.weight}</span>
                                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                  <span>Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-900 text-sm">₹{item.price * item.quantity}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="px-8 py-5 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100/50">
                       <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                         <MapPin size={14} />
                         Deliver to: <span className="text-slate-700">{order.deliveryAddress.addressLine}, {order.deliveryAddress.city}</span>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-slate-800 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                             Request Invoice <ExternalLink size={14} />
                          </button>
                          <button className="px-6 py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2">
                             Reorder <ChevronRight size={14} />
                          </button>
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
