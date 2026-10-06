import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chat/ChatWidget';
import BottomNav from './components/mobile/BottomNav';
import OfflineIndicator from './components/common/OfflineIndicator';
import NotificationSystem from './components/common/NotificationSystem';
import InstallPrompt from './components/common/InstallPrompt';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Members from './pages/Members';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import Gamification from './pages/Gamification';
import Forum from './pages/Forum';
import TopicDetail from './pages/TopicDetail';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import QuizPlayer from './components/quiz/QuizPlayer';
import Support from './pages/Support';
import Wallet from './pages/Wallet';
import './App.css';

function App() {
  const { loading } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className={`app-container theme-${settings.theme} density-${settings.density}`}
         style={{
           fontFamily: settings.font.family,
           fontSize: settings.font.size === 'small' ? '14px' : settings.font.size === 'medium' ? '16px' : settings.font.size === 'large' ? '18px' : '20px',
           lineHeight: settings.font.lineHeight,
           letterSpacing: `${settings.font.letterSpacing}px`,
           '--border-radius': `${settings.borderRadius}px`,
           '--glass-opacity': settings.glassEffect ? 1 : 0.5,
           '--animation-speed': settings.animations ? (settings.reducedMotion ? '0.1s' : '0.3s') : '0s'
         }}>
      <OfflineIndicator />
      <Navbar>
        <NotificationSystem />
      </Navbar>
      <main className="main-content">
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/members" element={<Members />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Dashboard & Admin */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Gamification */}
          <Route path="/gamification" element={<Gamification />} />

          {/* Forum */}
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/topic/:slug" element={<TopicDetail />} />

          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticsDashboard />} />

          {/* Quiz - standalone player (modal usage handled inside Courses) */}
          <Route path="/quiz/:quizId" element={<QuizPlayer />} />
                <Route path="/support" element={<Support />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
      </main>
      <Footer />
      <ChatWidget />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

export default App;
