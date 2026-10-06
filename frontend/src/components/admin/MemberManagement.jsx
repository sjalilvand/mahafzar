import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from './DataTable';
import { Plus, Save, X, Star } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const MemberManagement = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', position: '', department: '', bio: '',
    skills: '', linkedin_url: '', github_url: '', is_featured: false
  });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const res = await axios.get(`${API_URL}/admin/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMembers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/members`, { ...formData, id: editingId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/members`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      resetForm();
      fetchMembers();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      position: member.position || '',
      department: member.department || '',
      bio: member.bio || '',
      skills: Array.isArray(member.skills) ? member.skills.join(',') : member.skills || '',
      linkedin_url: member.linkedin_url || '',
      github_url: member.github_url || '',
      is_featured: member.is_featured
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این عضو اطمینان دارید؟')) {
      await axios.delete(`${API_URL}/admin/members`, {
        data: { id },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMembers();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '', position: '', department: '', bio: '',
      skills: '', linkedin_url: '', github_url: '', is_featured: false
    });
  };

  const columns = [
    { key: 'name', label: 'نام' },
    { key: 'position', label: 'سمت' },
    { key: 'department', label: 'دپارتمان' },
    {
      key: 'is_featured',
      label: 'ویژه',
      render: (item) => item.is_featured ? <Star size={16} color="#ff0" /> : '-'
    }
  ];

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>مدیریت اعضای شرکت</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> افزودن عضو
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            className="admin-form glass-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="form-grid">
              <input placeholder="نام کامل" value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <input placeholder="سمت" value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})} />
              <input placeholder="دپارتمان" value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})} />
              <input placeholder="مهارت‌ها (با کاما جدا کنید)" value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})} />
              <input placeholder="لینک LinkedIn" value={formData.linkedin_url}
                onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})} />
              <input placeholder="لینک GitHub" value={formData.github_url}
                onChange={(e) => setFormData({...formData, github_url: e.target.value})} />
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} />
                عضو ویژه
              </label>
            </div>
            <textarea placeholder="بیوگرافی" value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} />
            <div className="form-actions">
              <button type="submit" className="btn-save"><Save size={18} /> ذخیره</button>
              <button type="button" onClick={resetForm} className="btn-cancel"><X size={18} /> انصراف</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={members}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default MemberManagement;
