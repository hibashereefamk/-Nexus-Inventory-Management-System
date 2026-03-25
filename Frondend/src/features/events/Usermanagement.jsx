import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [formData, setFormData] = useState({
    username: "", email: "", role: "staff", phone: "", address: "", bio: "",
  });

  const token = localStorage.getItem("access_token");
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
 

  const fetchUsers = async () => {
    try {
        const res = await axios.get("http://127.0.0.1:8000/api/users/", config);
        setUsers(res.data);
        console.log(res.data);
    } catch (err) {
        console.error("Backend Error:", err.response.data); 
    }
};
useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/users/", formData, config);
      alert("User Created!");
      setShowModal(false); 
      fetchUsers();
    } catch (err) { alert("Error creating user."); }
  };

const handleToggleActive = async (user) => {
    const newStatus = !user.is_active;

    try {
        const response = await axios.patch(
            `http://127.0.0.1:8000/api/users/${user.id}/`, 
            { is_active: newStatus }, 
            config
        );
        alert(`User has been ${newStatus ? 'Activated' : 'Deactivated'}`);
        fetchUsers(); 
    } catch (err) {
        console.error("Update Error:", err.response?.data);
        alert("Failed to update user status.");
    }
};
 const handleDeleteUser = async (userId) => {
  if (window.confirm("Are you sure? This user will be marked as deleted.")) {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/users/${userId}/`, config);
      alert("User deleted successfully");
      fetchUsers(); 
    } catch (err) {
      alert("Error deleting user.");
    }
  }
};
  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage and monitor all staff accounts</p>
        </div>
        <button className="add-user-btn" onClick={() => setShowModal(true)}>
          + Create New User
        </button>
      </div>

      <div className="table-card">
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.username}</strong></td>
                <td>{user.email}</td>
                <td><span className={`role-tag ${user.role}`}>{user.role}</span></td>
                <td>{user.is_verified ? "✅" : "⏳"}</td>
                <td style={{ display: 'flex', gap: '10px'}}><button onClick={()=>handleToggleActive(user)} className={user.is_active?"text-delete":"text-active"}>
                  {user.is_active?"Deactivate" :"Activate"}</button>
                  <button 
        onClick={() => handleDeleteUser(user.id)}
        className="text-active"
      >
        Delete
      </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Member</h3>
              <button className="close-x" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-row">
                <input name="username" placeholder="Username" onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                <input name="email" type="email" placeholder="Email Address" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-row">
                <select name="role" onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="staff">Staff</option>
                  <option value="manager">Admin</option>
                  <option value="admin">Manager</option>
                </select>
                <input name="phone" placeholder="Phone Number" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <input name="address" placeholder="Residential Address" onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <textarea name="bio" placeholder="Bio/Notes" onChange={(e) => setFormData({...formData, bio: e.target.value})}></textarea>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;