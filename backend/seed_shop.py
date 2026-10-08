# -*- coding: utf-8 -*-
from app import create_app
app, _ = create_app()
with app.app_context():
    from routes.shop import ShopCategory, ShopProduct, ShopArticle
    from models import db
    from datetime import datetime, timedelta
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
    print('SEED_SHOP_OK products=%d articles=%d cats=%d' % (
        ShopProduct.query.count(), ShopArticle.query.count(), ShopCategory.query.count()))
