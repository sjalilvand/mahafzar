import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Award, Star, Zap, TrendingUp, Trophy,
  Target, Clock, Lock, CheckCircle, Gift,
  Users, ArrowUp, Sparkles, Crown, Medal
} from 'lucide-react';
import './Gamification.css';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const Gamification = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [myStats, setMyStats] = useState(null);
  const [badges, setBadges] = useState({ earned: [], unearned: [], total: 0, earned_count: 0 });
  const [achievements, setAchievements] = useState({ achievements: [], total: 0, completed: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [levels, setLevels] = useState([]);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyResult, setDailyResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    checkDailyLogin();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [stats, badgesRes, achievementsRes, leaderboardRes, levelsRes] = await Promise.all([
        axios.get(`${API_URL}/gamification/my-stats`, { headers }),
        axios.get(`${API_URL}/gamification/my-badges`, { headers }),
        axios.get(`${API_URL}/gamification/my-achievements`, { headers }),
        axios.get(`${API_URL}/gamification/leaderboard`),
        axios.get(`${API_URL}/gamification/levels`)
      ]);

      setMyStats(stats.data);
      setBadges(badgesRes.data);
      setAchievements(achievementsRes.data);
      setLeaderboard(leaderboardRes.data);
      setLevels(levelsRes.data);
    } catch (err) {
      console.error('Error fetching gamification data:', err);
    }
    setLoading(false);
  };

  const checkDailyLogin = async () => {
    const lastClaim = localStorage.getItem('daily_claim_date');
    const today = new Date().toDateString();

    if (lastClaim !== today) {
      setShowDailyReward(true);
    }
  };

  const handleDailyClaim = async () => {
    try {
      const res = await axios.post(`${API_URL}/gamification/daily-login`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyResult(res.data);
      localStorage.setItem('daily_claim_date', new Date().toDateString());
      fetchAllData();
    } catch (err) {
      console.error('Error claiming daily reward:', err);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const rarityColors = {
    common: '#94a3b8',
    rare: '#4d4dff',
    epic: '#a855f7',
    legendary: '#f59e0b'
  };

  const rarityIcons = {
    common: '⭐',
    rare: '💫',
    epic: '👑',
    legendary: '🏆'
  };

  const tabs = [
    { id: 'overview', label: 'نمای کلی', icon: <Trophy size={20} /> },
    { id: 'badges', label: 'نشان‌ها', icon: <Award size={20} /> },
    { id: 'achievements', label: 'دستاوردها', icon: <Target size={20} /> },
    { id: 'leaderboard', label: 'جدول امتیازات', icon: <Crown size={20} /> }
  ];

  return (
    <div className="gamification-page">
      {/* Daily Reward Modal */}
      <AnimatePresence>
        {showDailyReward && !dailyResult && (
          <motion.div
            className="daily-reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="daily-reward-card glass-card"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Gift size={80} color="#ff0" />
              </motion.div>
              <h2>🎁 جایزه روزانه</h2>
              <p>ورود شما ثبت شد! جایزه امروز:</p>
              <div className="daily-rewards">
                <span className="reward-item">+{10} XP</span>
                <span className="reward-item">🔥 استریک فعال</span>
              </div>
              <motion.button
                className="btn-claim"
                onClick={handleDailyClaim}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles size={20} /> دریافت جایزه
              </motion.button>
              <button className="btn-skip" onClick={() => setShowDailyReward(false)}>
                بعداً
              </button>
            </motion.div>
          </motion.div>
        )}

        {dailyResult && (
          <motion.div
            className="daily-reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="daily-reward-card glass-card result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <CheckCircle size={60} color="#0f0" />
              <h2>✅ دریافت شد!</h2>
              <p>+{dailyResult.points_earned} XP</p>
              <p>استریک: {dailyResult.streak} روز 🔥</p>
              <button onClick={() => { setShowDailyReward(false); setDailyResult(null); }}>
                ادامه
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="gamification-header">
        <h1>🎮 مرکز بازی‌سازی</h1>
        <p>یادگیری رو با چالش‌ها و جوایز جذاب‌تر کن!</p>
      </div>

      {/* Level Card */}
      {myStats && (
        <motion.div
          className="level-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="level-display">
            <div className="level-badge">
              <span className="level-number">{myStats.level}</span>
              <span className="level-title">{myStats.level_title}</span>
            </div>
            <div className="level-progress-container">
              <div className="level-progress-bar">
                <motion.div
                  className="level-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${myStats.xp_progress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="level-xp-info">
                <span>{myStats.experience} XP</span>
                <span>{myStats.xp_to_next} XP تا سطح بعد</span>
              </div>
            </div>
            <div className="level-next">
              <ArrowUp size={16} />
              <span>{myStats.next_level_title}</span>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <Trophy size={20} color="#ff0" />
              <strong>{myStats.points?.toLocaleString('fa-IR')}</strong>
              <span>امتیاز</span>
            </div>
            <div className="stat-item">
              <Zap size={20} color="#ffa500" />
              <strong>{myStats.experience?.toLocaleString('fa-IR')}</strong>
              <span>XP</span>
            </div>
            <div className="stat-item">
              <Award size={20} color="#00f2ff" />
              <strong>{myStats.badges.earned}/{myStats.badges.total}</strong>
              <span>نشان</span>
            </div>
            <div className="stat-item">
              <Target size={20} color="#0f0" />
              <strong>{myStats.achievements.completed}/{myStats.achievements.total}</strong>
              <span>دستاورد</span>
            </div>
            <div className="stat-item">
              <Clock size={20} color="#ff4444" />
              <strong>{myStats.login_streak} روز</strong>
              <span>استریک</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="gamification-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`gam-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="gam-tab-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="badges-section">
              <div className="section-header">
                <h3>نشان‌های من ({badges.earned_count}/{badges.total})</h3>
                <div className="completion-bar">
                  <div className="completion-fill" style={{ width: `${badges.completion}%` }} />
                </div>
                <span className="completion-text">{badges.completion}%</span>
              </div>

              <h4 className="sub-section-title">✨ نشان‌های دریافتی</h4>
              <div className="badges-grid">
                {badges.earned.map(badge => (
                  <motion.div
                    key={badge.id}
                    className={`badge-card earned rarity-${badge.rarity}`}
                    whileHover={{ y: -5, scale: 1.05 }}
                  >
                    <div className="badge-icon">{badge.badge_icon}</div>
                    <div className="badge-info">
                      <h5>{badge.badge_name}</h5>
                      <p>{badge.badge_description}</p>
                    </div>
                    <span className="badge-rarity" style={{ color: rarityColors[badge.rarity] }}>
                      {rarityIcons[badge.rarity]} {badge.rarity}
                    </span>
                  </motion.div>
                ))}
              </div>

              <h4 className="sub-section-title">🔒 نشان‌های قفل شده</h4>
              <div className="badges-grid">
                {badges.unearned.map(badge => (
                  <div key={badge.id} className={`badge-card locked rarity-${badge.rarity}`}>
                    <div className="badge-icon locked-icon">
                      <Lock size={30} />
                    </div>
                    <div className="badge-info">
                      <h5>{badge.name}</h5>
                      <p>{badge.description}</p>
                    </div>
                    <span className="badge-rarity" style={{ color: rarityColors[badge.rarity] }}>
                      {rarityIcons[badge.rarity]} {badge.rarity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="achievements-section">
              <div className="section-header">
                <h3>دستاوردها ({achievements.completed}/{achievements.total})</h3>
                <span className="completion-text">{achievements.completion_rate}%</span>
              </div>

              <div className="achievements-list">
                {achievements.achievements.map(ach => (
                  <motion.div
                    key={ach.id}
                    className={`achievement-card glass-card ${ach.completed ? 'completed' : ''}`}
                    whileHover={!ach.is_hidden ? { x: -5 } : {}}
                  >
                    <div className="ach-icon">
                      {ach.completed ? (
                        <CheckCircle size={30} color="#0f0" />
                      ) : ach.is_hidden ? (
                        <Lock size={30} color="#666" />
                      ) : (
                        <span className="ach-emoji">{ach.icon}</span>
                      )}
                    </div>
                    <div className="ach-info">
                      <h4>{ach.is_hidden ? '??? (مخفی)' : ach.name}</h4>
                      <p>{ach.is_hidden ? 'این دستاورد مخفی است...' : ach.description}</p>
                      {!ach.completed && !ach.is_hidden && (
                        <div className="ach-progress">
                          <div className="ach-progress-bar">
                            <div className="ach-progress-fill" style={{ width: `${ach.progress}%` }} />
                          </div>
                          <span>{ach.progress}%</span>
                        </div>
                      )}
                    </div>
                    <div className="ach-xp">
                      <Zap size={16} color="#ffa500" />
                      <span>+{ach.xp_reward} XP</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-section">
              <h3>🏆 جدول امتیازات</h3>

              <div className="leaderboard-list">
                {leaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.user_id}
                    className={`leaderboard-entry glass-card ${idx < 3 ? 'top-3' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className={`rank rank-${idx + 1}`}>
                      {idx + 1 <= 3 ? (
                        ['🥇', '🥈', '🥉'][idx]
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>
                    <img loading="lazy" decoding="async"
                      src={entry.avatar || '/default-avatar.png'}
                      alt={entry.name}
                      className="leaderboard-avatar"
                    />
                    <div className="leaderboard-info">
                      <strong>{entry.name}</strong>
                      <span className="level-info">
                        سطح {entry.level} - {entry.title}
                      </span>
                    </div>
                    <div className="leaderboard-stats">
                      <span className="points-badge">
                        <Star size={14} /> {entry.points?.toLocaleString('fa-IR')}
                      </span>
                      <span className="badges-count">
                        <Award size={14} /> {entry.badges_count}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="overview-grid">
                {/* Quick Stats */}
                <div className="overview-card glass-card">
                  <h4>📊 خلاصه آمار</h4>
                  <div className="overview-stats">
                    <div className="overview-stat">
                      <Star size={24} color="#ff0" />
                      <strong>{myStats?.points?.toLocaleString('fa-IR')}</strong>
                      <span>امتیاز کل</span>
                    </div>
                    <div className="overview-stat">
                      <Award size={24} color="#00f2ff" />
                      <strong>{myStats?.badges.earned}</strong>
                      <span>نشان</span>
                    </div>
                    <div className="overview-stat">
                      <Target size={24} color="#0f0" />
                      <strong>{myStats?.achievements.completed}</strong>
                      <span>دستاورد</span>
                    </div>
                    <div className="overview-stat">
                      <TrendingUp size={24} color="#4d4dff" />
                      <strong>#{leaderboard.findIndex(l => l.user_id === parseInt(l.user_id)) + 1 || '-'}</strong>
                      <span>رتبه</span>
                    </div>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="overview-card glass-card">
                  <h4>📈 مسیر پیشرفت</h4>
                  <div className="level-path">
                    {levels.map((level, idx) => (
                      <div
                        key={level.level}
                        className={`level-node ${myStats?.level >= level.level ? 'achieved' : ''} ${myStats?.level === level.level ? 'current' : ''}`}
                      >
                        <div className="node-circle">
                          {myStats?.level > level.level ? (
                            <CheckCircle size={20} color="#0f0" />
                          ) : myStats?.level === level.level ? (
                            <span className="current-icon">{level.icon}</span>
                          ) : (
                            <Lock size={16} color="#666" />
                          )}
                        </div>
                        <div className="node-info">
                          <span className="node-level">سطح {level.level}</span>
                          <span className="node-title">{level.title}</span>
                          <span className="node-xp">{level.xp_required.toLocaleString('fa-IR')} XP</span>
                        </div>
                        {idx < levels.length - 1 && (
                          <div className={`node-line ${myStats?.level > level.level ? 'completed' : ''}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Gamification;


