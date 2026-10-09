import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from './DataTable';
import { Shield, User, ShieldOff } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await axios.put(`${API_URL}/admin/users`, {
      id: user.id,
      role: newRole
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      await axios.delete(`${API_URL}/admin/users`, {
        data: { id },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    }
  };

  const columns = [
    { key: 'username', label: 'نام کاربری' },
    { key: 'full_name', label: 'نام کامل' },
    { key: 'email', label: 'ایمیل' },
    {
      key: 'role',
      label: 'نقش',
      render: (item) => (
        <span className={`badge ${item.role === 'admin' ? 'badge-advanced' : 'badge-beginner'}`}>
          {item.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
          {item.role === 'admin' ? 'ادمین' : 'کاربر'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'تاریخ ثبت‌نام',
      render: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : '-'
    }
  ];

  const renderActions = (user) => (
    <>
      <button
        onClick={() => handleRoleToggle(user)}
        className="btn-icon"
        title={user.role === 'admin' ? 'تبدیل به کاربر' : 'تبدیل به ادمین'}
      >
        {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
      </button>
      {user.role !== 'admin' && (
        <button onClick={() => handleDelete(user.id)} className="btn-icon btn-delete">
          🗑️
        </button>
      )}
    </>
  );

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>مدیریت کاربران</h2>
        <span className="badge badge-published">{users.length} کاربر</span>
      </div>
      <DataTable
        columns={columns}
        data={users}
        renderActions={renderActions}
      />
    </div>
  );
};

export default UserManagement;

