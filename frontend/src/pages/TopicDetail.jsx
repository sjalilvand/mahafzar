import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ArrowUp, ArrowDown, MessageCircle, CheckCircle,
  Clock, User, Pin, Lock, Edit3, Trash2, Flag,
  MessageSquarePlus, Share2, BookmarkPlus, Eye
} from 'lucide-react';
import './Forum.css';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const TopicDetail = () => {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchTopic();
  }, [slug]);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/forum/topics/${slug}`, { headers });
      setTopic(res.data.topic);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Error:', err);
      navigate('/forum');
    }
    setLoading(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login');
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/forum/topics/${topic.id}/posts`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyContent('');
      fetchTopic();
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در ارسال پاسخ');
    }
    setSubmitting(false);
  };

  const handleVotePost = async (postId, type) => {
    if (!token) return navigate('/login');
    try {
      await axios.post(`${API_URL}/forum/posts/${postId}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTopic();
    } catch (err) { console.error(err); }
  };

  const handleMarkAsAnswer = async (postId) => {
    if (!token) return;
    try {
      await axios.post(`${API_URL}/forum/posts/${postId}/answer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTopic();
    } catch (err) { alert('خطا'); }
  };

  const handleEditPost = async (postId) => {
    try {
      await axios.put(`${API_URL}/forum/posts/${postId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingPost(null);
      fetchTopic();
    } catch (err) { alert('خطا در ویرایش'); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('آیا از حذف این پست اطمینان دارید؟')) return;
    try {
      await axios.delete(`${API_URL}/forum/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTopic();
    } catch (err) { alert('خطا در حذف'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!topic) return null;

  return (
    <div className="topic-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/forum">انجمن</Link>
        <span> / </span>
        <Link to={`/forum?category=${topic.category?.slug}`}>{topic.category?.name}</Link>
        <span> / </span>
        <span>{topic.title}</span>
      </div>

      {/* Topic Header */}
      <motion.div
        className="topic-detail-header glass-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="topic-title-section">
          <div className="topic-badges">
            {topic.is_pinned && <span className="badge badge-pinned"><Pin size={14} /> پین شده</span>}
            {topic.is_locked && <span className="badge badge-locked"><Lock size={14} /> قفل شده</span>}
            {topic.is_solved && <span className="badge badge-solved"><CheckCircle size={14} /> حل شده</span>}
          </div>
          <h1>{topic.title}</h1>
        </div>

        <div className="topic-header-meta">
          <div className="author-info">
            <img src={topic.author?.avatar || '/default-avatar.png'} alt="" />
            <div>
              <strong>{topic.author?.name}</strong>
              <span>{new Date(topic.created_at).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>

          <div className="topic-header-stats">
            <span><Eye size={16} /> {topic.views} بازدید</span>
            <span><MessageCircle size={16} /> {topic.posts_count} پاسخ</span>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <div className="posts-section">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            className={`post-card glass-card ${post.is_answer ? 'answer' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            {/* Post Sidebar */}
            <div className="post-sidebar">
              <div className="post-author-avatar">
                <img src={post.author?.avatar || '/default-avatar.png'} alt="" />
              </div>
              <div className="post-author-info">
                <strong>{post.author?.name}</strong>
                <span className="author-level">سطح {post.author?.level || 1}</span>
              </div>
              <div className="post-votes">
                <button onClick={() => handleVotePost(post.id, 'up')}>
                  <ArrowUp size={18} />
                </button>
                <span>{(post.upvotes || 0) - (post.downvotes || 0)}</span>
                <button onClick={() => handleVotePost(post.id, 'down')}>
                  <ArrowDown size={18} />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="post-main">
              {editingPost === post.id ? (
                <div className="edit-post-form">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={5}
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleEditPost(post.id)} className="btn-save">ذخیره</button>
                    <button onClick={() => setEditingPost(null)} className="btn-cancel">انصراف</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />

                  {post.is_edited && (
                    <span className="edited-badge">(ویرایش شده)</span>
                  )}

                  <div className="post-footer">
                    <span className="post-time">
                      <Clock size={14} /> {new Date(post.created_at).toLocaleString('fa-IR')}
                    </span>

                    <div className="post-actions">
                      {topic.author?.id === user?.id && !topic.is_solved && post.author?.id !== user?.id && (
                        <button onClick={() => handleMarkAsAnswer(post.id)} className="btn-answer">
                          <CheckCircle size={16} /> علامت به عنوان پاسخ
                        </button>
                      )}

                      {post.author?.id === user?.id && (
                        <>
                          <button onClick={() => { setEditingPost(post.id); setEditContent(post.content); }} className="btn-icon">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeletePost(post.id)} className="btn-icon btn-delete">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {post.is_answer && (
                <div className="answer-badge">
                  <CheckCircle size={20} /> پاسخ انتخاب شده
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reply Form */}
      {!topic.is_locked && (
        <motion.form
          className="reply-form glass-card"
          onSubmit={handleReply}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>ارسال پاسخ</h3>
          {token ? (
            <>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={5}
                required
              />
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? <span className="spinner"></span> : (
                  <><MessageSquarePlus size={18} /> ارسال پاسخ</>
                )}
              </button>
            </>
          ) : (
            <div className="login-prompt">
              <p>برای ارسال پاسخ باید وارد شوید</p>
              <Link to="/login" className="btn-primary">ورود</Link>
            </div>
          )}
        </motion.form>
      )}
    </div>
  );
};

export default TopicDetail;
