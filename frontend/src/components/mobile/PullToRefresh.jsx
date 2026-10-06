import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import './PullToRefresh.css';

const PullToRefresh = ({ onRefresh, children }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0) {
      const distance = e.touches[0].clientY - touchStartY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.5, 120));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100vh' }}
    >
      {pullDistance > 0 && (
        <div
          className="pull-indicator"
          style={{ height: pullDistance }}
        >
          <motion.div
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
          >
            <RefreshCw
              size={30}
              color={pullDistance >= threshold ? '#0f0' : '#00f2ff'}
            />
          </motion.div>
          <span>
            {refreshing ? 'در حال بروزرسانی...' :
             pullDistance >= threshold ? 'رها کنید' : 'بکشید تا بروزرسانی شود'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

export default PullToRefresh;