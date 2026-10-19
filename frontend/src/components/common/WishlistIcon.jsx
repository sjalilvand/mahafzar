import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { wishlistApi } from "../../wishlistStore";

export default function WishlistIcon() {
  const count = useSyncExternalStore(wishlistApi.subscribe, wishlistApi.count, () => 0);
  return (
    <Link to="/wishlist" className="icon-btn wish-ic" title="علاقه‌مندی‌ها" style={{ position: "relative" }}>
      <Heart size={18} />
      {count > 0 && <span className="cart-badge wish-badge">{count}</span>}
    </Link>
  );
}
