import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const NotificationSystem = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (err) {
      console.error('Notification permission:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const showBrowserNotification = (notif) => {
    if (permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notif.id?.toString(),
        data: { url: notif.link }
      });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="#0f0" />;
      case 'warning': return <AlertTriangle size={18} color="#ffa500" />;
      case 'error': return <XCircle size={18} color="#ff4444" />;
      default: return <Info size={18} color="#00f2ff" />;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Notification Bell */}
      <button
        className="notification-bell"
        onClick={() => setShowPanel(!showPanel)}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <motion.span
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="notification-panel glass-card"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <div className="notification-header">
              <h3>اعلان‌ها</h3>
              <div className="notification-actions">
                <button onClick={markAllAsRead}>خواندن همه</button>
                <button onClick={() => setShowPanel(false)}><X size={18} /></button>
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <Bell size={40} />
                  <p>اعلانی وجود ندارد</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <motion.div
                    key={notif.id}
                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                    whileHover={{ x: -5 }}
                  >
                    <div className="notif-icon">
                      {getIcon(notif.type)}
                    </div>
                    <div className="notif-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                      <small>{new Date(notif.created_at).toLocaleString('fa-IR')}</small>
                    </div>
                    {!notif.read && <span className="unread-dot" />}
                  </motion.div>
                ))
              )}
            </div>

            {permission === 'default' && (
              <div className="notification-permission">
                <button onClick={requestPermission}>
                  <Bell size={16} /> فعال‌سازی اعلان‌ها
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationSystem;

