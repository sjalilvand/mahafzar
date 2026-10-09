import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Check, MessageCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const FeedbackManagement = () => {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [responding, setResponding] = useState(null);
  const [response, setResponse] = useState('');

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    const res = await axios.get(`${API_URL}/admin/suggestions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSuggestions(res.data);
  };

  const handleResponse = async (suggestion) => {
    await axios.put(`${API_URL}/admin/suggestions`, {
      id: suggestion.id,
      status: 'reviewed',
      admin_response: response
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setResponding(null);
    setResponse('');
    fetchSuggestions();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${API_URL}/admin/suggestions`, { id, status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchSuggestions();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>مدیریت بازخوردها و پیشنهادات</h2>
      </div>
      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <motion.div key={suggestion.id} className="suggestion-card glass-card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="suggestion-header">
              <h4>{suggestion.subject}</h4>
              <span className={`badge badge-${suggestion.status === 'pending' ? 'draft' : 'published'}`}>
                {suggestion.status}
              </span>
            </div>
            <p className="suggestion-content">{suggestion.content}</p>
            <div className="suggestion-meta">
              <span>از: {suggestion.author}</span>
              <span>دسته: {suggestion.category}</span>
              <span>{new Date(suggestion.created_at).toLocaleDateString('fa-IR')}</span>
            </div>

            {suggestion.admin_response && (
              <div className="admin-response">
                <strong>پاسخ ادمین:</strong>
                <p>{suggestion.admin_response}</p>
              </div>
            )}

            <div className="suggestion-actions">
              {responding === suggestion.id ? (
                <div className="response-form">
                  <textarea value={response} onChange={(e) => setResponse(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..." rows={3} />
                  <button onClick={() => handleResponse(suggestion)} className="btn-save">
                    <Check size={16} /> ارسال پاسخ
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setResponding(suggestion.id)} className="action-btn-small">
                    <MessageCircle size={16} /> پاسخ
                  </button>
                  <select value={suggestion.status}
                    onChange={(e) => updateStatus(suggestion.id, e.target.value)}>
                    <option value="pending">در انتظار</option>
                    <option value="reviewed">بررسی شده</option>
                    <option value="implemented">اجرا شده</option>
                  </select>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackManagement;

