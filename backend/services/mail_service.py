# -*- coding: utf-8 -*-
"""MahAI mail service — اعلان ایمیلی سبک بدون وابستگی خارجی (smtplib استاندارد).

تنظیمات با متغیرهای محیطی (.env):
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TLS (1/0)
اگر SMTP_HOST تنظیم نشده باشد، ایمیل ارسال نمی‌شود و اعلان در لاگ سرور چاپ
می‌شود تا در محیط توسعه هم رویدادها قابل مشاهده باشند. هیچ‌وقت خطای ایمیل
نباید درخواست اصلی (مثلا ثبت نظر) را بشکند — همه‌چیز fail-safe است.
"""
import os
import smtplib
import logging
from email.message import EmailMessage
from datetime import datetime

log = logging.getLogger("mahai.mail")


def _env(name, default=""):
    return (os.environ.get(name) or default).strip()


def smtp_configured():
    return bool(_env("SMTP_HOST"))


def _recipients(extra=None):
    """گیرندگان اعلان فروشگاه: SHOP_NOTIFY_EMAIL + ایمیل همه کاربران admin"""
    out = []
    first = _env("SHOP_NOTIFY_EMAIL")
    if first:
        out.append(first)
    try:
        from models import User
        for u in User.query.filter_by(role='admin').all():
            if u.email and u.email not in out:
                out.append(u.email)
    except Exception:
        pass
    for e in (extra or []):
        if e and e not in out:
            out.append(e)
    return out


def send_email(to_list, subject, html):
    """ارسال ایمیل HTML. خروجی: (ok, detail) — هیچ exceptionای بیرون نمی‌دهد."""
    to_list = [t for t in (to_list or []) if t and "@" in t]
    if not to_list:
        return False, "no recipient"
    if not smtp_configured():
        # حالت توسعه: اعلان در کنسول سرور
        log.info("[MAIL:DEV-ONLY] to=%s subject=%r (SMTP_HOST تنظیم نشده — ارسال واقعی انجام نشد)",
                 ",".join(to_list), subject)
        print("📬 [DEV-MAIL] → %s | %s" % (", ".join(to_list), subject))
        return False, "smtp not configured (logged to console)"
    try:
        host = _env("SMTP_HOST")
        port = int(_env("SMTP_PORT", "587") or 587)
        user = _env("SMTP_USER")
        pwd = _env("SMTP_PASS")
        sender = _env("SMTP_FROM") or user or "mahafzar@localhost"

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = "ماه‌افزار <%s>" % sender
        msg["To"] = ", ".join(to_list)
        msg.set_content("برای مشاهده، ایمیل خود را در حالت HTML باز کنید.")
        msg.add_alternative(html, subtype="html")

        use_tls = _env("SMTP_TLS", "1" if port == 465 else "0") in ("1", "true", "True")
        if use_tls:
            with smtplib.SMTP_SSL(host, port, timeout=12) as s:
                if user and pwd:
                    s.login(user, pwd)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=12) as s:
                s.ehlo()
                try:
                    s.starttls()
                except smtplib.SMTPNotSupportedError:
                    pass
                if user and pwd:
                    s.login(user, pwd)
                s.send_message(msg)
        log.info("[MAIL] sent to=%s subject=%r", ",".join(to_list), subject)
        return True, "sent"
    except Exception as e:
        log.warning("[MAIL] send failed: %s", e)
        return False, str(e)


# ---------------- قالب‌های اعلان ----------------

def _wrap(inner_html):
    return (
        '<!doctype html><html dir="rtl" lang="fa"><body style="margin:0;padding:24px;'
        'background:#0f172a;font-family:Tahoma,Vazirmatn,Arial,sans-serif;">'
        '<div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;'
        'overflow:hidden;border:1px solid #334155">'
        '<div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:18px 24px;">'
        '<h2 style="margin:0;color:#fff;font-size:17px;">🛍 ماه‌افزار — اعلان فروشگاه</h2></div>'
        '<div style="padding:22px 24px;color:#e2e8f0;font-size:14px;line-height:2">%s</div>'
        '<div style="padding:14px 24px;background:#0f172a;color:#64748b;font-size:12px;'
        'text-align:center">ماه‌افزار • %s</div></div></body></html>'
    ) % (inner_html, datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))


def notify_new_review(review, product):
    """اعلان نظر جدید محصول به مدیران — fail-safe"""
    stars = "★" * int(review.rating or 0) + "☆" * (5 - int(review.rating or 0))
    body = """
      <p style="margin:0 0 12px">یک نظر جدید برای محصول ثبت شد:</p>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:14px 18px;margin:10px 0">
        <p style="margin:0 0 6px"><b style="color:#22d3ee">٪(pname)s</b></p>
        <p style="margin:0 0 6px">امتیاز: <b style="color:#fbbf24;letter-spacing:2px">%(stars)s</b>
           (%(rating)s از ۵)</p>
        <p style="margin:0 0 6px">کاربر: <b>%(user)s</b></p>
        %(comment_p)s
      </div>
      <p style="margin:12px 0 0;color:#94a3b8;font-size:13px">
        برای مدیریت نظرات به پنل مدیریت → فروشگاه → نظرات بروید.</p>
    """ % {
        "pname": (product.name if product else "محصول"),
        "stars": stars,
        "rating": int(review.rating or 0),
        "user": review.username or "کاربر",
        "comment_p": ('<p style="margin:6px 0 0;color:#cbd5e1">«%s»</p>'
                      % (review.comment or "").replace("<", "&lt;").replace(">", "&gt;")
                      ) if review.comment else "",
    }
    targets = _recipients()
    if not targets:
        log.info("[MAIL] no admin recipient for review #%s", review.id)
        return False, "no recipients"
    return send_email(targets,
                      "💬 نظر جدید برای «%s» (%s/۵)" % (product.name if product else "محصول",
                                                      int(review.rating or 0)),
                      _wrap(body))
