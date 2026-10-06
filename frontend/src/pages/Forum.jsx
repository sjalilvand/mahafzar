import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  MessageSquare, TrendingUp, Clock, CheckCircle,
  Pin, Lock, Eye, Heart, MessageCircle,
  Plus, Search, Filter, Tag, User, ArrowUp,
  ArrowDown, ChevronRight, MessageSquarePlus
} from 'lucide-react';
import './Forum.css';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const Forum = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    category_id: '',
    tags: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [selectedCategory, sort, search, page]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/forum/categories`);
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const params = { page, sort };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search) params.search = search;

      const res = await axios.get(`${API_URL}/forum/topics`, { params });
      setTopics(res.data.topics);
      setTotalPages(res.data.total_pages);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API_URL}/forum/tags`);
      setTags(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/forum/topics`, {
        title: newTopic.title,
        content: newTopic.content,
        category_id: parseInt(newTopic.category_id),
        tags: JSON.stringify(newTopic.tags.split(',').map(t => t.trim()).filter(Boolean))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowNewTopic(false);
      setNewTopic({ title: '', content: '', category_id: '', tags: '' });
      navigate(`/forum/topic/${res.data.slug}`);
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در ایجاد تاپیک');
    }
  };

  const handleVote = async (topicId, type) => {
    if (!token) return navigate('/login');

    try {
      await axios.post(`${API_URL}/forum/topics/${topicId}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTopics();
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'همین الان';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه پیش`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعت پیش`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} روز پیش`;
    return new Date(date).toLocaleDateString('fa-IR');
  };

  const categoryIcons = {
    '💬': '💬', '🤖': '🤖', '💻': '💻', '💡': '💡', '🤝': '🤝'
  };

  return (
    <div className="forum-page">
      {/* Header */}
      <div className="forum-header">
        <div>
          <h1><MessageSquare size={30} /> انجمن گفتگو</h1>
          <p>سوال بپرسید، پاسخ دهید و با دیگران تعامل کنید</p>
        </div>
        <button className="btn-new-topic" onClick={() => setShowNewTopic(true)}>
          <Plus size={20} /> تاپیک جدید
        </button>
      </div>

      {/* New Topic Modal */}
      <AnimatePresence>
        {showNewTopic && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewTopic(false)}
          >
            <motion.form
              className="new-topic-form glass-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              onSubmit={handleCreateTopic}
            >
              <h2>ایجاد تاپیک جدید</h2>

              <select
                value={newTopic.category_id}
                onChange={e => setNewTopic({...newTopic, category_id: e.target.value})}
                required
              >
                <option value="">انتخاب دسته‌بندی...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="عنوان تاپیک"
                value={newTopic.title}
                onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                required
              />

              <textarea
                placeholder="متن تاپیک خود را بنویسید..."
                value={newTopic.content}
                onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                rows={8}
                required
              />

              <input
                type="text"
                placeholder="تگ‌ها (با کاما جدا کنید)"
                value={newTopic.tags}
                onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
              />

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <MessageSquarePlus size={18} /> ایجاد تاپیک
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowNewTopic(false)}>
                  انصراف
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="forum-categories">
        <button
          className={`cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          همه
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.slug)}
          >
            <span>{cat.icon}</span> {cat.name}
            <span className="cat-count">{cat.topics_count}</span>
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="forum-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="جستجو در تاپیک‌ها..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sort-buttons">
          <button
            className={sort === 'latest' ? 'active' : ''}
            onClick={() => setSort('latest')}
          >
            <Clock size={16} /> جدیدترین
          </button>
          <button
            className={sort === 'popular' ? 'active' : ''}
            onClick={() => setSort('popular')}
          >
            <TrendingUp size={16} /> محبوب‌ترین
          </button>
          <button
            className={sort === 'solved' ? 'active' : ''}
            onClick={() => setSort('solved')}
          >
            <CheckCircle size={16} /> حل شده
          </button>
        </div>
      </div>

      {/* Topics List */}
      <div className="topics-list">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : topics.length === 0 ? (
          <div className="empty-forum">
            <MessageSquare size={60} />
            <p>هنوز تاپیکی ایجاد نشده</p>
            <button onClick={() => setShowNewTopic(true)}>ایجاد اولین تاپیک</button>
          </div>
        ) : (
          topics.map((topic, idx) => (
            <motion.div
              key={topic.id}
              className={`topic-card glass-card ${topic.is_pinned ? 'pinned' : ''} ${topic.is_solved ? 'solved' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: -5 }}
            >
              {/* Vote Column */}
              <div className="topic-votes">
                <button
                  className="vote-btn up"
                  onClick={(e) => { e.preventDefault(); handleVote(topic.id, 'up'); }}
                >
                  <ArrowUp size={18} />
                </button>
                <span className="vote-count">{topic.score || 0}</span>
                <button
                  className="vote-btn down"
                  onClick={(e) => { e.preventDefault(); handleVote(topic.id, 'down'); }}
                >
                  <ArrowDown size={18} />
                </button>
              </div>

              {/* Topic Info */}
              <div className="topic-main">
                <div className="topic-title-row">
                  {topic.is_pinned && <Pin size={16} className="pin-icon" />}
                  {topic.is_locked && <Lock size={16} className="lock-icon" />}
                  {topic.is_solved && <CheckCircle size={16} className="solved-icon" />}

                  <Link to={`/forum/topic/${topic.slug}`} className="topic-title">
                    {topic.title}
                  </Link>
                </div>

                <div className="topic-meta">
                  <span className="topic-category" style={{ color: topic.category?.color || '#00f2ff' }}>
                    {topic.category?.name}
                  </span>
                  <span className="topic-author">
                    <User size={14} /> {topic.author?.name}
                  </span>
                  <span className="topic-time">{timeAgo(topic.created_at)}</span>
                </div>
              </div>

              {/* Stats Column */}
              <div className="topic-stats">
                <div className="stat-item">
                  <MessageCircle size={16} />
                  <span>{topic.posts_count || 0}</span>
                  <small>پاسخ</small>
                </div>
                <div className="stat-item">
                  <Eye size={16} />
                  <span>{topic.views || 0}</span>
                  <small>بازدید</small>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`page-btn ${page === i + 1 ? 'active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Popular Tags */}
      <div className="popular-tags glass-card">
        <h3><Tag size={18} /> تگ‌های محبوب</h3>
        <div className="tags-cloud">
          {tags.map(tag => (
            <Link
              key={tag.id}
              to={`/forum?tag=${tag.slug}`}
              className="tag-item"
              style={{ borderColor: tag.color || '#00f2ff' }}
            >
              {tag.name} <span>({tag.topics_count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Forum;
