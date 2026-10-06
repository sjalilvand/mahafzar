# راهنمای انتشار mahai.ir

## ✅ چک‌لیست قبل از انتشار
- [ ] frontend: `npm run build` و آپلود محتوای پوشه dist
- [ ] backend: آپلود بدون .venv و __pycache__ (فقط کد + requirements.txt)
- [ ] روی سرور: python -m venv .venv  و  pip install -r requirements.txt
- [ ] اجرای Backend با waitress (ویندوز) یا gunicorn (لینوکس) — نه flask run
- [ ] اتصال دامنه + SSL رایگان (Let's Encrypt / certbot)
- [ ] ریدایرکت http به https در nginx
- [ ] فایل .env سرور جدا باشد (کلیدهای محلی کپی نشود)
- [ ] تست: /api/docs (Swagger) فقط در صورت نیاز عمومی باز بماند

## 🐧 سرور لینوکس (پیشنهادی - Ubuntu)
sudo apt update && sudo apt install -y python3-venv nginx
cd /var/www/mahai/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt gunicorn
gunicorn -w 4 -b 127.0.0.1:8000 app:app        # نام app:app بعد از بررسی دقیق اصلاح می‌شود
# فرانت: محتوای dist را در /var/www/mahai/frontend بریزید و nginx روی آن Root بدهید
sudo certbot --nginx -d mahai.ir -d www.mahai.ir

## 🪟 سرور ویندوز
pip install waitress
waitress-serve --host=127.0.0.1 --port=8000 app:app
