"""
services/chat_service.py — round-12 rewrite
دستیار هوشمند ماه‌افزار — مبتنی بر دیتابیس واقعی:
  • محصولات فروشگاه (ShopProduct): استعلام قیمت + راهنمای سفارش
  • دوره‌های آموزشی (Course): درخواست آموزش
  • مقالات (ShopArticle): جستجوی مقاله
round-12 (جدید):
  • حافظه مکالمه (session store) — «چت ادامه دارد»: محصولاتی که آخرین بار نشان داده شد
    به‌خاطر سپرده می‌شود و با «همینو بگذار تو سبد» همان محصول منظور است
  • فرایند کامل خرید در چت: افزودن به سبد، مشاهده سبد، تسویه/پرداخت
  • نظرسنجی گرافیکی: امتیازدهی به هر پاسخ (ستاره) + نظرسنجی چندمرحله‌ای کامل (ایموجی/ستاره/متن)
ساختار پاسخ: dict = {'text', 'items', 'actions', 'survey'} — سازگار با پاسخ متنی قدیمی
"""

import re
import time
import uuid
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
    # round-12 — واژه‌های سبد/پرداخت هم نباید «موضوع جستجو» شوند
    'سبد', 'سبدم', 'سبدت', 'اضافه', 'اضافهش', 'بگذار', 'بگذارش', 'پرداخت',
    'تسویه', 'نهایی', 'همینو', 'همونو', 'واردش',
    'کالا', 'کالای', 'جنس', 'جنسی', 'بنویس', 'بگید', 'بگو',
}

# ضمایر و ترتیب‌ها برای ارجاع به محصولات قبلی مکالمه
_PRONOUN_THIS = {'همین', 'همون', 'همینو', 'همونو', 'همینرو', 'همونو', 'خودش', 'همان'}
_ORDINAL_MAP = {'اولی': 0, 'اولین': 0, 'دومی': 1, 'دوومی': 1, 'سومی': 2, 'چهارمی': 3}


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


def _new_id(prefix):
    return f'{prefix}_{uuid.uuid4().hex[:10]}'


# ---------- نگاشت مدل‌ها (import دیرهنگام برای پرهیز از import cycle) ----------
def _shop_models():
    from routes.shop import ShopProduct, ShopArticle
    return ShopProduct, ShopArticle


class ChatService:
    SESSION_TTL = 60 * 60 * 2   # دو ساعت حافظه مکالمه

    def __init__(self):
        self.greeting = ('سلام! من دستیار هوشمند ماه‌افزار هستم 🌙\n'
                         'می‌تونم قیمت محصولات رو بگم، سفارش و خرید رو همون‌جا تو چت انجام بدم، '
                         'آموزش معرفی کنم و از مقالات جواب بدم.')
        self.capabilities_hint = (
            'می‌تونم این کارها رو انجام بدم:\n'
            '• استعلام قیمت محصول — مثلا: «قیمت ربات ارسال مرسوله چنده؟»\n'
            '• خرید در چت — مثلا: «همینو بگذار تو سبد» یا «می‌خوام چت‌بات پشتیبانی رو سفارش بدم»\n'
            '• پرداخت و تسویه — مثلا: «بریم پرداخت» یا «سبد خرید من»\n'
            '• معرفی دوره‌های آموزشی — مثلا: «دنبال آموزش پایتون هستم»\n'
            '• جستجوی مقالات — مثلا: «مقاله‌ای درباره فروش آنلاین»\n'
            '• نظرسنجی — بنویسید «نظرسنجی» تا به پاسخ‌ها امتیاز بدید'
        )
        # حافظه مکالمه: session_id -> state
        self._sessions = {}

    # ------------------------------------------------- حافظه مکالمه
    def _session(self, session_id):
        now = time.time()
        # پاکسازی جلسه‌های منقضی
        stale = [k for k, v in self._sessions.items() if now - v.get('ts', 0) > self.SESSION_TTL]
        for k in stale:
            self._sessions.pop(k, None)
        st = self._sessions.get(session_id) if session_id else None
        if st is None:
            st = {'last_products': [], 'last_product': None, 'survey': None, 'ts': now}
            if session_id:
                self._sessions[session_id] = st
        st['ts'] = now
        return st

    def _remember_products(self, st, product_items):
        if product_items:
            st['last_products'] = product_items[:5]
            # برترین نتیجه همیشه به‌خاطر سپرده می‌شود تا «بگذارش تو سبد» بدون تردید همان را اضافه کند
            st['last_product'] = product_items[0]

    # ------------------------------------------------- API
    def get_response(self, message, session_id=None):
        """خروجی: (dict{text,items,actions,survey}, sources)"""
        try:
            st = self._session(session_id)
            reply, sources = self._respond(message, st)
            # پیوست نظرسنجی گرافیکی به پاسخ‌های محتوایی (محصول/دوره/مقاله)
            if reply.get('items') and not reply.get('survey'):
                reply['survey'] = {
                    'id': _new_id('ans'),
                    'type': 'answer',
                    'style': 'stars',
                    'question': 'آیا این پاسخ مفید بود؟',
                }
            return reply, sources
        except Exception:  # fail-safe: هیچ‌وقت 500 برنگردان
            return ({'text': 'متاسفانه در پردازش پیام خطایی پیش آمد. لطفا دوباره تلاش کنید.',
                     'items': [], 'actions': [], 'survey': None}, [])

    def survey_answered(self, session_id, survey_id, rating, question=''):
        """ثبت امتیاز نظرسنجی (از endpoint بازخورد) — جلو بردن جریان نظرسنجی چندمرحله‌ای.
        هر مرحله id یکتا دارد (sid برای مرحله ۱، sid_s1 برای مرحله ۲) تا UI درست رندر شود.
        خروجی: {'done': bool, 'next': survey_obj|None, 'thanks': str}"""
        st = self._session(session_id)
        flow = st.get('survey') if isinstance(st.get('survey'), dict) else None
        if flow and (flow.get('sid') == survey_id or str(survey_id).startswith(str(flow.get('sid', '§')) + '_')):
            flow['answers'].append({'step': flow.get('step', 0), 'rating': rating})
            step = flow.get('step', 0)
            if step == 0:
                flow['step'] = 1
                return {'done': False, 'next': {
                    'id': flow['sid'] + '_s1', 'type': 'survey', 'step': 1, 'style': 'stars',
                    'question': 'کیفیت و دقت پاسخ‌ها رو چطور امتیاز می‌دید؟',
                }, 'thanks': 'ممنون! فقط دو سوال کوتاه مونده 🙏'}
            flow['step'] = 2
            flow['await_comment'] = True
            st['survey'] = flow
            return {'done': False, 'next': None,
                    'thanks': ('عالی! سوال آخر: چه چیزی رو در چت دوست دارید بهتر بشه؟ '
                               'بنویسید — یا «رد شدن» رو بزنید.'),
                    'skip_text': 'رد شدن'}
        return {'done': True, 'next': None, 'thanks': 'ممنون از بازخوردتون! 🌸 به پاسخ‌های بعدی دقت می‌کنم.'}

    def consume_survey_comment(self, session_id, message):
        """اگر پیام جواب سوال متنی نظرسنجی باشد ثبت می‌شود.
        خروجی: None (در انتظار نظر نیستیم) | 'comment' (نظر ثبت شد) | 'cancel' (سوال جدید — نظرسنجی بسته شد)"""
        st = self._session(session_id)
        flow = st.get('survey') if isinstance(st.get('survey'), dict) else None
        if not (flow and flow.get('await_comment')):
            return None
        n = _norm(message)
        # اگر پیام یک درخواست/سوال جدید است، نظرسنجی را تمام کن و پیام را عادی پردازش کن
        if (any(w in n for w in ['قیمت', 'سفارش', 'سبد', 'اموزش', 'دوره', 'مقاله', 'نظرسنجی',
                                 'سلام', 'چنده', 'چقدر', 'پرداخت', 'تسویه']) or len(n) > 120):
            flow['await_comment'] = False
            flow['answers'].append({'step': 2, 'rating': 0, 'comment': ''})
            st['survey'] = None
            return 'cancel'
        flow['await_comment'] = False
        skipped = any(w in n for w in ['رد شدن', 'ردش کن', 'نمیخوام', 'نه']) 
        flow['answers'].append({'step': 2, 'rating': 0, 'comment': '' if skipped else (message or '')[:500]})
        st['survey'] = None
        return 'comment'

    # ------------------------------------------------- هسته
    def _respond(self, message, st):
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

        # --- شروع نظرسنجی
        if any(w in n for w in ['نظرسنجی', 'نظر سنجی', 'نظرسنجیت', 'رضایتمندی', 'نظراتون رو بگم', 'امتیاز بدم']):
            return self._survey_start(st)

        # --- نیت‌ها
        price_intent = any(w in n for w in ['قیمت', 'چنده', 'چقدر', 'هزینه', 'بهای', 'نرخ', 'چند در میاد', 'چند میشه'])
        order_intent = any(w in n for w in ['سفارش', 'بخرم', 'خرید', 'میخرم', 'خریدارم', 'ثبت سفارش', 'خريد'])
        train_intent = any(w in n for w in ['اموزش', 'دوره', 'یاد', 'کلاس', 'مدرک', 'تدریس'])
        article_intent = any(w in n for w in ['مقاله', 'بلاگ', 'نوشته', 'خبر', 'وبلاگ'])
        help_intent = any(w in n for w in ['کمک', 'راهنما', 'چیکار', 'چه کاری', 'امکانات', 'بلدی'])

        if help_intent:
            return ({'text': self.capabilities_hint,
                     'items': [], 'actions': self._default_actions()}, [])

        # --- round-12: افزودن به سبد (اولویت بالاتر از سایر نیت‌ها)
        # اشاره‌ی خالص به محصول قبلی («دومی»، «همینو بگذار») هم افزودن به سبد حساب می‌شود
        pure_referral = (len(n.split()) <= 4 and
                         any(w in _ORDINAL_MAP or w in _PRONOUN_THIS for w in n.split()))
        cart_add = pure_referral or \
            ('سبد' in n and any(w in n for w in ['بگذار', 'اضافه', 'بردار', 'وارد', 'بزار', 'بنداز', 'قرار بده', 'بخورون'])) or \
            any(w in n for w in ['به سبد', 'تو سبد', 'در سبد', 'سبدم', 'سبد خریدم', 'بگذار', 'اضافه کن', 'اضافهش کن', 'بزار تو', 'بخرش', 'بخر برام', 'برام بخر', 'ثبتش کن', 'همینو بخر', 'همینو میخوام', 'میخوامش', 'بخرش برام'])
        cart_view = 'سبد' in n and any(w in n for w in ['سبد من', 'سبدم چی', 'سبد چی', 'نمایش سبد', 'ببین سبد', 'سبد خرید من'])
        checkout = any(w in n for w in ['پرداخت', 'تسویه', 'نهایی کن', 'نهایی کنم', 'بریم پرداخت'])

        if cart_add:
            return self._cart_add_reply(toks, raw, st)

        if cart_view:
            return ({'text': ('سبد خرید شما روی همین دستگاه ذخیره می‌شه — با دکمه زیر بازش کنید.\n'
                              'بعد از باز کردن سبد، مراحل: تکمیل اطلاعات ← پرداخت ← دریافت فوری لایسنس.'),
                     'items': [],
                     'actions': [{'label': '🛒 مشاهده سبد خرید', 'type': 'link', 'to': '/cart'},
                                 {'label': 'تسویه حساب', 'type': 'link', 'to': '/checkout'}],
                     }, [])

        if checkout:
            return ({'text': ('عالیه! برای نهایی کردن خرید:\n'
                              '۱) سبد خریدتون رو چک کنید\n'
                              '۲) اطلاعات و روش پرداخت رو تکمیل کنید\n'
                              '۳) بعد از پرداخت، فایل و لایسنس بلافاصله صادر می‌شه.'),
                     'items': [],
                     'actions': [{'label': '🛒 رفتن به سبد خرید', 'type': 'link', 'to': '/cart'},
                                 {'label': '💳 تکمیل خرید و پرداخت', 'type': 'link', 'to': '/checkout'}],
                     }, [])

        # --- ۱) استعلام قیمت / سفارش محصول
        if price_intent or order_intent:
            products = self._find_products(toks, raw)
            self._remember_products(st, products)
            if products:
                if price_intent:
                    return self._price_reply(products)
                return self._order_reply(products)
            # نیت قیمت/سفارش بدون محصول شناخته‌شده — پیشنهاد پرفروش‌ها هم در حافظه می‌ماند
            # تا «همینو بگذار تو سبد» بعد از پیشنهاد، همان اولی را اضافه کند
            suggestions = self._top_products(4)
            self._remember_products(st, suggestions)
            return ({'text': ('دقیق متوجه نشدم کدوم محصول مد نظرتونه. '
                              'اسم محصول رو کامل بنویسید — مثلا: «قیمت ربات ارسال مرسوله چنده؟» '
                              'یا از فروشگاه، لیست کامل رو ببینید.'),
                     'items': suggestions,
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
            return self._topic_fallback(toks, st, 'آموزش')

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
            return self._topic_fallback(toks, st, 'مقاله')

        # --- ۴) جستجوی عمومی (بدون نیت مشخص) — فقط تطبیق عنوان تا false-positive نشود
        products = self._find_products(toks, raw, min_score=4)
        if products:
            self._remember_products(st, products)
            p = products[0]
            price_line = f'قیمت «{p["name"]}»: {toman(p["final_price"])} تومان'
            if p['discount_percent']:
                price_line += f' (با {to_fa(p["discount_percent"])}٪ تخفیف)'
            return ({'text': price_line + '\nاگر بخواهید بگید «بگذارش تو سبد» تا خودم براتون اضافه کنم 😊',
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

        return self._topic_fallback(toks, st)

    # ------------------------------------------------- round-12: خرید در چت
    def _strict_product_match(self, toks, raw):
        """تطبیق سخت‌گیرانه برای افزودن به سبد — فقط نام محصول، نه کلیدواژه‌های توضیحات.
        (تا «کالا» یا «سبد» اشتباهاً محصولی را صدا نزند)"""
        ShopProduct, _ = _shop_models()
        try:
            rows = ShopProduct.query.filter_by(is_active=True).limit(200).all()
        except Exception:
            return []
        n_raw = _norm(raw)
        exact = [p for p in rows if len(_norm(p.name)) >= 5 and _norm(p.name) in n_raw]
        if exact:
            best = max(exact, key=lambda p: len(_norm(p.name)))
            return [self._product_item(best)]
        hits = []
        for p in rows:
            title = _norm(p.name)
            cnt = sum(1 for w in toks if len(w) >= 3 and w in title)
            if cnt >= 2:  # دست‌کم دو واژه از پیام در «عنوان» باشد
                hits.append((cnt, p))
        hits.sort(key=lambda x: (-x[0], -(x[1].sales_count or 0)))
        return [self._product_item(p) for _, p in hits[:4]]

    def _cart_add_reply(self, toks, raw, st):
        """افزودن محصول به سبد — با ارجاع به مکالمه قبلی (همینو/دومی/...) یا اسم صریح"""
        # ۱) اسم صریح محصول در پیام (تطبیق سخت‌گیرانه)
        picked = self._strict_product_match(toks, raw)
        if len(picked) > 1:
            return self._choice_reply(picked)  # چند محصول صریح — کاربر انتخاب کند

        # ۲) ترتیب‌ها: اولی/دومی
        if not picked:
            last = st.get('last_products') or []
            for w in _ORDINAL_MAP:
                if w in _norm(raw) and len(last) > _ORDINAL_MAP[w]:
                    picked = [last[_ORDINAL_MAP[w]]]
                    break

        # ۳) «هر دو» / «همه»
        if not picked:
            last = st.get('last_products') or []
            if len(last) >= 2 and any(w in _norm(raw) for w in ['هر دو', 'هرتا', 'هر دو تا', 'همه شون', 'هر دو تا رو']):
                picked = last[:2]

        # ۴) آخرین محصول مکالمه (برترین نتیجه قبلی) — «بگذارش تو سبد» بعد از استعلام قیمت
        if not picked and st.get('last_product'):
            picked = [st['last_product']]

        # ۵) هیچ‌کدام → راهنما
        if not picked:
            last = st.get('last_products') or []
            if len(last) > 1:
                return self._choice_reply(last)
            return ({'text': ('فعلاً چیزی برای افزودن به سبد ندارم 😅\n'
                              'اول محصول رو بگید — مثلا: «قیمت ربات تلگرام چنده؟» — '
                              'بعد بگید «بگذارش تو سبد» تا براتون اضافه کنم.'),
                     'items': self._top_products(3),
                     'actions': [{'label': 'مشاهده فروشگاه', 'type': 'link', 'to': '/shop'}],
                     }, [])

        # پاسخ موفق — افزودن واقعی سمت کاربر با actions auto انجام می‌شود
        if len(picked) == 1:
            p = picked[0]
            text = (f'انجام شد! «{p["name"]}» رو به سبد خریدت اضافه کردم ✅\n'
                    f'قیمت نهایی: {toman(p["final_price"])} تومان\n'
                    'برای نهایی کردن خرید، دکمه «تسویه حساب» رو بزنید.')
        else:
            names = ' و '.join(f'«{p["name"]}»' for p in picked)
            total = sum(p['final_price'] for p in picked)
            text = (f'انجام شد! {names} رو به سبد اضافه کردم ✅\n'
                    f'جمع: {toman(total)} تومان — برای تکمیل خرید، تسویه حساب رو بزنید.')
        actions = [{'label': f'افزودن: {p["name"]}', 'type': 'add_to_cart', 'slug': p['slug'], 'auto': True,
                    'product': p}
                   for p in picked]
        actions += [{'label': '🛒 مشاهده سبد', 'type': 'link', 'to': '/cart'},
                    {'label': '💳 تسویه حساب و پرداخت', 'type': 'link', 'to': '/checkout'}]
        return ({'text': text, 'items': [], 'actions': actions},
                [p['name'] for p in picked])

    def _choice_reply(self, candidates):
        """کدام یکی از محصولات قبلی منظور است؟ — چیپ‌های شماره‌دار"""
        lines = ['کدوم یکی از این‌ها رو بگذارم تو سبد؟']
        actions = []
        for i, p in enumerate(candidates[:4]):
            lines.append(f'{to_fa(i + 1)}) {p["name"]} — {toman(p["final_price"])} تومان')
            # نکته: auto نیست — کاربر باید خودش یکی را انتخاب کند
            actions.append({'label': f'{to_fa(i + 1)}) {p["name"]}', 'type': 'add_to_cart',
                            'slug': p['slug'], 'auto': False, 'product': p})
        actions.append({'label': 'هیچ‌کدام، فروشگاه رو نشونم بده', 'type': 'link', 'to': '/shop'})
        return ({'text': '\n'.join(lines) + '\n(روی گزینه بزنید یا بنویسید «اولی» یا «دومی»)',
                 'items': candidates[:4], 'actions': actions},
                [p['name'] for p in candidates[:4]])

    # ------------------------------------------------- round-12: نظرسنجی
    def _survey_start(self, st):
        sid = _new_id('sv')
        st['survey'] = {'sid': sid, 'step': 0, 'answers': [], 'await_comment': False}
        return ({'text': ('نظرسنجی کوتاه و خوشمزه 🍬 (۳ سوال)\n'
                          'نظرتون کمک می‌کنه دستیار رو بهتر کنم:'),
                 'items': [],
                 'actions': [],
                 'survey': {
                     'id': sid, 'type': 'survey', 'step': 0, 'style': 'emoji',
                     'question': 'تجربه کلی شما از گفتگو با من چطور بود؟',
                     'options': [
                         {'emoji': '😍', 'label': 'عالی', 'value': 5},
                         {'emoji': '🙂', 'label': 'خوب', 'value': 4},
                         {'emoji': '😐', 'label': 'معمولی', 'value': 3},
                         {'emoji': '🙁', 'label': 'ضعیف', 'value': 2},
                     ],
                 }}, [])

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
            lines.append('اگر بخواهید بگید «بگذارش تو سبد» تا خودم براتون اضافه کنم 😊')
        else:
            lines.append(f'{to_fa(len(products))} محصول مرتبط پیدا کردم:')
            for it in products:
                lines.append(f'• {it["name"]} — {toman(it["final_price"])} تومان')
            lines.append('روی هر کارت بزنید تا جزئیات کامل رو ببینید — یا بگید «بگذارش تو سبد».')
        return ({'text': '\n'.join(lines),
                 'items': products,
                 'actions': [{'label': 'مشاهده فروشگاه', 'type': 'link', 'to': '/shop'}],
                 }, [it['name'] for it in products])

    def _order_reply(self, products):
        p = products[0]
        if len(products) == 1:
            text = (f'«{p["name"]}» الان موجوده — {toman(p["final_price"])} تومان.\n'
                    f'همون‌جا تو چت می‌تونم براتون به سبد اضافه کنم؛ کافیه بگید «بگذارش تو سبد» ✅\n'
                    'یا از دکمه‌های زیر استفاده کنید.')
        else:
            text = ('این محصولات مرتبط رو پیدا کردم.\n'
                    'هر کدوم رو خواستید بگید «بگذارش تو سبد» یا اسمش رو بنویسید.')
        return ({'text': text,
                 'items': products,
                 'actions': [{'label': 'افزودن به سبد', 'type': 'add_to_cart', 'slug': p['slug']},
                             {'label': 'سبد خرید', 'type': 'link', 'to': '/cart'},
                             {'label': 'مشاهده محصول', 'type': 'link', 'to': f'/product/{p["slug"]}'}],
                 }, [it['name'] for it in products])

    def _topic_fallback(self, toks, st=None, kind=None):
        prefix = (f'در مورد «{" ".join(toks[:4])}» مطلب دقیقی پیدا نکردم.'
                  if toks else 'متوجه نشدم چی می‌خواهید.')
        suggestions = self._top_products(3)
        # پیشنهادها هم حافظه می‌شوند تا «همینو بگذار تو سبد» بعد از fallback کار کند
        if st is not None:
            self._remember_products(st, suggestions)
        return ({'text': prefix + '\n' + self.capabilities_hint,
                 'items': suggestions,
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
