import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Check, X, Trash2 } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const CommentManagement = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);

  useEffect(() => { fetchComments(); }, []);

  const fetchComments = async () => {
    const res = await axios.get(`${API_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(res.data);
  };

  const toggleApproval = async (comment) => {
    await axios.put(`${API_URL}/admin/comments`, {
      id: comment.id,
      is_approved: !comment.is_approved
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchComments();
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این نظر اطمینان دارید؟')) {
      await axios.delete(`${API_URL}/admin/comments`, {
        data: { id },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComments();
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>مدیریت نظرات</h2>
      </div>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>نویسنده</th>
              <th>متن نظر</th>
              <th>دوره</th>
              <th>وضعیت</th>
              <th>تاریخ</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(comment => (
              <tr key={comment.id}>
                <td>{comment.author}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {comment.content}
                </td>
                <td>{comment.course_title}</td>
                <td>
                  <span className={`badge ${comment.is_approved ? 'badge-published' : 'badge-draft'}`}>
                    {comment.is_approved ? 'تایید شده' : 'در انتظار'}
                  </span>
                </td>
                <td>{new Date(comment.created_at).toLocaleDateString('fa-IR')}</td>
                <td>
                  <button onClick={() => toggleApproval(comment)} className="btn-icon"
                    title={comment.is_approved ? 'رد' : 'تایید'}>
                    {comment.is_approved ? <X size={16} /> : <Check size={16} />}
                  </button>
                  <button onClick={() => handleDelete(comment.id)} className="btn-icon btn-delete">
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

export default CommentManagement;
