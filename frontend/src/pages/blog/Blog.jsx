import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function Blog() {
  const [arts, setArts] = useState([]);
  useEffect(() => { client.get("/shop/articles").then(r => setArts(r.data.articles || [])).catch(() => {}); }, []);
  return (
    <div className="biz-page" style={{ maxWidth: 900 }}>
      <h1 className="biz-title">مقالات و راهنماها</h1>
      <p className="biz-sub">دانش فنی و تجربه‌های اجرایی تیم ماه‌افزار</p>
      {arts.map(a => (
        <Link key={a.slug} to={"/blog/" + a.slug} className="biz-card" style={{ display: "block", textDecoration: "none" }}>
          <b style={{ color: "#e2e8f0", fontSize: 16 }}>{a.title}</b>
          <p className="biz-sub" style={{ marginTop: 6, marginBottom: 0 }}>{a.excerpt}</p>
          <small style={{ color: "#475569" }}>{new Date(a.created_at).toLocaleDateString("fa-IR")}</small>
        </Link>
      ))}
      {arts.length === 0 && <p className="biz-sub">هنوز مقاله‌ای منتشر نشده است.</p>}
    </div>
  );
}
