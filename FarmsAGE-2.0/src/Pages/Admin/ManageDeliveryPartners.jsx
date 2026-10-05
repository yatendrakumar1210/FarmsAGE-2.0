import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { API_BASE_URL as API } from "../../config/api";

const ManageDeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/delivery-partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPartners(res.data);
    } catch (error) {
      console.error("Failed to fetch delivery partners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (partnerId, newStatus) => {
    try {
      setActionLoading(partnerId);
      await axios.put(
        `${API}/api/admin/delivery-partners/${partnerId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchPartners();
    } catch (error) {
      console.error("Failed to update partner status", error);
      alert(error.response?.data?.message || "Failed to update delivery partner status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPartners = partners.filter((p) => {
    if (filterStatus !== "all" && p.deliveryStatus !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const phoneMatch = p.phone?.toLowerCase().includes(q);
      const emailMatch = p.email?.toLowerCase().includes(q);
      const vehicleMatch = p.vehicleDetails?.vehicleNumber?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || vehicleMatch;
    }
    return true;
  });

  const pendingCount = partners.filter((p) => p.deliveryStatus === "pending").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} className="text-emerald-600" /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} className="text-amber-600 animate-pulse" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={11} className="text-rose-600" /> Rejected
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle size={11} className="text-orange-600" /> Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Truck size={22} className="text-emerald-600" />
            <span>Delivery Partner Management</span>
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Review registration applications, verify vehicle compliance, and manage network status
          </p>
        </div>

        <button
          onClick={fetchPartners}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected", "suspended"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize flex items-center gap-1.5 cursor-pointer ${
                filterStatus === s
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{s === "all" ? "All Partners" : s}</span>
              {s === "pending" && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50/70 border-b border-gray-100">
              <tr>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Partner / Contact
                </th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Vehicle Details
                </th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Licence Number
                </th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Network Status
                </th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Joined
                </th>
                <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-400">
                    Loading delivery partners...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs font-bold text-slate-400">
                    No delivery partners matching this filter.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-50 hover:bg-slate-50/40 transition"
                  >
                    {/* Partner / Contact */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-100">
                          {p.name?.charAt(0) || "D"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {p.phone}
                            </span>
                            {p.email && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]">
                                <Mail size={10} /> {p.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="p-4">
                      <p className="text-xs font-black text-slate-800">
                        {p.vehicleDetails?.vehicleType || "Not Specified"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono font-bold mt-0.5">
                        {p.vehicleDetails?.vehicleNumber || "No Plate Listed"}
                      </p>
                    </td>

                    {/* Licence */}
                    <td className="p-4">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                        {p.drivingLicenceNumber || "N/A"}
                      </span>
                    </td>

                    {/* Status & Availability */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(p.deliveryStatus)}</div>
                        <div>
                          {p.isAvailable ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="p-4 text-xs font-medium text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.deliveryStatus === "pending" && (
                          <>
                            <button
                              disabled={actionLoading === p._id}
                              onClick={() => handleStatusChange(p._id, "approved")}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading === p._id}
                              onClick={() => handleStatusChange(p._id, "rejected")}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {p.deliveryStatus === "approved" && (
                          <>
                            <button
                              disabled={actionLoading === p._id}
                              onClick={() => handleStatusChange(p._id, "suspended")}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Suspend
                            </button>
                            <button
                              disabled={actionLoading === p._id}
                              onClick={() => handleStatusChange(p._id, "rejected")}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {p.deliveryStatus === "rejected" && (
                          <button
                            disabled={actionLoading === p._id}
                            onClick={() => handleStatusChange(p._id, "approved")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {p.deliveryStatus === "suspended" && (
                          <button
                            disabled={actionLoading === p._id}
                            onClick={() => handleStatusChange(p._id, "approved")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDeliveryPartners;
