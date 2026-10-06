import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // تنظیم هدر axios به صورت پیش‌فرض
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`);
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // اگر توکن منقضی شده یا نامعتبر است
      if (err.response?.status === 422 || err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });

      const { access_token, user: userData } = res.data;

      // ذخیره توکن
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);

      return userData;
    } catch (err) {
      console.error('Login error:', err.response?.data);
      throw err;
    }
  };

  const signup = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, userData);
      const { access_token, user: newUser } = res.data;

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(newUser);

      return newUser;
    } catch (err) {
      console.error('Signup error:', err.response?.data);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // اگر کاربر لاگین نکرده باشد، برای درخواست‌های عمومی توکن لازم نیست
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      getAuthHeaders,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
