import React from "react";
import { Star, StarHalf } from "lucide-react";

/* نمایش امتیاز ستاره‌ای — rating بین ۰ تا ۵ (مثلا 4.5 = ۴ ستاره پر + نیم‌ستاره) */
export default function Stars({ rating = 0, count = 0, size = 13 }) {
  const shown = Math.round((rating || 0) * 2) / 2;
  const stars = [1, 2, 3, 4, 5];
  const render = (i) => {
    if (shown >= i) return <Star size={size} className="mh-star full" />;
    if (shown >= i - 0.5) return (
      <span className="mh-star-half" style={{ width: size, height: size }}>
        <Star size={size} className="mh-star empty" />
        <StarHalf size={size} className="mh-star half" />
      </span>
    );
    return <Star size={size} className="mh-star empty" />;
  };
  return (
    <span className="mh-stars" title={rating ? rating + " از ۵" : "بدون امتیاز"}>
      {stars.map(i => <React.Fragment key={i}>{render(i)}</React.Fragment>)}
      {count > 0 && <small className="mh-stars-count">({new Intl.NumberFormat("fa-IR").format(count)})</small>}
    </span>
  );
}
