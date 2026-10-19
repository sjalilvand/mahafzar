import React, { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { wishlistApi } from "../../wishlistStore";

/* دکمه قلب علاقه‌مندی — فعال/غیرفعال با کلیک toggle می‌شود */
export default function WishlistButton({ p, size = 16, className = "" }) {
  const items = useSyncExternalStore(wishlistApi.subscribe, wishlistApi.get, () => []);
  const active = items.some(i => i.id === p.id);
  return (
    <button type="button"
            className={"mh-wish-btn " + (active ? "active " : "") + className}
            title={active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            aria-pressed={active}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlistApi.toggle(p); }}>
      <Heart size={size} />
    </button>
  );
}
