import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
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
            const token = localStorage.getItem('token');
            await axios.put(`${API}/api/admin/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to update role", error);
            alert("Failed to update role");
        }
    };

    return (
        <div className="fade-in">
            <div className="table-header">
                <h3>Registered Users ({users.length})</h3>
            </div>

            <div className="data-table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Full Name</th>
                            <th>Email Address</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Join Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id}>
                                <td>#{u._id.substring(18, 24).toUpperCase()}</td>
                                <td className="u-name">{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone || 'N/A'}</td>
                                <td>
                                    <select 
                                        value={u.role || 'user'} 
                                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                        className={`status-badge role-${(u.role || 'user').toLowerCase()}`}
                                        style={{ border: "none", outline: "none", cursor: "pointer" }}
                                    >
                                        <option value="user">USER</option>
                                        <option value="vendor">VENDOR</option>
                                        <option value="admin">ADMIN</option>
                                    </select>
                                </td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;


