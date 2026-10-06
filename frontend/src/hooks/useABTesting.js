import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const variantCache = {};

export function useABTesting(experimentKey) {
  const { token } = useAuth();
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (variantCache[experimentKey]) {
      setVariant(variantCache[experimentKey]);
      setLoading(false);
      return;
    }

    fetchVariant();
  }, [experimentKey]);

  const fetchVariant = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/ab-testing/variant/${experimentKey}`, { headers });

      variantCache[experimentKey] = res.data.variant;
      setVariant(res.data.variant);
    } catch (err) {
      console.error('A/B testing error:', err);
      setVariant('default');
    }
    setLoading(false);
  };

  const trackEvent = async (eventType, data = {}) => {
    if (!token) return;

    try {
      await axios.post(`${API_URL}/ab-testing/track`, {
        experiment_key: experimentKey,
        variant,
        event_type: eventType,
        data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Track event error:', err);
    }
  };

  return { variant, loading, trackEvent };
}

// استفاده در کامپوننت:
// const { variant } = useABTesting('homepage_hero');
// if (variant === 'cyber') return <CyberHero />;
// if (variant === 'minimal') return <MinimalHero />;
