import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserManagement from '../../components/admin/UserManagement';
import MemberManagement from '../../components/admin/MemberManagement';
import CourseManagement from '../../components/admin/CourseManagement';
import CommentManagement from '../../components/admin/CommentManagement';
import FeedbackManagement from '../../components/admin/FeedbackManagement';
import ChatHistory from '../../components/admin/ChatHistory';
import MissionManagement from '../../components/admin/MissionManagement';
import {
  Users, UserPlus, BookOpen, MessageSquare,
  FileText, MessageCircle, Eye, ArrowUp,
  TrendingUp, Activity
} from 'lucide-react';
import './AdminDashboard.css';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const statCards = [
    { label: 'کاربران', value: stats?.total_users || 0, icon: <Users size={30} />, color: '#00f2ff' },
    { label: 'اعضا', value: stats?.total_members || 0, icon: <UserPlus size={30} />, color: '#4d4dff' },
    { label: 'آموزش‌ها', value: stats?.total_courses || 0, icon: <BookOpen size={30} />, color: '#0f0' },
    { label: 'نظرات', value: stats?.total_comments || 0, icon: <MessageSquare size={30} />, color: '#ffa500' },
    { label: 'بازخوردها', value: stats?.total_suggestions || 0, icon: <FileText size={30} />, color: '#ff006e' },
    { label: 'بازدیدها', value: stats?.total_views || 0, icon: <Eye size={30} />, color: '#ff0' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>داشبورد مدیریت</h2>
            <div className="stats-grid">
              {statCards.map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="stat-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="stat-card-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-card-info">
                    <span className="stat-card-value">{stat.value.toLocaleString('fa-IR')}</span>
                    <span className="stat-card-label">{stat.label}</span>
                  </div>
                  <div className="stat-card-trend">
                    <TrendingUp size={16} />
                    <span>+{Math.floor(Math.random() * 20)}%</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="quick-actions">
              <h3>دسترسی سریع</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('courses')} className="action-btn">
                  <BookOpen size={20} /> افزودن آموزش جدید
                </button>
                <button onClick={() => setActiveTab('members')} className="action-btn">
                  <UserPlus size={20} /> افزودن عضو جدید
                </button>
                <button onClick={() => setActiveTab('missions')} className="action-btn">
                  <Activity size={20} /> ویرایش ماموریت‌ها
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'users': return <UserManagement />;
      case 'members': return <MemberManagement />;
      case 'courses': return <CourseManagement />;
      case 'comments': return <CommentManagement />;
      case 'suggestions': return <FeedbackManagement />;
      case 'chats': return <ChatHistory />;
      case 'missions': return <MissionManagement />;
      default: return null;
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

