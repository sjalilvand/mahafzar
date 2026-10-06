import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User, BookOpen, MessageSquare, Settings, LogOut,
  Star, Award, TrendingUp, Zap, Crown,
  Gift, Clock, Activity, CreditCard, Shield,
  LayoutDashboard, ChevronRight
} from 'lucide-react';
import './Dashboard.css'; // استایل‌های جدید در صورت نیاز

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [suggestions, setSuggestions] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [mySub, setMySub] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, subRes, actRes, suggRes] = await Promise.all([
        axios.get(`${API_URL}/gamification/my-stats`, { headers }),
        axios.get(`${API_URL}/payments/my-subscription`, { headers }),
        axios.get(`${API_URL}/profile/activities?per_page=10`, { headers }),
        axios.get(`${API_URL}/suggestions/`, { headers })
      ]);
      setMyStats(statsRes.data);
      setMySub(subRes.data);
      setRecentActivities(actRes.data.activities || []);
      setSuggestions(suggRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!user) return null;

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>👋 {t('سلام')}، {user.full_name}</h1>
          <p>{t('به داشبورد خود خوش آمدید')}</p>
        </div>

        <div className="dashboard-layout">
          {/* Sidebar */}
          <div className="dashboard-sidebar glass-card">
            <div className="user-info">
              <img src={user.avatar_url || '/default-avatar.png'} className="user-avatar" alt="" />
              <h3>{user.full_name}</h3>
              <span className="user-role">{user.role === 'admin' ? 'مدیر' : 'کاربر'}</span>
              {myStats && (
                <div className="mini-level">
                  <span>سطح {myStats.level} - {myStats.level_title}</span>
                  <div className="xp-bar-mini">
                    <div className="xp-fill" style={{width:`${myStats.xp_progress}%`}}/>
                  </div>
                </div>
              )}
            </div>

            <nav className="dashboard-nav">
              <button className={`nav-item ${activeTab==='overview'?'active':''}`}
                      onClick={()=>setActiveTab('overview')}>
                <LayoutDashboard size={20} /> نمای کلی
              </button>
              <button className={`nav-item ${activeTab==='profile'?'active':''}`}
                      onClick={()=>setActiveTab('profile')}>
                <User size={20} /> پروفایل
              </button>
              <button className={`nav-item ${activeTab==='suggestions'?'active':''}`}
                      onClick={()=>setActiveTab('suggestions')}>
                <MessageSquare size={20} /> بازخوردها
              </button>
              <button className={`nav-item ${activeTab==='subscription'?'active':''}`}
                      onClick={()=>setActiveTab('subscription')}>
                <CreditCard size={20} /> اشتراک
              </button>
              <button className={`nav-item ${activeTab==='settings'?'active':''}`}
                      onClick={()=>setActiveTab('settings')}>
                <Settings size={20} /> تنظیمات
              </button>
              <button className="nav-item logout-btn" onClick={handleLogout}>
                <LogOut size={20} /> خروج
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="dashboard-content">
            {activeTab === 'overview' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                {/* Quick Stats Cards */}
                <div className="quick-stats">
                  <div className="stat-card glass-card">
                    <Star size={30} color="#ff0" />
                    <div>
                      <strong>{myStats?.points?.toLocaleString('fa-IR') || 0}</strong>
                      <span>امتیاز</span>
                    </div>
                  </div>
                  <div className="stat-card glass-card">
                    <Award size={30} color="#00f2ff" />
                    <div>
                      <strong>{myStats?.badges?.earned || 0}</strong>
                      <span>نشان</span>
                    </div>
                  </div>
                  <div className="stat-card glass-card">
                    <Zap size={30} color="#ffa500" />
                    <div>
                      <strong>{myStats?.login_streak || 0} روز</strong>
                      <span>استریک</span>
                    </div>
                  </div>
                  <div className="stat-card glass-card">
                    <TrendingUp size={30} color="#0f0" />
                    <div>
                      <strong>سطح {myStats?.level || 1}</strong>
                      <span>{myStats?.level_title}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Status */}
                {mySub && (
                  <div className="sub-card glass-card">
                    <Crown size={24} color="#ffd700" />
                    <div>
                      <h3>{mySub.has_subscription ? mySub.plan?.name : 'بدون اشتراک'}</h3>
                      {mySub.has_subscription && mySub.is_active ? (
                        <p>{mySub.days_left} روز باقی‌مانده</p>
                      ) : (
                        <Link to="/pricing" className="upgrade-link">ارتقاء اشتراک</Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Activities */}
                <div className="activity-feed glass-card">
                  <h3><Activity size={20} /> فعالیت‌های اخیر</h3>
                  {recentActivities.length === 0 ? (
                    <p className="empty">هنوز فعالیتی ندارید</p>
                  ) : (
                    recentActivities.map((act,idx)=>(
                      <div key={idx} className="activity-item">
                        <p>{act.description}</p>
                        <small>{new Date(act.created_at).toLocaleString('fa-IR')}</small>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Links */}
                <div className="quick-links glass-card">
                  <h3>دسترسی سریع</h3>
                  <div className="links-grid">
                    <Link to="/courses" className="link-btn"><BookOpen size={18}/> دوره‌ها</Link>
                    <Link to="/gamification" className="link-btn"><Gift size={18}/> بازی‌سازی</Link>
                    <Link to="/forum" className="link-btn"><MessageSquare size={18}/> انجمن</Link>
                    <Link to="/analytics" className="link-btn"><TrendingUp size={18}/> آمار</Link>
                    <Link to="/settings" className="link-btn"><Settings size={18}/> تنظیمات</Link>
                    <Link to="/profile" className="link-btn"><User size={18}/> پروفایل</Link>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div className="glass-card" initial={{opacity:0}} animate={{opacity:1}}>
                <h2>اطلاعات کاربری</h2>
                <div className="profile-details">
                  <div className="info-row"><label>نام کاربری:</label><span>{user.username}</span></div>
                  <div className="info-row"><label>نام کامل:</label><span>{user.full_name}</span></div>
                  <div className="info-row"><label>ایمیل:</label><span>{user.email}</span></div>
                  <div className="info-row"><label>نقش:</label><span>{user.role==='admin'?'مدیر':'کاربر'}</span></div>
                </div>
                <Link to="/profile" className="btn-link">ویرایش پروفایل کامل</Link>
              </motion.div>
            )}

            {activeTab === 'suggestions' && (
              <motion.div className="glass-card" initial={{opacity:0}} animate={{opacity:1}}>
                <h2>بازخوردهای من</h2>
                {suggestions.length===0 ? <p>هنوز بازخوردی ثبت نشده</p> :
                  suggestions.map(s=>(
                    <div key={s.id} className="suggestion-item">
                      <h4>{s.subject}</h4>
                      <p>{s.content}</p>
                      <span className={`status-badge ${s.status}`}>
                        {s.status==='pending'?'در انتظار':s.status==='reviewed'?'بررسی شده':'اجرا شده'}
                      </span>
                    </div>
                  ))
                }
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div className="glass-card" initial={{opacity:0}} animate={{opacity:1}}>
                <h2>وضعیت اشتراک</h2>
                {mySub ? (
                  <div>
                    <p>پلن: {mySub.has_subscription ? mySub.plan?.name : 'رایگان'}</p>
                    {mySub.has_subscription && <p>تاریخ انقضا: {new Date(mySub.expires_at).toLocaleDateString('fa-IR')}</p>}
                    <Link to="/pricing" className="btn-primary">مدیریت اشتراک</Link>
                  </div>
                ) : <p>در حال بارگذاری...</p>}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div className="glass-card" initial={{opacity:0}} animate={{opacity:1}}>
                <h2>تنظیمات حساب</h2>
                <p>برای تغییر ظاهر و زبان به صفحه تنظیمات بروید.</p>
                <Link to="/settings" className="btn-primary">تنظیمات پیشرفته</Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
