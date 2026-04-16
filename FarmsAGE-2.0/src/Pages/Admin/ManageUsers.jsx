import React, { useState, useEffect } from "react";
import axios from "axios";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Registered Users ({users.length})
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="min-w-[700px] w-full text-sm">
          {/* Head */}
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3 text-left">User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Join Date</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3 font-medium">
                  #{u._id.substring(18, 24).toUpperCase()}
                </td>

                <td className="font-semibold">{u.name}</td>

                <td className="text-gray-600">{u.email}</td>

                <td>{u.phone || "N/A"}</td>

                <td>
                  <select
                    value={u.role || "user"}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 outline-none cursor-pointer"
                  >
                    <option value="user">USER</option>
                    <option value="vendor">VENDOR</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </td>

                <td className="text-gray-500 text-xs sm:text-sm">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
