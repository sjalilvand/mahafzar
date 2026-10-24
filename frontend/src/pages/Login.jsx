import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'نام کاربری یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
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
          <LogIn size={50} color="#8b5cf6" />
        </motion.div>

        <h2>ورود به حساب کاربری</h2>

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
            <User size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            نام کاربری
          </label>
          <input
            type="text"
            placeholder="نام کاربری خود را وارد کنید"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            placeholder="رمز عبور خود را وارد کنید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <motion.button
          type="submit"
          className="btn-submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <span className="spinner"></span> : 'ورود'}
        </motion.button>

        <p className="auth-link">
          حساب کاربری ندارید؟{' '}
          <Link to="/signup">ثبت‌نام کنید</Link>
        </p>
      </motion.form>
    </div>
  );
};

export default Login;