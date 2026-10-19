import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { compareApi } from "../../compareStore";

/* آیکون مقایسه در نوار بالا — مثل CartIcon/WishlistIcon با شمارنده */
export default function CompareIcon() {
  const count = useSyncExternalStore(compareApi.subscribe, compareApi.count, () => 0);
  return (
    <Link to="/compare" className="icon-btn cmp-ic" title="مقایسه محصولات" style={{ position: "relative" }}>
      <Scale size={18} />
      {count > 0 && <span className="cart-badge cmp-badge">{count}</span>}
    </Link>
  );
}
