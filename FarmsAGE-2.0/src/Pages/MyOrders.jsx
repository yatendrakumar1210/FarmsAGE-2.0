import React, { useState, useEffect, useMemo } from "react";
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
  Calendar,
  Box,
  Store,
  Sparkles,
  Printer,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import products from "../data/products";
import { useCart } from "../context/CartContext";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const MyOrders = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getProductDetails = (id) => {
    return products.find(p => p.id == id) || { name: "Organic Produce", image: "" };
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${API}/api/orders/get-order`, {
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
          color: "bg-emerald-50 text-emerald-700 border-emerald-200", 
          dot: "bg-emerald-500",
          icon: <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />,
          text: "Delivered"
        };
      case "Processing": 
        return { 
          color: "bg-amber-50 text-amber-700 border-amber-200", 
          dot: "bg-amber-500",
          icon: <Clock size={13} className="shrink-0 text-amber-600 animate-pulse" />,
          text: "Processing"
        };
      case "OutForDelivery": 
        return { 
          color: "bg-blue-50 text-blue-700 border-blue-200", 
          dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
          icon: <Truck size={13} className="shrink-0 text-blue-600" />,
          text: "Out for Delivery"
        };
      case "Cancelled": 
        return { 
          color: "bg-rose-50 text-rose-700 border-rose-200", 
          dot: "bg-rose-500",
          icon: <XCircle size={13} className="shrink-0 text-rose-600" />,
          text: "Cancelled"
        };
      default: 
        return { 
          color: "bg-slate-50 text-slate-700 border-slate-200", 
          dot: "bg-slate-500",
          icon: <Package size={13} className="shrink-0 text-slate-600" />,
          text: status || "Confirmed"
        };
    }
  };

  // Filter orders by search & tab
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "processing") return order.status === "Processing" || order.status === "OutForDelivery";
      if (activeTab === "delivered") return order.status === "Delivered";
      if (activeTab === "cancelled") return order.status === "Cancelled";

      return true;
    });
  }, [orders, searchQuery, activeTab]);

  const handleReorder = (items) => {
    items.forEach((item) => {
      addToCart(
        {
          _id: item.productId,
          id: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
        },
        item.weight || "1 kg"
      );
    });
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD]">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-slate-200 border-t-emerald-600 rounded-full"
          />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading Order History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFBFD] min-h-screen flex flex-col font-sans selection:bg-emerald-100">
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/home"
                className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={18} className="text-slate-700" />
              </Link>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Customer Account</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              My Order <span className="text-emerald-600">History</span>
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative group md:w-80 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by order ID or item..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {[
            { id: "all", label: `All Orders (${orders.length})` },
            { id: "processing", label: `In Progress (${orders.filter(o => o.status === 'Processing' || o.status === 'OutForDelivery').length})` },
            { id: "delivered", label: `Delivered (${orders.filter(o => o.status === 'Delivered').length})` },
            { id: "cancelled", label: `Cancelled (${orders.filter(o => o.status === 'Cancelled').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-10 sm:p-16 text-center border border-slate-100 shadow-sm max-w-lg mx-auto"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={36} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-6">
              {searchQuery ? `No orders matching "${searchQuery}"` : "You haven't placed any orders yet. Fresh harvests await you!"}
            </p>
            <Link to="/category/all">
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-md hover:bg-emerald-700 transition-all">
                Explore Fresh Products
              </button>
            </Link>
          </motion.div>
        ) : (
          /* Order Cards List */
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => {
                const status = getStatusConfig(order.status);
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="bg-white rounded-[2rem] border border-slate-100/90 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col lg:flex-row"
                  >
                    {/* Left Meta Sidebar */}
                    <div className="p-5 sm:p-6 lg:w-72 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</span>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                            {status.icon}
                            <span>{status.text}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          #{order._id.slice(-8).toUpperCase()}
                        </h3>

                        <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{orderDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.paymentMethod?.toLowerCase() === 'cod' ? (
                              <>
                                <Box size={14} className="text-amber-500" />
                                <span>Cash on Delivery</span>
                              </>
                            ) : (
                              <>
                                <CreditCard size={14} className="text-emerald-500" />
                                <span>Online Paid</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-slate-900">₹{order.totalAmount}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>
                    </div>

                    {/* Right Items & Actions Area */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ordered Produce</p>

                        <div className="space-y-3.5">
                          {order.items.map((item, iIdx) => {
                            const name = item.name || getProductDetails(item.productId).name;
                            const image = item.image || getProductDetails(item.productId).image;

                            return (
                              <div key={iIdx} className="flex items-center gap-3.5 bg-slate-50/40 p-2.5 rounded-2xl border border-slate-100/60">
                                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-100 p-1 shrink-0">
                                  <img src={image} alt={name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">{name}</h4>
                                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                    {item.weight || "1 kg"} <span className="mx-1 text-slate-300">•</span> Qty: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black text-slate-900 text-xs sm:text-sm">₹{item.price * item.quantity}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <MapPin size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{order.deliveryAddress?.city || "Local Delivery"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(order)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileText size={14} className="text-slate-500" />
                            <span>Invoice</span>
                          </button>

                          <button
                            onClick={() => handleReorder(order.items)}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Reorder</span>
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

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setSelectedInvoice(null)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Order Tax Invoice</h3>
                  <p className="text-[11px] font-bold text-slate-400">#{selectedInvoice._id}</p>
                </div>
              </div>

              <div className="space-y-4 my-6 text-xs border-y border-slate-100 py-4">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Date:</span>
                  <span>{new Date(selectedInvoice.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Payment Mode:</span>
                  <span className="uppercase">{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Deliver To:</span>
                  <span>{selectedInvoice.deliveryAddress?.name} ({selectedInvoice.deliveryAddress?.city})</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="font-black text-slate-800 text-xs">Items:</p>
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between font-medium text-slate-700">
                      <span>{item.name} ({item.weight}) x {item.quantity}</span>
                      <span className="font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">₹{selectedInvoice.totalAmount}</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                <Printer size={16} /> Print Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default MyOrders;
