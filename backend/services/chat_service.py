"""
services/chat_service.py — round-11 rewrite
دستیار هوشمند ماه‌افزار — مبتنی بر دیتابیس واقعی:
  • محصولات فروشگاه (ShopProduct): استعلام قیمت + راهنمای سفارش
  • دوره‌های آموزشی (Course): درخواست آموزش
  • مقالات (ShopArticle): جستجوی مقاله
ساختار پاسخ: dict = {'text', 'items', 'actions'} — سازگار با پاسخ متنی قدیمی
"""

import re
from models import Course  # noqa: F401


# ---------- نرمال‌سازی متن فارسی ----------
_AR_MAP = str.maketrans({
    'ي': 'ی', 'ك': 'ک', 'ؤ': 'و', 'إ': 'ا', 'أ': 'ا', 'ة': 'ه', 'ۀ': 'ه', 'آ': 'ا',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
})

# واژه‌های نقش‌گر (stopword) — در استخراج موضوع حذف می‌شوند
_STOPWORDS = {
    'سلام', 'درود', 'علیکم', 'خوبی', 'خوبم', 'مرسی', 'ممنون', 'لطفا', 'لطفا',
    'میخوام', 'میخواهم', 'ميخوام', 'میخایم', 'بخوام', 'میشه', 'ميشود', 'میشود',
    'قیمت', 'قیمتش', 'چنده', 'چقدر', 'چند', 'هزینه', 'بهای', 'تومان', 'تموم',
    'میشه', 'هست', 'هستش', 'است', 'بود', 'شده', 'کند', 'کنم', 'کنید', 'بده',
    'بدم', 'بگیرم', 'بخرم', 'میخرم', 'خرید', 'سفارش', 'ثبت', 'درباره', 'را', 'رو',
    'به', 'از', 'با', 'و', 'در', 'که', 'این', 'ان', 'آن', 'یه', 'یکی', 'یک',
    'برای', 'دنبال', 'های', 'هایی', 'ها', 'هم', 'همه', 'چی', 'چه', 'چیه',
    'کدام', 'کدوم', 'شما', 'من', 'منم', 'ما', 'لطفا', 'می', 'تا', 'اگر',
    'چطور', 'چگونه', 'چجوری', 'کی', 'کجا', 'کِی', 'چرا', 'کدوم', 'نشه', 'باشه',
    'دستیار', 'سلام', 'آقا', 'خانم', 'فقط', 'الان', 'بعد', 'قبل', 'داره',
    'دارید', 'دارید', 'دارین', 'داری', 'موجود', 'لطفا', 'ممنونم', 'متشکر',
    'اموزش', 'اموزشی', 'آموزشی', 'دوره', 'دوره‌ای', 'کلاس', 'مقاله', 'مقالات',
    'محصول', 'محصولات', 'محصولی', 'سفارش', 'ترتیب',
}


def _norm(text):
    """نرمال‌سازی: عربی→فارسی، نیم‌فاصله→فاصله، حذف علائم، فشرده‌سازی فاصله"""
    if not text:
        return ''
    t = str(text).translate(_AR_MAP)
    t = t.replace('\u200c', ' ')          # نیم‌فاصله → فاصله تا «چت‌بات» و «چت بات» یکی شوند
    t = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t


def _tokens(text):
    """توکن‌های معنادار پیام (بدون stopwords و توکن‌های خیلی کوتاه)"""
    n = _norm(text)
    return [w for w in n.split() if len(w) >= 3 and w not in _STOPWORDS]


def toman(amount):
    """۱۵,۰۰۰,۰۰۰ تومان — با ارقام فارسی"""
    try:
        s = f'{int(amount):,}'.translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))
        return s.replace(',', '٬')
    except (ValueError, TypeError):
        return '۰'


# ---------- نگاشت مدل‌ها (import دیرهنگام برای پرهیز از import cycle) ----------
def _shop_models():
    from routes.shop import ShopProduct, ShopArticle
    return ShopProduct, ShopArticle


class ChatService:
    def __init__(self):
        self.greeting = ('سلام! من دستیار هوشمند ماه‌افزار هستم 🌙\n'
                         'می‌تونم قیمت محصولات رو بگم، راهنمای سفارش باشم، آموزش معرفی کنم '
                         'و از مقالات جواب بدم.')
        self.capabilities_hint = (
            'می‌تونم این کارها رو انجام بدم:\n'
            '• استعلام قیمت محصول — مثلا: «قیمت ربات ارسال مرسوله چنده؟»\n'
            '• راهنمای سفارش — مثلا: «می‌خوام چت‌بات پشتیبانی رو سفارش بدم»\n'
            '• معرفی دوره‌های آموزشی — مثلا: «دنبال آموزش پایتون هستم»\n'
            '• جستجوی مقالات — مثلا: «مقاله‌ای درباره فروش آنلاین»'
        )

    # ------------------------------------------------- API
    def get_response(self, message):
        """خروجی: (dict{text,items,actions}, sources)"""
        try:
            return self._respond(message)
        except Exception:  # fail-safe: هیچ‌وقت 500 برنگردان
            return ({'text': 'متاسفانه در پردازش پیام خطایی پیش آمد. لطفا دوباره تلاش کنید.',
                     'items': [], 'actions': []}, [])

    # ------------------------------------------------- هسته
    def _respond(self, message):
        raw = (message or '').strip()
        n = _norm(raw)
        if not n:
            return ({'text': 'چیزی ننوشتید! سوالی درباره محصولات، آموزش‌ها یا مقالات دارید؟',
                     'items': [], 'actions': []}, [])

        toks = _tokens(raw)

        # --- سلام و احوالپرسی
        if any(w in n for w in ['سلام', 'درود', 'وقت بخیر', 'خوبی', 'چطوری']) and len(n.split()) <= 5:
            return ({'text': self.greeting,
                     'items': [], 'actions': self._default_actions()}, [])

        # --- تشکر
        if any(w in n for w in ['ممنون', 'مرسی', 'متشکر', 'دستت درد']):
            return ({'text': 'خواهش می‌کنم! اگر سوال دیگه‌ای داشتید در خدمتم 🌙',
                     'items': [], 'actions': self._default_actions()}, [])

        # --- نیت‌ها
        price_intent = any(w in n for w in ['قیمت', 'چنده', 'چقدر', 'هزینه', 'بهای', 'نرخ', 'چند در میاد', 'چند میشه'])
        order_intent = any(w in n for w in ['سفارش', 'بخرم', 'خرید', 'میخرم', 'خریدارم', 'ثبت سفارش', 'خريد'])
        train_intent = any(w in n for w in ['اموزش', 'دوره', 'یاد', 'کلاس', 'مدرک', 'تدریس'])
        article_intent = any(w in n for w in ['مقاله', 'بلاگ', 'نوشته', 'خبر', 'وبلاگ'])
        help_intent = any(w in n for w in ['کمک', 'راهنما', 'چیکار', 'چه کاری', 'امکانات', 'بلدی'])

        if help_intent:
            return ({'text': self.capabilities_hint,
                     'items': [], 'actions': self._default_actions()}, [])

        # --- ۱) استعلام قیمت / سفارش محصول
        if price_intent or order_intent:
            products = self._find_products(toks, raw)
            if products:
                if price_intent:
                    return self._price_reply(products)
                return self._order_reply(products)
            # نیت قیمت/سفارش بدون محصول شناخته‌شده
            return ({'text': ('دقیق متوجه نشدم کدوم محصول مد نظرتونه. '
                              'اسم محصول رو کامل بنویسید — مثلا: «قیمت ربات ارسال مرسوله چنده؟» '
                              'یا از فروشگاه، لیست کامل رو ببینید.'),
                     'items': self._top_products(4),
                     'actions': [{'label': 'مشاهده فروشگاه', 'type': 'link', 'to': '/shop'}],
                     }, [])

        # --- ۲) درخواست آموزش
        if train_intent:
            courses = self._find_courses(toks, raw)
            if courses:
                lines = ['این دوره‌های مرتبط رو پیدا کردم:']
                for c in courses:
                    line = f'• {c["title"]}'
                    if c.get('level'):
                        line += f' — سطح: {c["level"]}'
                    if c.get('duration'):
                        line += f' ({c["duration"]})'
                    lines.append(line)
                lines.append('\nبرای شروع یادگیری روی هر دوره بزنید. اگر دوره خاصی مدنظرتون نیست، بگید چه مهارتی می‌خواید تا جستجو کنم.')
                return ({'text': '\n'.join(lines),
                         'items': courses,
                         'actions': [{'label': 'همه دوره‌ها', 'type': 'link', 'to': '/courses'}],
                         }, [c['title'] for c in courses])
            return self._topic_fallback(toks, 'آموزش')

        # --- ۳) مقالات
        if article_intent:
            articles = self._find_articles(toks, raw)
            if articles:
                lines = ['این مقالات مرتبط رو پیدا کردم:']
                for a in articles:
                    lines.append(f'• {a["title"]}')
                    if a.get('excerpt'):
                        lines.append(f'  {a["excerpt"][:80]}…')
                return ({'text': '\n'.join(lines),
                         'items': articles,
                         'actions': [{'label': 'همه مقالات', 'type': 'link', 'to': '/blog'}],
                         }, [a['title'] for a in articles])
            return self._topic_fallback(toks, 'مقاله')

        # --- ۴) جستجوی عمومی (بدون نیت مشخص) — فقط تطبیق عنوان تا false-positive نشود
        products = self._find_products(toks, raw, min_score=4)
        if products:
            p = products[0]
            price_line = f'قیمت «{p["name"]}»: {toman(p["final_price"])} تومان'
            if p['discount_percent']:
                price_line += f' (با {to_fa(p["discount_percent"])}٪ تخفیف)'
            return ({'text': price_line + '\nاگر می‌خواهید سفارش بدید، از دکمه‌های زیر استفاده کنید:',
                     'items': products[:3],
                     'actions': [{'label': 'افزودن به سبد', 'type': 'add_to_cart', 'slug': p['slug']},
                                 {'label': 'مشاهده محصول', 'type': 'link', 'to': f'/product/{p["slug"]}'}],
                     }, [p['name']])

        courses = self._find_courses(toks, raw, min_score=4)
        if courses:
            return ({'text': 'این دوره‌ها شاید به دردتون بخورن:',
                     'items': courses[:3],
                     'actions': [{'label': 'همه دوره‌ها', 'type': 'link', 'to': '/courses'}],
                     }, [c['title'] for c in courses[:3]])

        articles = self._find_articles(toks, raw, min_score=4)
        if articles:
            return ({'text': 'این مقالات مرتبط رو پیدا کردم:',
                     'items': articles[:3],
                     'actions': [{'label': 'همه مقالات', 'type': 'link', 'to': '/blog'}],
                     }, [a['title'] for a in articles[:3]])

        return self._topic_fallback(toks)

    # ------------------------------------------------- جستجو در دیتابیس
    def _find_products(self, toks, raw, min_score=1):
        ShopProduct, _ = _shop_models()
        try:
            rows = ShopProduct.query.filter_by(is_active=True).limit(200).all()
        except Exception:
            return []
        n_raw = _norm(raw)
        # تطبیق دقیق: اگر نام کامل یک محصول داخل پیام بود، فقط همان برگردانده شود
        exact = [p for p in rows
                 if len(_norm(p.name)) >= 5 and _norm(p.name) in n_raw]
        if exact:
            best = max(exact, key=lambda p: len(_norm(p.name)))
            return [self._product_item(best)]
        scored = []
        for p in rows:
            hay_title = _norm(f'{p.name} {p.category.name if p.category else ""}')
            hay_desc = _norm(f'{p.short_desc or ""} {p.description or ""}')
            score = 0
            for w in toks:
                if w in hay_title:
                    score += 4
                elif w in hay_desc:
                    score += 1
            # تطبیق عبارت کامل در نام (مثل «ربات ارسال مرسوله»)
            if len(n_raw) >= 5 and _norm(p.name) in n_raw:
                score += 6
            if score > 0 and score >= min_score:
                scored.append((score, p))
        scored.sort(key=lambda x: (-x[0], -(x[1].sales_count or 0)))
        return [self._product_item(p) for _, p in scored[:5]]

    def _find_courses(self, toks, raw, min_score=1):
        try:
            rows = Course.query.filter_by(is_published=True).limit(200).all()
        except Exception:
            return []
        scored = []
        for c in rows:
            hay_title = _norm(f'{c.title} {c.category or ""} {c.tags or ""}')
            hay_desc = _norm(c.description or '')
            score = 0
            for w in toks:
                if w in hay_title:
                    score += 4
                elif w in hay_desc:
                    score += 1
            if score > 0 and score >= min_score:
                scored.append((score, c))
        scored.sort(key=lambda x: -x[0])
        return [self._course_item(c) for _, c in scored[:5]]

    def _find_articles(self, toks, raw, min_score=1):
        _, ShopArticle = _shop_models()
        try:
            rows = ShopArticle.query.filter_by(is_published=True).limit(200).all()
        except Exception:
            return []
        scored = []
        for a in rows:
            hay_title = _norm(a.title)
            hay_desc = _norm(f'{a.excerpt or ""} {a.body or ""}')
            score = 0
            for w in toks:
                if w in hay_title:
                    score += 4
                elif w in hay_desc:
                    score += 1
            if score > 0 and score >= min_score:
                scored.append((score, a))
        scored.sort(key=lambda x: -x[0])
        return [self._article_item(a) for _, a in scored[:5]]

    # ------------------------------------------------- پاسخ‌های آماده
    def _price_reply(self, products):
        p = products[0]
        lines = []
        if len(products) == 1:
            line = f'قیمت «{p["name"]}»: {toman(p["final_price"])} تومان'
            if p['discount_percent']:
                line = (f'قیمت «{p["name"]}»: {toman(p["final_price"])} تومان '
                        f'(به‌جای {toman(p["price"])} تومان — {to_fa(p["discount_percent"])}٪ تخفیف)')
            if p.get('short_desc'):
                lines.append(p['short_desc'])
            lines.append(line)
            lines.append('اگر بخواهید همین حالا سفارش بدید، دکمه «افزودن به سبد» زیر کارت محصول رو بزنید.')
        else:
            lines.append(f'{to_fa(len(products))} محصول مرتبط پیدا کردم:')
            for it in products:
                lines.append(f'• {it["name"]} — {toman(it["final_price"])} تومان')
            lines.append('روی هر کارت بزنید تا جزئیات کامل و دکمه سفارش رو ببینید.')
        return ({'text': '\n'.join(lines),
                 'items': products,
                 'actions': [{'label': 'مشاهده فروشگاه', 'type': 'link', 'to': '/shop'}],
                 }, [it['name'] for it in products])

    def _order_reply(self, products):
        p = products[0]
        steps = ('سفارشش خیلی ساده‌ست:\n'
                 '۱) دکمه «افزودن به سبد» روی کارت محصول (همین پایین)\n'
                 '۲) رفتن به سبد خرید و تکمیل اطلاعات\n'
                 '۳) پرداخت — فایل یا لایسنس بلافاصله بعد از پرداخت صادر می‌شه.')
        if len(products) == 1:
            text = f'«{p["name"]}» الان موجوده — {toman(p["final_price"])} تومان.\n' + steps
        else:
            text = 'این محصولات مرتبط رو پیدا کردم:\n' + steps
        return ({'text': text,
                 'items': products,
                 'actions': [{'label': 'افزودن به سبد', 'type': 'add_to_cart', 'slug': p['slug']},
                             {'label': 'سبد خرید', 'type': 'link', 'to': '/cart'},
                             {'label': 'مشاهده محصول', 'type': 'link', 'to': f'/product/{p["slug"]}'}],
                 }, [it['name'] for it in products])

    def _topic_fallback(self, toks, kind=None):
        prefix = (f'در مورد «{" ".join(toks[:4])}» مطلب دقیقی پیدا نکردم.'
                  if toks else 'متوجه نشدم چی می‌خواهید.')
        return ({'text': prefix + '\n' + self.capabilities_hint,
                 'items': self._top_products(3),
                 'actions': self._default_actions(),
                 }, [])

    def _top_products(self, k):
        ShopProduct, _ = _shop_models()
        try:
            rows = (ShopProduct.query.filter_by(is_active=True)
                    .order_by(ShopProduct.sales_count.desc()).limit(k).all())
            return [self._product_item(p) for p in rows]
        except Exception:
            return []

    def _default_actions(self):
        return [{'label': 'فروشگاه', 'type': 'link', 'to': '/shop'},
                {'label': 'دوره‌های آموزشی', 'type': 'link', 'to': '/courses'},
                {'label': 'مقالات', 'type': 'link', 'to': '/blog'}]

    # ------------------------------------------------- آیتم‌های ساختاریافته
    def _product_item(self, p):
        return {'kind': 'product', 'id': p.id, 'slug': p.slug, 'name': p.name,
                'price': p.price, 'final_price': p.final_price if hasattr(p, 'final_price')
                else _calc_final(p), 'discount_percent': p.discount_percent,
                'image_url': p.image_url or '', 'short_desc': p.short_desc or '',
                'rating': round(getattr(p, 'rating', 0) or 0, 1)}

    def _course_item(self, c):
        return {'kind': 'course', 'id': c.id, 'title': c.title, 'level': c.level or '',
                'duration': c.duration or '', 'category': c.category or '',
                'thumbnail_url': c.thumbnail_url or '', 'desc': (c.description or '')[:120]}

    def _article_item(self, a):
        return {'kind': 'article', 'id': a.id, 'slug': a.slug, 'title': a.title,
                'excerpt': a.excerpt or '', 'cover_url': a.cover_url or ''}


def _calc_final(p):
    try:
        d = int(p.discount_percent or 0)
        return int(p.price * (100 - d) / 100) if d else int(p.price)
    except (ValueError, TypeError):
        return int(p.price)


def to_fa(num):
    """تبدیل ارقام لاتین به فارسی"""
    return str(num).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))
