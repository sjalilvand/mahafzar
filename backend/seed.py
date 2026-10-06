from app import app
from extensions import db
from models import User, Member, Tutorial, Mission
from werkzeug.security import generate_password_hash
from utils import slugify

with app.app_context():
    db.create_all()

    if not User.query.filter_by(email='admin@mah-afzar.ir').first():
        admin = User(
            full_name='مدیر سیستم',
            email='admin@mah-afzar.ir',
            phone='09120000000',
            password_hash=generate_password_hash('123456'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()

    admin = User.query.filter_by(email='admin@mah-afzar.ir').first()

    if Member.query.count() == 0:
        db.session.add(Member(
            name='علی رضایی',
            position='مدیرعامل',
            bio='متخصص توسعه سامانه‌های هوشمند سازمانی و راهکارهای تصمیم‌یار.',
            email='ali@mah-afzar.ir',
            display_order=1
        ))
        db.session.add(Member(
            name='سارا محمدی',
            position='مدیر فنی',
            bio='متخصص معماری نرم‌افزار، تحلیل داده و طراحی زیرساخت‌های مقیاس‌پذیر.',
            email='sara@mah-afzar.ir',
            display_order=2
        ))
        db.session.add(Member(
            name='محمد کاظمی',
            position='کارشناس هوش مصنوعی',
            bio='فعال در زمینه مدل‌های یادگیری ماشین و پردازش داده.',
            email='m.kazemi@mah-afzar.ir',
            display_order=3
        ))

    if Mission.query.count() == 0:
        db.session.add(Mission(
            title='مأموریت شرکت',
            content='تبدیل داده‌های خام به دانش عملیاتی و تصمیم‌های قابل اتکا برای سازمان‌ها.',
            type='mission'
        ))
        db.session.add(Mission(
            title='چشم‌انداز',
            content='تبدیل شدن به یکی از بازیگران برجسته توسعه سامانه‌های هوشمند سازمانی در کشور.',
            type='vision'
        ))
        db.session.add(Mission(
            title='ارزش‌های کلیدی',
            content='شفافیت، امنیت داده، نوآوری، پایداری، و تمرکز بر حل مسئله.',
            type='values'
        ))
        db.session.add(Mission(
            title='نحوه دسترسی به داده',
            content='داده‌های ثبت‌شده کاربران صرفاً برای ارائه خدمات، ارتباط با مشتری، بهبود تجربه کاربری و تحلیل داخلی استفاده می‌شوند. دسترسی به داده‌ها بر اساس نقش کاربری کنترل شده و فقط افراد مجاز امکان مشاهده یا مدیریت داده‌های مشخص را خواهند داشت.',
            type='data_access'
        ))

    if Tutorial.query.count() == 0:
        tutorials = [
            {
                'title': 'مقدمه‌ای بر تحلیل داده در سازمان',
                'summary': 'آشنایی اولیه با تحلیل داده برای مدیران و کارشناسان سازمانی.',
                'content': 'در این آموزش با مفاهیم پایه تحلیل داده، چرخه داده، کاربرد داشبوردها و اهمیت تصمیم‌گیری داده‌محور آشنا می‌شوید.',
                'category': 'تحلیل داده',
                'tags': 'تحلیل داده, داشبورد, سازمان',
            },
            {
                'title': 'آشنایی با سامانه‌های تصمیم‌یار',
                'summary': 'مروری بر ساختار و مزایای سامانه‌های تصمیم‌یار در سازمان‌های بزرگ.',
                'content': 'سامانه‌های تصمیم‌یار به مدیران کمک می‌کنند تا با تکیه بر تحلیل داده و مدل‌های پیش‌بینی، تصمیم‌های دقیق‌تری بگیرند.',
                'category': 'هوش تجاری',
                'tags': 'تصمیم‌یار, BI, مدیریت',
            },
            {
                'title': 'مبانی امنیت داده در سامانه‌های سازمانی',
                'summary': 'نکات کلیدی برای حفاظت از داده‌های حساس در زیرساخت‌های نرم‌افزاری.',
                'content': 'در این مطلب، لایه‌های امنیتی، کنترل دسترسی، ثبت رویدادها و استانداردهای مهم امنیت اطلاعات مرور می‌شوند.',
                'category': 'امنیت',
                'tags': 'امنیت, داده, کنترل دسترسی',
            }
        ]

        for item in tutorials:
            db.session.add(Tutorial(
                title=item['title'],
                slug=slugify(item['title']),
                summary=item['summary'],
                content=item['content'],
                category=item['category'],
                tags=item['tags'],
                author_id=admin.id,
                is_published=True
            ))

    db.session.commit()
    print('Seed completed successfully.')
