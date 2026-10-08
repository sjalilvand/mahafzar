import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { cartApi } from "../../cartStore";

export default function CartIcon() {
  const count = useSyncExternalStore(cartApi.subscribe, cartApi.count, () => 0);
  return (
    <Link to="/cart" className="icon-btn cart-ic" title="سبد خرید" style={{ position: "relative" }}>
      <ShoppingBag size={18} />
      {count > 0 && <span className="cart-badge">{count}</span>}
    </Link>
  );
}
