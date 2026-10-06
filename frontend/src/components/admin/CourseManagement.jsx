import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const CourseManagement = () => {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    level: 'beginner',
    duration: '',
    tags: '',
    is_published: true
  });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const res = await axios.get(`${API_URL}/admin/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCourses(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/courses`, { ...formData, id: editingId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/courses`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      resetForm();
      fetchCourses();
    } catch (err) {
      console.error('Error saving course:', err);
    }
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      content: course.content || '',
      category: course.category,
      level: course.level,
      duration: course.duration,
      tags: course.tags || '',
      is_published: course.is_published
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این دوره اطمینان دارید؟')) {
      await axios.delete(`${API_URL}/admin/courses`, {
        data: { id },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      title: '', description: '', content: '', category: '',
      level: 'beginner', duration: '', tags: '', is_published: true
    });
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>مدیریت آموزش‌ها</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> افزودن دوره جدید
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
              <input
                placeholder="عنوان دوره"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <input
                placeholder="دسته‌بندی"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <select
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
              >
                <option value="beginner">مقدماتی</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">پیشرفته</option>
              </select>
              <input
                placeholder="مدت زمان (مثال: ۸ ساعت)"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              />
              <input
                placeholder="تگ‌ها (با کاما جدا کنید)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                />
                منتشر شده
              </label>
            </div>
            <textarea
              placeholder="توضیحات کوتاه"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
            />
            <textarea
              placeholder="محتوای دوره (HTML)"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={5}
            />
            <div className="form-actions">
              <button type="submit" className="btn-save">
                <Save size={18} /> ذخیره
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                <X size={18} /> انصراف
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>عنوان</th>
              <th>دسته‌بندی</th>
              <th>سطح</th>
              <th>وضعیت</th>
              <th>بازدید</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.category}</td>
                <td><span className={`badge badge-${course.level}`}>{course.level}</span></td>
                <td>
                  {course.is_published ?
                    <span className="badge badge-published"><Eye size={14} /> منتشر</span> :
                    <span className="badge badge-draft"><EyeOff size={14} /> پیش‌نویس</span>
                  }
                </td>
                <td>{course.view_count}</td>
                <td>
                  <button onClick={() => handleEdit(course)} className="btn-icon">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn-icon btn-delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManagement;
