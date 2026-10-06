import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, BookOpen, MessageSquare,
  FileText, MessageCircle, Target, BarChart3,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: <BarChart3 size={20} /> },
  { id: 'users', label: 'مدیریت کاربران', icon: <Users size={20} /> },
  { id: 'members', label: 'اعضای شرکت', icon: <UserPlus size={20} /> },
  { id: 'courses', label: 'آموزش‌ها', icon: <BookOpen size={20} /> },
  { id: 'comments', label: 'نظرات', icon: <MessageSquare size={20} /> },
  { id: 'suggestions', label: 'بازخوردها', icon: <FileText size={20} /> },
  { id: 'chats', label: 'تاریخچه چت', icon: <MessageCircle size={20} /> },
  { id: 'missions', label: 'ماموریت‌ها', icon: <Target size={20} /> },
];

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="admin-sidebar glass-card">
      <div className="admin-sidebar-header">
        <h3>پنل مدیریت</h3>
        <span className="admin-badge">ادمین</span>
      </div>
      <nav className="admin-nav">
        {menuItems.map((item, idx) => (
          <motion.button
            key={item.id}
            className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ x: -5 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {item.icon}
            <span>{item.label}</span>
            {activeTab === item.id && <ChevronRight size={16} />}
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;