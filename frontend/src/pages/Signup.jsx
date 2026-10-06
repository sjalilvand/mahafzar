import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, User, Mail, Lock, UserCheck } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      setLoading(false);
      return;
    }

    try {
      await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="auth-page">
      <motion.form
        onSubmit={handleSubmit}
        className="auth-form glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ textAlign: 'center', marginBottom: '20px' }}
        >
          <UserPlus size={50} color="#00f2ff" />
        </motion.div>

        <h2>ثبت‌نام در ماه‌افزار</h2>

        {error && (
          <motion.p
            className="error-msg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.p>
        )}

        <div className="form-group">
          <label>
            <UserCheck size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            نام کامل
          </label>
          <input
            type="text"
            name="full_name"
            placeholder="نام و نام خانوادگی خود را وارد کنید"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <User size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            نام کاربری
          </label>
          <input
            type="text"
            name="username"
            placeholder="یک نام کاربری انتخاب کنید"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label>
            <Mail size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            ایمیل
          </label>
          <input
            type="email"
            name="email"
            placeholder="ایمیل خود را وارد کنید"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <Lock size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            رمز عبور
          </label>
          <input
            type="password"
            name="password"
            placeholder="حداقل ۶ کاراکتر"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label>
            <Lock size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            تکرار رمز عبور
          </label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="رمز عبور را دوباره وارد کنید"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <motion.button
          type="submit"
          className="btn-submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <span className="spinner"></span> : 'ثبت‌نام'}
        </motion.button>

        <p className="auth-link">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link to="/login">وارد شوید</Link>
        </p>
      </motion.form>
    </div>
  );
};

export default Signup;