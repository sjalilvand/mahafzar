import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Check, Zap, Crown, Star, Shield, Gift } from 'lucide-react';
import './Pricing.css';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const Pricing = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/plans`);
      setPlans(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/payments/discounts/validate`, {
        code: discountCode,
        amount: selectedPlan?.price || 0
      });
      setDiscountResult(res.data);
    } catch (err) {
      setDiscountResult({ valid: false, message: 'کد تخفیف نامعتبر است' });
    }
  };

  const handleSubscribe = async (planId) => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/payments/subscribe/${planId}`,
        { discount_code: discountResult?.valid ? discountCode : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to payment gateway
      window.location.href = res.data.payment_url;
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در شروع پرداخت');
    }
  };

  const planIcons = {
    basic: <Star size={40} />,
    pro: <Zap size={40} />,
    enterprise: <Crown size={40} />
  };

  const planColors = {
    basic: '#6366f1',
    pro: '#8b5cf6',
    enterprise: '#ffd700'
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          انتخاب پلن مناسب
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          با انتخاب هر پلن، به امکانات ویژه دسترسی پیدا کنید
        </motion.p>
      </div>

      <div className="plans-grid">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            className={`plan-card glass-card ${plan.is_popular ? 'popular' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            whileHover={{ y: -10 }}
          >
            {plan.is_popular && (
              <div className="popular-badge">
                <Star size={16} /> محبوب‌ترین
              </div>
            )}

            <div className="plan-icon" style={{ color: planColors[plan.name.toLowerCase()] || '#8b5cf6' }}>
              {planIcons[plan.name.toLowerCase()] || <Zap size={40} />}
            </div>

            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>

            <div className="plan-price">
              <span className="price-amount">{plan.price?.toLocaleString('fa-IR')}</span>
              <span className="price-currency">تومان</span>
              <span className="price-duration">/ {plan.duration_days} روز</span>
            </div>

            {plan.monthly_price && (
              <div className="plan-monthly">
                معادل {plan.monthly_price?.toLocaleString('fa-IR')} تومان در ماه
              </div>
            )}

            <div className="plan-features">
              {plan.features?.map((feature, i) => (
                <div key={i} className="feature-item">
                  <Check size={18} color="#0f0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              className={`plan-btn ${plan.is_popular ? 'primary' : ''}`}
              onClick={() => handleSubscribe(plan.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {plan.is_popular ? (
                <><Crown size={18} /> شروع کنید</>
              ) : (
                'انتخاب پلن'
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Discount Code */}
      <motion.div
        className="discount-section glass-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3><Gift size={24} /> کد تخفیف دارید؟</h3>
        <div className="discount-input-group">
          <input
            type="text"
            placeholder="کد تخفیف را وارد کنید"
            value={discountCode}
            onChange={e => setDiscountCode(e.target.value)}
          />
          <button onClick={validateDiscount}>اعمال</button>
        </div>
        {discountResult && (
          <div className={`discount-result ${discountResult.valid ? 'success' : 'error'}`}>
            {discountResult.valid ? (
              <span>✅ {discountResult.discount_amount?.toLocaleString('fa-IR')} تومان تخفیف اعمال شد</span>
            ) : (
              <span>❌ {discountResult.message}</span>
            )}
          </div>
        )}
      </motion.div>

      {/* Features Comparison */}
      <div className="features-comparison glass-card">
        <h3>مقایسه امکانات</h3>
        <table>
          <thead>
            <tr>
              <th>امکانات</th>
              {plans.map(p => <th key={p.id}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {['دسترسی به همه دوره‌ها', 'آزمون‌های نامحدود', 'گواهینامه', 'پشتیبانی ویژه', 'API دسترسی', 'مشاوره اختصاصی'].map((feature, i) => (
              <tr key={i}>
                <td>{feature}</td>
                {plans.map((plan, j) => (
                  <td key={j}>
                    {j <= i ? <Check size={18} color="#0f0" /> : <span className="not-available">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pricing;

