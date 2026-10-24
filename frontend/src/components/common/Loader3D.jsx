// frontend/src/components/common/Loader3D.jsx
// MahAI round-10 — صفحه‌لودر سه‌بعدی: مکعب چرخان CSS خالص + هاله و نوار پیشرفت
// رنگ‌ها از متغیرهای تم (--primary/--accent) می‌آیند → با هر ۴ تم هماهنگ است

import React from 'react';
import { Brain } from 'lucide-react';

export default function Loader3D() {
  return (
    <div className="ld3d" role="status" aria-label="در حال بارگذاری">
      <div className="ld3d-scene">
        <div className="ld3d-glow" aria-hidden="true" />
        <div className="ld3d-cube" aria-hidden="true">
          <i className="ld3d-f1" /><i className="ld3d-f2" /><i className="ld3d-f3" />
          <i className="ld3d-f4" /><i className="ld3d-f5" /><i className="ld3d-f6" />
        </div>
        <div className="ld3d-shadow" aria-hidden="true" />
      </div>
      <div className="ld3d-brand">
        <Brain size={20} />
        <span>ماه‌افزار هوشمند رسا</span>
      </div>
      <div className="ld3d-sub">در حال آماده‌سازی تجربه شما…</div>
      <div className="ld3d-bar"><span /></div>
    </div>
  );
}
