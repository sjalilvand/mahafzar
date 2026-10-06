import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const ChatHistory = () => {
  const { token } = useAuth();
  const [chats, setChats] = useState([]);

  useEffect(() => { fetchChats(); }, []);

  const fetchChats = async () => {
    const res = await axios.get(`${API_URL}/admin/chats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setChats(res.data);
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>تاریخچه چت</h2>
      </div>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>کاربر</th>
              <th>پیام</th>
              <th>پاسخ</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {chats.map(chat => (
              <tr key={chat.id}>
                <td>{chat.username}</td>
                <td>{chat.message}</td>
                <td>{chat.response}</td>
                <td>{new Date(chat.created_at).toLocaleString('fa-IR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChatHistory;
