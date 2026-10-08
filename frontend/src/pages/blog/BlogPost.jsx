import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../../api/client";

export default function BlogPost() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  useEffect(() => { client.get("/shop/articles/" + slug).then(r => setA(r.data.article)).catch(() => setA({ nf: true })); }, [slug]);
  if (!a) return <div className="biz-page"><p className="biz-sub">در حال بارگذاری...</p></div>;
  if (a.nf) return <div className="biz-page"><p>مقاله یافت نشد.</p><Link to="/blog" className="biz-btn">بازگشت</Link></div>;
  return (
    <div className="biz-page" style={{ maxWidth: 820 }}>
      <h1 className="biz-title">{a.title}</h1>
      <p className="biz-sub">{new Date(a.created_at).toLocaleDateString("fa-IR")}</p>
      <div className="biz-card"><p style={{ color: "#e2e8f0", lineHeight: 2, whiteSpace: "pre-wrap" }}>{a.body}</p></div>
      <Link to="/blog" className="btn-auth ghost">همه مقالات</Link>
    </div>
  );
}
