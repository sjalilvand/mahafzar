# -*- coding: utf-8 -*-
from app import create_app
app, _ = create_app()
with app.app_context():
    from routes.shop import (ShopCategory, ShopProduct, ShopArticle,
                             ShopReview, ShopBundle)
    from models import db
    from datetime import datetime, timedelta
    import json
    cats = {'cat-sw': 'نرم‌افزارهای مهندسی', 'cat-ai': 'ابزارهای هوش مصنوعی', 'cat-plugin': 'پلاگین و افزونه'}
    for slug, name in cats.items():
        if not ShopCategory.query.filter_by(slug=slug).first():
            db.session.add(ShopCategory(name=name, slug=slug))
    db.session.commit()
    sw = ShopCategory.query.filter_by(slug='cat-sw').first()
    ai = ShopCategory.query.filter_by(slug='cat-ai').first()
    pl = ShopCategory.query.filter_by(slug='cat-plugin').first()
    demo = [
        ('سامانه تصمیم‌یار رَسا', 'cat-sw', 48000000, 15, 'پلتفرم تحلیل داده و تصمیم‌یاری سازمانی با موتور هوش مصنوعی'),
        ('موتور بهینه‌سازی آنتن MahAI Core', 'cat-ai', 75000000, 20, 'بهینه‌سازی سامانه‌های RF با الگوریتم‌های تکاملی'),
        ('داشبورد هوشمند گزارش‌سازی', 'cat-sw', 22000000, 0, 'گزارش‌ساز زنده متصل به منابع داده سازمانی'),
        ('چت‌بات پشتیبانی هوشمند', 'cat-ai', 15000000, 30, 'ربات پشتیبانی فارسی با یادگیری از تاریخچه تیکت‌ها'),
        ('افزونه گزارش‌گیر حرفه‌ای', 'cat-plugin', 4500000, 10, 'ماژول گزارش‌گیری پیشرفته برای سامانه‌های موجود'),
        ('پکیج شبیه‌سازی صنعتی', 'cat-sw', 60000000, 25, 'شبیه‌سازی فرآیندهای صنعتی با مدل‌های آماری'),
    ]
    for name, cslug, price, disc, sd in demo:
        if not ShopProduct.query.filter_by(name=name).first():
            c = ShopCategory.query.filter_by(slug=cslug).first()
            db.session.add(ShopProduct(name=name, slug=name.replace(' ', '-'), short_desc=sd,
                                       description=sd + '. این نسخه شامل نصب، راه‌اندازی و ۶ ماه پشتیبانی است.',
                                       price=price, discount_percent=disc, category_id=c.id if c else None,
                                       featured=True, is_active=True))
    db.session.commit()
    p1 = ShopProduct.query.filter_by(name='چت‌بات پشتیبانی هوشمند').first()
    if p1 and not p1.flash_until:
        p1.flash_until = datetime.utcnow() + timedelta(hours=48)
        db.session.commit()
    arts = [
        ('چگونه هوش مصنوعی هزینه‌های سازمان را ۳۰٪ کاهش می‌دهد', 'مروری کاربردی بر صرفه‌جویی واقعی با اتوماسیون هوشمند'),
        ('راهنمای انتخاب سامانه تصمیم‌یار برای مدیران', 'معیارهای کلیدی پیش از خرید سامانه‌های BI و تصمیم‌یار'),
        ('۵ اشتباه رایج در پیاده‌سازی چت‌بات فارسی', 'از نبود داده تمیز تا انتظارات غیرواقعی'),
    ]
    for t, ex in arts:
        if not ShopArticle.query.filter_by(title=t).first():
            db.session.add(ShopArticle(title=t, slug=t.replace(' ', '-'), excerpt=ex,
                                       body=ex + '.\n\nاین یک مقاله نمونه است — از پنل مدیریت فروشگاه می‌توانید متن کامل را ویرایش کنید.',
                                       is_published=True))
    db.session.commit()
    # ---- demo star ratings (so cards show stars out of the box) ----
    demo_reviews = {
        'سامانه تصمیم‌یار رَسا': [(5, 'برای اتاق فکر ما فوق‌العاده بود؛ گزارش‌ها دقیق و سریع است.', 'مهندس رضایی'),
                                 (4, 'پایدار و حرفه‌ای، فقط آموزش اولیه کمی بیشتر وقت می‌برد.', 'شرکت داده‌پرداز'),
                                 (5, 'پشتیبانی واقعا پاسخگوست. پیشنهاد می‌کنم.', 'مدیر فنی آریا')],
        'موتور بهینه‌سازی آنتن MahAI Core': [(5, 'نتیجه بهینه‌سازی نسبت به روش دستی چشمگیر بود.', 'دکتر محمدی'),
                                             (4, 'ابزار قدرتمندی است؛ مستندات خوبی هم دارد.', 'تیم RF پارس')],
        'داشبورد هوشمند گزارش‌سازی': [(4, 'اتصال به دیتابیس‌های ما راحت انجام شد.', 'کارشناس BI'),
                                      (5, 'گزارش‌های لحظه‌ای عالی برای جلسات مدیریتی.', 'سازمان فلزات')],
        'چت‌بات پشتیبانی هوشمند': [(5, 'بیش از ۶۰٪ تیکت‌ها خودکار پاسخ داده می‌شود!', 'فروشگاه آنلاین نور'),
                                   (4, 'فهم زبان فارسی‌اش خیلی خوب است.', 'پشتیبان نت')],
        'افزونه گزارش‌گیر حرفه‌ای': [(5, 'دقیقا همان چیزی بود که سامانه ما کم داشت.', 'مهندس کریمی'),
                                     (4, 'نصب ساده، خروجی‌های تمیز.', 'کاربر سازمانی')],
        'پکیج شبیه‌سازی صنعتی': [(5, 'شبیه‌سازی خط تولید ما را دقیق پیش‌بینی کرد.', 'شرکت صنعتی بهسان'),
                                 (5, 'ارزش خرید دارد؛ پشتیبانی هم عالی است.', 'مدیر کارخانه'),
                                 (4, 'پرکاربرد ولی نیاز به سیستم قوی دارد.', 'کارشناس برنامه‌ریزی')],
    }
    for pname, revs in demo_reviews.items():
        p = ShopProduct.query.filter_by(name=pname).first()
        if not p:
            continue
        for i, (stars, cmt, uname) in enumerate(revs):
            uid = 900000 + p.id * 10 + i  # pseudo demo users (no login required to seed)
            if ShopReview.query.filter_by(product_id=p.id, user_id=uid).first():
                continue
            db.session.add(ShopReview(product_id=p.id, user_id=uid, username=uname,
                                      rating=stars, comment=cmt,
                                      created_at=datetime.utcnow() - timedelta(days=3 * i + 2)))
    db.session.commit()

    # ---- demo discount bundles (buy-together & save) ----
    def _pids(names):
        ids = []
        for n in names:
            pp = ShopProduct.query.filter_by(name=n).first()
            if pp: ids.append(pp.id)
        return ids

    bundles = [
        ('پکیج استارتاپ هوشمند', ['چت‌بات پشتیبانی هوشمند', 'داشبورد هوشمند گزارش‌سازی', 'افزونه گزارش‌گیر حرفه‌ای'],
         10, 'سه ابزار ضروری راه‌اندازی پشتیبانی و گزارش‌سازی هوشمند با تخفیف خرید همزمان.'),
        ('پکیج کامل سازمانی', ['سامانه تصمیم‌یار رَسا', 'موتور بهینه‌سازی آنتن MahAI Core', 'پکیج شبیه‌سازی صنعتی'],
         15, 'راهکار کامل تصمیم‌یاری و بهینه‌سازی برای سازمان‌های بزرگ — صرفه‌جویی ویژه.'),
    ]
    for title, names, disc, desc in bundles:
        if not ShopBundle.query.filter_by(title=title).first():
            db.session.add(ShopBundle(title=title, slug=title.replace(' ', '-'), description=desc,
                                      discount_percent=disc, product_ids=json.dumps(_pids(names)),
                                      is_active=True))
    db.session.commit()

    print('SEED_SHOP_OK products=%d articles=%d cats=%d reviews=%d bundles=%d' % (
        ShopProduct.query.count(), ShopArticle.query.count(), ShopCategory.query.count(),
        ShopReview.query.count(), ShopBundle.query.count()))
