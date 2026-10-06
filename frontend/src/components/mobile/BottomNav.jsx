import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, MessageSquare,
  Gamepad2, User, Plus
} from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const navItems = [
    { path: '/', icon: <Home size={22} />, label: 'خانه' },
    { path: '/courses', icon: <BookOpen size={22} />, label: 'آموزش' },
    { path: null, icon: <Plus size={28} />, label: 'ایجاد', isCenter: true },
    { path: '/forum', icon: <MessageSquare size={22} />, label: 'انجمن' },
    { path: '/gamification', icon: <Gamepad2 size={22} />, label: 'بازی' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleCenterPress = () => {
    setShowCreate(!showCreate);
  };

  return (
    <>
      {/* Create Menu */}
      {showCreate && (
        <motion.div
          className="create-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            className="create-menu"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { navigate('/forum?new=true'); setShowCreate(false); }}>
              <MessageSquare size={20} /> تاپیک جدید
            </button>
            <button onClick={() => { navigate('/courses'); setShowCreate(false); }}>
              <BookOpen size={20} /> مشاهده دوره‌ها
            </button>
            <button onClick={() => { navigate('/contact'); setShowCreate(false); }}>
              <User size={20} /> تماس با ما
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item, idx) => (
          item.isCenter ? (
            <motion.button
              key={idx}
              className="nav-item center-btn"
              onClick={handleCenterPress}
              whileTap={{ scale: 0.9 }}
            >
              <div className="center-btn-circle">
                {item.icon}
              </div>
            </motion.button>
          ) : (
            <button
              key={idx}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className="nav-icon"
              >
                {item.icon}
              </motion.div>
              <span className="nav-label">{item.label}</span>
              {isActive(item.path) && (
                <motion.div
                  className="nav-indicator"
                  layoutId="navIndicator"
                />
              )}
            </button>
          )
        ))}
      </nav>
    </>
  );
};

export default BottomNav;