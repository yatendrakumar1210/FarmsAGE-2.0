import React, { useState, useEffect } from "react";
import axios from "axios";
import { Store } from "lucide-react";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role", error);
      alert("Failed to update role");
    }
  };

  const handleShopStatusChange = async (userId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/admin/users/${userId}/shop-status`,
        { shopStatus: status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchUsers();
    } catch (error) {
      console.error("Failed to update shop status", error);
      alert("Failed to update shop status");
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return u.shopStatus === "pending";
    if (filterStatus === "vendors") return u.role === "vendor";
    return true;
  });

  const pendingCount = users.filter(u => u.shopStatus === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800">User Management</h3>
          <p className="text-sm text-slate-500 font-medium">Manage user roles and vendor shop approvals</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Users
          </button>
          <button 
            onClick={() => setFilterStatus("vendors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'vendors' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Vendors
          </button>
          <button 
            onClick={() => setFilterStatus("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}
          >
            Pending Requests
            {pendingCount > 0 && <span className="bg-white text-amber-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{pendingCount}</span>}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50/50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Store</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Status</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Info</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-b border-gray-50/50 hover:bg-slate-50/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.storeImage || u.profileImage ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-slate-50 shrink-0">
                          <img src={u.storeImage || u.profileImage} className="w-full h-full object-cover" alt="" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0">
                          {u.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{u.name}</p>
                        {u.role === 'vendor' && (
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight truncate">
                            {u.storeName || "Unnamed Shop"}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium">#{u._id.substring(18, 24).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-1">
                      <p className="text-slate-600 font-medium text-xs">{u.email}</p>
                      <p className="text-slate-400 text-[10px] font-bold">{u.phone || "No Phone"}</p>
                    </div>
                  </td>

                  <td className="p-4">
                    <select
                      value={u.role || "user"}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-100 border-none outline-none cursor-pointer uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <option value="user">USER</option>
                      <option value="vendor">VENDOR</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </td>

                  <td className="p-4">
                    {u.role === "vendor" ? (
                      <select
                        value={u.shopStatus || "none"}
                        onChange={(e) => handleShopStatusChange(u._id, e.target.value)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg outline-none cursor-pointer uppercase tracking-widest border-2 transition-all
                          ${u.shopStatus === "approved" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : 
                            u.shopStatus === "pending" ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" : 
                            u.shopStatus === "rejected" ? "bg-rose-50 border-rose-100 text-rose-700" : 
                            "bg-slate-50 border-slate-100 text-slate-500"}`}
                      >
                        <option value="none">NONE</option>
                        <option value="pending">PENDING</option>
                        <option value="approved">APPROVED</option>
                        <option value="rejected">REJECTED</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">—</span>
                    )}
                  </td>

                  <td className="p-4">
                    {u.role === "vendor" && u.storeAddress ? (
                      <div className="max-w-[200px]">
                        <p className="text-[10px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {u.storeAddress}
                        </p>
                        {u.coordinates?.lat && (
                          <p className="text-[9px] text-emerald-500 font-bold mt-1">
                            📍 {u.coordinates.lat?.toFixed(4)}, {u.coordinates.lng?.toFixed(4)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">—</span>
                    )}
                  </td>

                  <td className="p-4 text-slate-400 text-xs font-bold whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                <Store size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No users found for this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
