import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Bar, Line, Pie, Doughnut, Radar, Scatter, Bubble
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  TrendingUp, Users, BookOpen, MessageSquare,
  Star, Eye, Award, Clock, Activity,
  ChevronDown, Download, Calendar, RefreshCw
} from 'lucide-react';
import './Analytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94a3b8',
        font: { family: 'Vazir', size: 12 },
        padding: 20
      }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#94a3b8' }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#94a3b8' }
    }
  }
};

const AnalyticsDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  // States for data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [coursePopularity, setCoursePopularity] = useState(null);
  const [courseCategories, setCourseCategories] = useState(null);
  const [courseLevels, setCourseLevels] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [userEngagement, setUserEngagement] = useState(null);
  const [hourlyActivity, setHourlyActivity] = useState(null);
  const [myStats, setMyStats] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        dashboard, activity, popularity, categories,
        levels, growth, quiz, engagement, hourly, my
      ] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard`, { headers }),
        axios.get(`${API_URL}/analytics/user-activity?days=30`, { headers }),
        axios.get(`${API_URL}/analytics/courses-popularity`),
        axios.get(`${API_URL}/analytics/course-categories`),
        axios.get(`${API_URL}/analytics/course-levels`),
        axios.get(`${API_URL}/analytics/user-growth`, { headers }),
        axios.get(`${API_URL}/analytics/quiz-performance`, { headers }),
        axios.get(`${API_URL}/analytics/user-engagement`, { headers }),
        axios.get(`${API_URL}/analytics/hourly-activity`, { headers }),
        axios.get(`${API_URL}/analytics/my-stats`, { headers })
      ]);

      setDashboardStats(dashboard.data);
      setUserActivity(userActivity.data);
      setCoursePopularity(coursePopularity.data);
      setCourseCategories(courseCategories.data);
      setCourseLevels(courseLevels.data);
      setUserGrowth(userGrowth.data);
      setQuizPerformance(quizPerformance.data);
      setUserEngagement(userEngagement.data);
      setHourlyActivity(hourlyActivity.data);
      setMyStats(my.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  // Chart configurations
  const coursePopularityChart = {
    labels: coursePopularity?.labels || [],
    datasets: [
      {
        label: 'بازدید',
        data: coursePopularity?.views || [],
        backgroundColor: 'rgba(0, 242, 255, 0.3)',
        borderColor: '#00f2ff',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  const courseCategoriesChart = {
    labels: courseCategories?.labels || [],
    datasets: [{
      data: courseCategories?.data || [],
      backgroundColor: [
        'rgba(0, 242, 255, 0.7)',
        'rgba(77, 77, 255, 0.7)',
        'rgba(255, 0, 110, 0.7)',
        'rgba(0, 255, 0, 0.7)',
        'rgba(255, 165, 0, 0.7)',
        'rgba(255, 255, 0, 0.7)'
      ],
      borderWidth: 0
    }]
  };

  const userGrowthChart = {
    labels: userGrowth?.labels || [],
    datasets: [{
      label: 'کاربران',
      data: userGrowth?.data || [],
      fill: true,
      backgroundColor: 'rgba(0, 242, 255, 0.1)',
      borderColor: '#00f2ff',
      tension: 0.4,
      pointBackgroundColor: '#00f2ff',
      pointRadius: 4,
      pointHoverRadius: 8
    }]
  };

  const quizDistributionChart = {
    labels: quizPerformance?.distribution?.labels || [],
    datasets: [{
      label: 'تعداد',
      data: quizPerformance?.distribution?.data || [],
      backgroundColor: [
        'rgba(255, 0, 0, 0.5)',
        'rgba(255, 165, 0, 0.5)',
        'rgba(255, 255, 0, 0.5)',
        'rgba(0, 255, 0, 0.5)',
        'rgba(0, 242, 255, 0.5)'
      ],
      borderColor: '#fff',
      borderWidth: 1
    }]
  };

  const hourlyActivityChart = {
    labels: hourlyActivity?.labels || [],
    datasets: [{
      label: 'فعالیت',
      data: hourlyActivity?.data || [],
      backgroundColor: 'rgba(0, 242, 255, 0.2)',
      borderColor: '#00f2ff',
      borderWidth: 2,
      fill: true
    }]
  };

  const userActivityChart = userActivity ? {
    labels: userActivity.labels,
    datasets: userActivity.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ['rgba(0,242,255,0.3)', 'rgba(77,77,255,0.3)', 'rgba(0,255,0,0.3)', 'rgba(255,165,0,0.3)'][i % 4],
      borderColor: ['#00f2ff', '#4d4dff', '#0f0', '#ffa500'][i % 4],
      borderWidth: 2
    }))
  } : null;

  const statCards = [
    {
      icon: <Users size={30} />,
      label: 'کاربران',
      value: dashboardStats?.total_stats?.users?.toLocaleString('fa-IR') || 0,
      change: `+${dashboardStats?.new_users?.week || 0} این هفته`,
      color: '#00f2ff'
    },
    {
      icon: <BookOpen size={30} />,
      label: 'دوره‌ها',
      value: dashboardStats?.total_stats?.courses || 0,
      change: 'فعال',
      color: '#4d4dff'
    },
    {
      icon: <Eye size={30} />,
      label: 'بازدید کل',
      value: dashboardStats?.total_stats?.total_views?.toLocaleString('fa-IR') || 0,
      change: 'مجموع',
      color: '#0f0'
    },
    {
      icon: <Star size={30} />,
      label: 'میانگین امتیاز',
      value: dashboardStats?.total_stats?.avg_rating || 0,
      change: 'از ۵',
      color: '#ffa500'
    }
  ];

  const myStatCards = [
    { icon: <MessageSquare size={24} />, label: 'نظرات', value: myStats?.comments || 0, color: '#00f2ff' },
    { icon: <Award size={24} />, label: 'آزمون‌ها', value: myStats?.quizzes_taken || 0, color: '#4d4dff' },
    { icon: <Activity size={24} />, label: 'فعالیت‌ها', value: myStats?.activities || 0, color: '#0f0' },
    { icon: <Star size={24} />, label: 'میانگین نمره', value: `${myStats?.avg_score || 0}%`, color: '#ffa500' }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div>
          <h1>داشبورد تحلیلی</h1>
          <p>آمار و گزارش‌های جامع پرتال</p>
        </div>
        <div className="header-actions">
          <div className="time-filter">
            <button className={timeRange === 'week' ? 'active' : ''} onClick={() => setTimeRange('week')}>
              هفته
            </button>
            <button className={timeRange === 'month' ? 'active' : ''} onClick={() => setTimeRange('month')}>
              ماه
            </button>
            <button className={timeRange === 'year' ? 'active' : ''} onClick={() => setTimeRange('year')}>
              سال
            </button>
          </div>
          <button className="btn-refresh" onClick={fetchAllData}>
            <RefreshCw size={18} /> بروزرسانی
          </button>
          <button className="btn-export">
            <Download size={18} /> خروجی
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-cards-grid">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            className="stat-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="stat-card-header">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <span className="stat-change">{stat.change}</span>
            </div>
            <div className="stat-card-body">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Stats */}
      <div className="my-stats-row">
        <h3>آمار من</h3>
        <div className="my-stats-grid">
          {myStatCards.map((stat, idx) => (
            <motion.div
              key={idx}
              className="my-stat-card glass-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="my-stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* User Growth */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="chart-header">
            <h3><TrendingUp size={20} /> رشد کاربران</h3>
            <Calendar size={16} />
          </div>
          <div className="chart-body">
            <Line data={userGrowthChart} options={chartOptions} />
          </div>
        </motion.div>

        {/* Course Categories */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="chart-header">
            <h3>دسته‌بندی دوره‌ها</h3>
          </div>
          <div className="chart-body">
            <Doughnut
              data={courseCategoriesChart}
              options={{
                ...chartOptions,
                cutout: '60%',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { ...chartOptions.plugins.legend, position: 'bottom' }
                }
              }}
            />
          </div>
        </motion.div>

        {/* Course Popularity */}
        <motion.div
          className="chart-card glass-card full-width"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="chart-header">
            <h3><BookOpen size={20} /> محبوب‌ترین دوره‌ها</h3>
          </div>
          <div className="chart-body">
            <Bar data={coursePopularityChart} options={{
              ...chartOptions,
              indexAxis: 'y'
            }} />
          </div>
        </motion.div>

        {/* Quiz Performance */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="chart-header">
            <h3><Award size={20} /> توزیع نمرات آزمون</h3>
            <span className="pass-rate">
              نرخ قبولی: {quizPerformance?.pass_rate || 0}%
            </span>
          </div>
          <div className="chart-body">
            <Bar data={quizDistributionChart} options={chartOptions} />
          </div>
        </motion.div>

        {/* Hourly Activity */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="chart-header">
            <h3><Clock size={20} /> فعالیت ساعتی</h3>
          </div>
          <div className="chart-body">
            <Line data={hourlyActivityChart} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: { display: false }
              }
            }} />
          </div>
        </motion.div>

        {/* User Activity */}
        {userActivityChart && (
          <motion.div
            className="chart-card glass-card full-width"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3><Activity size={20} /> فعالیت کاربران (۳۰ روز)</h3>
            </div>
            <div className="chart-body">
              <Line data={userActivityChart} options={chartOptions} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Top Users */}
      {userEngagement?.top_users && (
        <motion.div
          className="top-users-section glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>کاربران فعال</h3>
          <div className="top-users-list">
            {userEngagement.top_users.map((user, idx) => (
              <div key={idx} className="top-user-item">
                <span className="rank">#{idx + 1}</span>
                <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                <div className="user-detail">
                  <strong>{user.name}</strong>
                  <span>{user.activities} فعالیت</span>
                </div>
                <div className="user-progress">
                  <div className="mini-progress" style={{ width: `${Math.min(user.activities * 2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
