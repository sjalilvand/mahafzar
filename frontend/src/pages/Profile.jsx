import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Camera, MapPin, Globe, Github, Linkedin, Twitter,
  Phone, Mail, Calendar, Award, Star, TrendingUp,
  BookOpen, FileText, MessageSquare, Edit3, Save, X,
  Plus, Trash2, Upload, Image, CheckCircle
} from 'lucide-react';
import './Profile.css';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const Profile = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [skills, setSkills] = useState([]);
  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill_name: '', proficiency: 50, category: '' });
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    fetchEducation();
    fetchExperience();
    fetchActivities();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditForm(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    setLoading(false);
  };

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/skills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkills(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchEducation = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/education`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEducations(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchExperience = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/experience`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExperiences(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(res.data.activities);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put(`${API_URL}/profile/`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(editForm);
      setEditing(false);
    } catch (err) {
      alert('خطا در ذخیره تغییرات');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile({ ...profile, avatar_url: res.data.avatar_url });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در آپلود');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload/cover`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile({ ...profile, cover_url: res.data.cover_url });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در آپلود');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) return;

    try {
      await axios.post(`${API_URL}/profile/skills`, newSkill, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSkill({ skill_name: '', proficiency: 50, category: '' });
      setShowSkillForm(false);
      fetchSkills();
    } catch (err) {
      alert('خطا در افزودن مهارت');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await axios.delete(`${API_URL}/profile/skills`, {
        data: { id: skillId },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSkills();
    } catch (err) { alert('خطا در حذف'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!profile) return null;

  const tabs = [
    { id: 'about', label: 'درباره من', icon: <FileText size={18} /> },
    { id: 'skills', label: 'مهارت‌ها', icon: <Star size={18} /> },
    { id: 'education', label: 'تحصیلات', icon: <BookOpen size={18} /> },
    { id: 'experience', label: 'سوابق', icon: <TrendingUp size={18} /> },
    { id: 'activity', label: 'فعالیت‌ها', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="profile-page">
      {/* Cover Photo */}
      <div className="profile-cover" style={{
        backgroundImage: profile.cover_url ? `url(${profile.cover_url})` : 'linear-gradient(135deg, rgba(0,242,255,0.2), rgba(77,77,255,0.3))'
      }}>
        <button className="cover-upload-btn" onClick={() => coverInputRef.current?.click()}>
          <Camera size={20} /> تغییر کاور
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          hidden
        />
      </div>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img loading="lazy" decoding="async"
                src={profile.avatar_url || '/default-avatar.png'}
                alt={profile.full_name}
                className="profile-avatar"
              />
              <button
                className="avatar-upload-btn"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={18} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                hidden
              />
            </div>

            <div className="profile-info">
              <h1>{profile.full_name}</h1>
              {profile.title && <p className="profile-title">{profile.title}</p>}
              {profile.location && (
                <p className="profile-location">
                  <MapPin size={16} /> {profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <div className="profile-stats-mini">
              <div className="stat-mini">
                <Star size={16} color="#ff0" />
                <span>{stats?.points || 0} امتیاز</span>
              </div>
              <div className="stat-mini">
                <Award size={16} color="#00f2ff" />
                <span>سطح {stats?.level || 1}</span>
              </div>
            </div>

            <button
              className="btn-edit-profile"
              onClick={() => setEditing(!editing)}
            >
              <Edit3 size={18} /> ویرایش پروفایل
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
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
            className="tab-content glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="about-section">
                {editing ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>نام کامل</label>
                      <input
                        value={editForm.full_name || ''}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>عنوان شغلی</label>
                      <input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        placeholder="مثلاً: توسعه‌دهنده Full Stack"
                      />
                    </div>
                    <div className="form-group">
                      <label>بیوگرافی</label>
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={5}
                        placeholder="درباره خودتان بنویسید..."
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>موقعیت مکانی</label>
                        <input
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          placeholder="تهران، ایران"
                        />
                      </div>
                      <div className="form-group">
                        <label>وب‌سایت</label>
                        <input
                          value={editForm.website || ''}
                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="social-links-edit">
                      <div className="form-group">
                        <label><Github size={16} /> GitHub</label>
                        <input
                          value={editForm.github || ''}
                          onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label><Linkedin size={16} /> LinkedIn</label>
                        <input
                          value={editForm.linkedin || ''}
                          onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label><Twitter size={16} /> Twitter</label>
                        <input
                          value={editForm.twitter || ''}
                          onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button onClick={handleSaveProfile} className="btn-save">
                        <Save size={18} /> ذخیره
                      </button>
                      <button onClick={() => setEditing(false)} className="btn-cancel">
                        <X size={18} /> انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="about-display">
                    {profile.bio ? (
                      <p className="profile-bio">{profile.bio}</p>
                    ) : (
                      <p className="empty-text">هنوز بیوگرافی ننوشته‌اید...</p>
                    )}

                    <div className="profile-details">
                      {profile.location && (
                        <div className="detail-item">
                          <MapPin size={18} color="#00f2ff" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.website && (
                        <div className="detail-item">
                          <Globe size={18} color="#00f2ff" />
                          <a href={profile.website} target="_blank" rel="noopener noreferrer">
                            {profile.website}
                          </a>
                        </div>
                      )}
                      <div className="detail-item">
                        <Mail size={18} color="#00f2ff" />
                        <span>{profile.email}</span>
                      </div>
                      {profile.phone && (
                        <div className="detail-item">
                          <Phone size={18} color="#00f2ff" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <Calendar size={18} color="#00f2ff" />
                        <span>عضو از {new Date(profile.created_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>

                    <div className="social-links">
                      {profile.github && (
                        <a href={profile.github} target="_blank" className="social-link">
                          <Github size={24} />
                        </a>
                      )}
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" className="social-link">
                          <Linkedin size={24} />
                        </a>
                      )}
                      {profile.twitter && (
                        <a href={profile.twitter} target="_blank" className="social-link">
                          <Twitter size={24} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="skills-section">
                <div className="section-header">
                  <h3>مهارت‌ها</h3>
                  <button className="btn-add" onClick={() => setShowSkillForm(!showSkillForm)}>
                    <Plus size={18} /> افزودن مهارت
                  </button>
                </div>

                {showSkillForm && (
                  <div className="skill-form glass-card">
                    <input
                      placeholder="نام مهارت"
                      value={newSkill.skill_name}
                      onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newSkill.proficiency}
                      onChange={(e) => setNewSkill({...newSkill, proficiency: parseInt(e.target.value)})}
                    />
                    <span>{newSkill.proficiency}%</span>
                    <input
                      placeholder="دسته‌بندی (مثلاً: Frontend)"
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                    />
                    <button onClick={handleAddSkill} className="btn-save">
                      <Plus size={16} /> افزودن
                    </button>
                  </div>
                )}

                <div className="skills-grid">
                  {skills.map(skill => (
                    <motion.div
                      key={skill.id}
                      className="skill-card glass-card"
                      whileHover={{ y: -5 }}
                    >
                      <div className="skill-header">
                        <h4>{skill.skill_name}</h4>
                        <button onClick={() => handleDeleteSkill(skill.id)} className="btn-icon btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {skill.category && (
                        <span className="skill-category">{skill.category}</span>
                      )}
                      <div className="skill-progress">
                        <div className="progress-bar">
                          <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.proficiency}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                        <span className="progress-text">{skill.proficiency}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="education-section">
                <div className="section-header">
                  <h3>تحصیلات</h3>
                  <button className="btn-add">
                    <Plus size={18} /> افزودن
                  </button>
                </div>

                {educations.length === 0 ? (
                  <p className="empty-text">هنوز تحصیلاتی ثبت نشده</p>
                ) : (
                  <div className="timeline">
                    {educations.map(edu => (
                      <div key={edu.id} className="timeline-item">
                        <div className="timeline-marker">
                          <BookOpen size={18} />
                        </div>
                        <div className="timeline-content glass-card">
                          <h4>{edu.institution}</h4>
                          <p className="degree">{edu.degree} - {edu.field}</p>
                          <p className="years">
                            {edu.start_year} - {edu.is_current ? 'تاکنون' : edu.end_year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="experience-section">
                <div className="section-header">
                  <h3>سوابق کاری</h3>
                  <button className="btn-add">
                    <Plus size={18} /> افزودن
                  </button>
                </div>

                {experiences.length === 0 ? (
                  <p className="empty-text">هنوز سابقه کاری ثبت نشده</p>
                ) : (
                  <div className="timeline">
                    {experiences.map(exp => (
                      <div key={exp.id} className="timeline-item">
                        <div className="timeline-marker">
                          <TrendingUp size={18} />
                        </div>
                        <div className="timeline-content glass-card">
                          <h4>{exp.company}</h4>
                          <p className="position">{exp.position}</p>
                          <p className="description">{exp.description}</p>
                          <p className="dates">
                            {exp.start_date ? new Date(exp.start_date).toLocaleDateString('fa-IR') : ''} -
                            {exp.is_current ? ' تاکنون' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('fa-IR') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="activity-section">
                <h3>فعالیت‌های اخیر</h3>

                {activities.length === 0 ? (
                  <p className="empty-text">هنوز فعالیتی ثبت نشده</p>
                ) : (
                  <div className="activity-list">
                    {activities.map((activity, idx) => (
                      <motion.div
                        key={activity.id || idx}
                        className="activity-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="activity-icon">
                          <CheckCircle size={18} color="#0f0" />
                        </div>
                        <div className="activity-content">
                          <p>{activity.description}</p>
                          <small>{new Date(activity.created_at).toLocaleString('fa-IR')}</small>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;


