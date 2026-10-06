import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Clock, Eye, MessageCircle } from 'lucide-react';
import axios from 'axios';
import './Courses.css';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const categories = ['همه', 'هوش مصنوعی', 'برنامه‌نویسی', 'داده', 'امنیت'];
  const levels = ['همه', 'beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchCourses();
  }, [search, category, level, sort, page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 9,
        search,
        sort,
      };
      if (category !== 'all') params.category = category;
      if (level !== 'all') params.level = level;

      const res = await axios.get(`${API_URL}/courses/`, { params });
      setCourses(res.data.courses);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
    setLoading(false);
  };

  const fetchCourseDetail = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/courses/${id}`);
      setSelectedCourse(res.data);
    } catch (err) {
      console.error('Error fetching course detail:', err);
    }
  };

  return (
    <div className="courses-page">
      {/* Hero Section */}
      <section className="courses-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="courses-hero-content"
        >
          <h1>آموزش‌های تخصصی</h1>
          <p>یادگیری مهارت‌های جدید با بهترین متخصصان ماه‌افزار</p>
        </motion.div>
      </section>

      {/* Filters & Search */}
      <section className="courses-filters">
        <div className="filter-container">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="جستجو در آموزش‌ها..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-select">
              <Filter size={18} />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat === 'همه' ? 'all' : cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-select">
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl === 'همه' ? 'همه سطوح' : lvl}</option>
                ))}
              </select>
            </div>

            <div className="filter-select">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">جدیدترین</option>
                <option value="popular">محبوب‌ترین</option>
                <option value="rating">بالاترین امتیاز</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="courses-grid-section">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="courses-grid">
              {courses.map(course => (
                <motion.div
                  key={course.id}
                  className="course-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10 }}
                  onClick={() => fetchCourseDetail(course.id)}
                >
                  <div className="course-thumbnail">
                    <img src={course.thumbnail_url || '/course-placeholder.jpg'} alt={course.title} />
                    <span className="course-level">{course.level}</span>
                  </div>
                  <div className="course-info">
                    <span className="course-category">{course.category}</span>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="course-meta">
                      <span><Star size={16} /> {course.avg_rating}</span>
                      <span><Eye size={16} /> {course.view_count}</span>
                      <span><MessageCircle size={16} /> {course.comment_count}</span>
                      <span><Clock size={16} /> {course.duration}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
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
          </>
        )}
      </section>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <motion.div
            className="course-detail-modal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setSelectedCourse(null)}>✕</button>
            <h2>{selectedCourse.title}</h2>
            <div className="course-meta-detail">
              <span><Star size={16} /> {selectedCourse.avg_rating}</span>
              <span><Eye size={16} /> {selectedCourse.view_count}</span>
              <span>{selectedCourse.level}</span>
            </div>
            <div
              className="course-content"
              dangerouslySetInnerHTML={{ __html: selectedCourse.content }}
            />

            {/* Comments Section */}
            <div className="comments-section">
              <h3>نظرات</h3>
              {selectedCourse.comments?.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <strong>{comment.author}</strong>
                    <span>{new Date(comment.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <p>{comment.content}</p>
                  {comment.replies?.map(reply => (
                    <div key={reply.id} className="comment reply">
                      <strong>{reply.author}</strong>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Courses;
