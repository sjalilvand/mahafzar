import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle,
  XCircle, AlertTriangle, Award, RotateCcw, Flag
} from 'lucide-react';
import './Quiz.css';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const QuizPlayer = ({ quizId, onClose }) => {
  const { token } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.time_limit && attemptId && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz, attemptId, submitted]);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`${API_URL}/quiz/${quizId}`);
      setQuiz(res.data);
      setTimeLeft(res.data.time_limit * 60);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const res = await axios.post(`${API_URL}/quiz/${quizId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttemptId(res.data.attempt_id);
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در شروع آزمون');
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    // Confirm
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`${unanswered.length} سوال پاسخ داده نشده. مطمئنید؟`)) {
        return;
      }
    }

    try {
      const res = await axios.post(`${API_URL}/quiz/attempt/${attemptId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در ثبت پاسخ');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="quiz-loading"><div className="spinner"></div></div>;

  if (!attemptId) {
    return (
      <motion.div
        className="quiz-start-screen"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="quiz-start-card glass-card">
          <Award size={60} color="#00f2ff" />
          <h2>{quiz.title}</h2>
          <p>{quiz.description}</p>

          <div className="quiz-info-grid">
            <div className="quiz-info-item">
              <span>📝</span>
              <strong>{quiz.questions?.length || 0}</strong>
              <small>سوال</small>
            </div>
            <div className="quiz-info-item">
              <span>⭐</span>
              <strong>{quiz.total_points}</strong>
              <small>امتیاز کل</small>
            </div>
            <div className="quiz-info-item">
              <span>🎯</span>
              <strong>{quiz.passing_score}%</strong>
              <small>نمره قبولی</small>
            </div>
            <div className="quiz-info-item">
              <span>⏱️</span>
              <strong>{quiz.time_limit || '∞'}</strong>
              <small>دقیقه</small>
            </div>
          </div>

          <motion.button
            className="btn-start-quiz"
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            شروع آزمون 🚀
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (submitted && result) {
    return (
      <motion.div
        className="quiz-result-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="result-card glass-card">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {result.passed ? (
              <CheckCircle size={80} color="#0f0" />
            ) : (
              <XCircle size={80} color="#ff4444" />
            )}
          </motion.div>

          <h2>{result.passed ? '🎉 تبریک! قبول شدید' : '😔 متاسفانه قبول نشدید'}</h2>

          <div className="result-stats">
            <div className="result-stat">
              <strong>{result.score}</strong>
              <span>از {result.total}</span>
            </div>
            <div className="result-stat">
              <strong>{result.percentage}%</strong>
              <span>درصد</span>
            </div>
          </div>

          {result.certificate_code && (
            <div className="certificate-badge">
              <Award size={30} color="#ff0" />
              <span>کد گواهینامه: <strong>{result.certificate_code}</strong></span>
            </div>
          )}

          <div className="result-actions">
            <button onClick={() => setShowExplanation(!showExplanation)} className="btn-secondary">
              {showExplanation ? 'مخفی کردن پاسخ‌ها' : 'نمایش پاسخ‌های صحیح'}
            </button>
            <button onClick={onClose} className="btn-primary">بستن</button>
          </div>

          {showExplanation && (
            <div className="answers-review">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="answer-review-item">
                  <h4>سوال {idx + 1}: {q.question_text}</h4>
                  <p className={answers[q.id] === result.correct_answers?.[q.id] ? 'correct' : 'wrong'}>
                    پاسخ شما: {q.options?.[answers[q.id]] || 'بدون پاسخ'}
                  </p>
                  <p className="correct-answer">
                    پاسخ صحیح: {q.options?.[result.correct_answers?.[q.id]] || result.correct_answers?.[q.id]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-player">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span>{currentQuestion + 1} / {quiz.questions.length}</span>
        </div>

        {timeLeft !== null && (
          <div className={`quiz-timer ${timeLeft < 60 ? 'warning' : ''}`}>
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          className="question-card glass-card"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="question-header">
            <span className="question-number">سوال {currentQuestion + 1}</span>
            <span className="question-points">{question.points} امتیاز</span>
          </div>

          <h3 className="question-text">{question.question_text}</h3>

          <div className="options-grid">
            {question.options?.map((option, idx) => (
              <motion.button
                key={idx}
                className={`option-btn ${answers[question.id] === String(idx) ? 'selected' : ''}`}
                onClick={() => handleAnswer(question.id, String(idx))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="option-text">{option}</span>
                {answers[question.id] === String(idx) && (
                  <CheckCircle size={20} color="#0f0" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button
          className="nav-btn"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          <ChevronRight size={20} /> قبلی
        </button>

        <div className="question-dots">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentQuestion ? 'active' : ''} ${answers[quiz.questions[idx].id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            />
          ))}
        </div>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            className="nav-btn"
            onClick={() => setCurrentQuestion(prev => prev + 1)}
          >
            بعدی <ChevronLeft size={20} />
          </button>
        ) : (
          <button className="nav-btn submit-btn" onClick={handleSubmit}>
            پایان آزمون <Flag size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;

