import os
from dotenv import load_dotenv
load_dotenv()
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from models import db

# Import all namespaces
from routes.auth import auth_ns
from routes.courses import courses_ns
from routes.members import members_ns
from routes.missions import missions_ns
from routes.chat import chat_ns
from routes.suggestions import suggestions_ns
from routes.data_access import data_ns
from routes.profile import profile_ns
from routes.upload import upload_ns
from routes.analytics import analytics_ns
from routes.quiz import quiz_ns
from routes.gamification import gamification_ns
from routes.forum import forum_ns
from routes.payments import payments_ns
from routes.recommendations import rec_ns
from routes.ab_testing import ab_ns
from routes.admin import admin_ns  # admin panel

def create_app():
    app = Flask(__name__)
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response
    # Security Config
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or ('dev-' + os.urandom(24).hex())
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or ('dev-' + os.urandom(24).hex())
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=int(os.environ.get('JWT_EXPIRE_DAYS', 7)))
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'

    # Database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///rasa_portal.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Extensions
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, resources={r"/api/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True,
        "expose_headers": ["Authorization"]
    }})
    jwt = JWTManager(app)
    db.init_app(app)
    socketio = SocketIO(app, cors_allowed_origins=CORS_ORIGINS)

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(cb):
        return jsonify({'message': 'توکن احراز هویت وجود ندارد'}), 401
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'توکن نامعتبر است'}), 422
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'توکن منقضی شده است'}), 401
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'توکن باطل شده است'}), 401
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'نیاز به توکن تازه است'}), 401

    # Register namespaces
    from flask_restx import Api
    api = Api(app, version='1.0', title='Rasa Portal API',
              description='Complete API for MahAfzar Hooshmand Rasa',
              doc=(None if os.environ.get('FLASK_ENV') == 'production' else '/api/docs'))

    api.add_namespace(auth_ns, path='/api/auth')
    api.add_namespace(courses_ns, path='/api/courses')
    api.add_namespace(members_ns, path='/api/members')
    api.add_namespace(missions_ns, path='/api/missions')
    api.add_namespace(chat_ns, path='/api/chat')
    api.add_namespace(suggestions_ns, path='/api/suggestions')
    api.add_namespace(data_ns, path='/api/data')
    api.add_namespace(profile_ns, path='/api/profile')
    api.add_namespace(upload_ns, path='/api/upload')
    api.add_namespace(analytics_ns, path='/api/analytics')
    api.add_namespace(quiz_ns, path='/api/quiz')
    api.add_namespace(gamification_ns, path='/api/gamification')
    api.add_namespace(forum_ns, path='/api/forum')
    api.add_namespace(payments_ns, path='/api/payments')
    api.add_namespace(rec_ns, path='/api/recommendations')
    api.add_namespace(ab_ns, path='/api/ab-testing')
    api.add_namespace(admin_ns, path='/api/admin')

    with app.app_context():
        db.create_all()
        seed_all()

    return app, socketio

def seed_all():
    from models import (User, Member, Mission, Course, DataAccess,
                        Badge, Achievement, LevelConfig, ForumCategory, ForumTag,
                        PaymentPlan, PaymentDiscount)
    from datetime import datetime

    # Admin & test user
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@mah-afzar.ir',
                     full_name='مدیر سیستم', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        print("✓ admin created (admin/admin123)")
    if not User.query.filter_by(username='user').first():
        user = User(username='user', email='user@mah-afzar.ir',
                    full_name='کاربر آزمایشی', role='user')
        user.set_password('user123')
        db.session.add(user)
        print("✓ test user created (user/user123)")

    # Members
    if Member.query.count() == 0:
        db.session.add_all([
            Member(name='دکتر علی محمدی', position='مدیرعامل', department='مدیریت',
                   bio='بیش از ۱۵ سال تجربه', skills='AI,Management', is_featured=True),
            Member(name='مریم حسینی', position='مدیر فنی', department='فنی',
                   bio='متخصص معماری', skills='Python,Cloud', is_featured=True),
            Member(name='سعید رضایی', position='توسعه‌دهنده ارشد', department='فنی',
                   bio='۱۰ سال تجربه', skills='React,Node.js', is_featured=True),
        ])
        print("✓ members seeded")

    # Missions
    if Mission.query.count() == 0:
        db.session.add_all([
            Mission(title='ماموریت ما', content='توانمندسازی سازمان‌ها با راهکارهای هوشمند',
                    mission_type='mission', order=1, icon='🎯'),
            Mission(title='چشم‌انداز', content='پیشرو در تحول دیجیتال خاورمیانه',
                    mission_type='vision', order=2, icon='🔭'),
            Mission(title='ارزش‌ها', content='نوآوری، شفافیت، تعهد',
                    mission_type='value', order=3, icon='💎'),
        ])
        print("✓ missions seeded")

    # Courses
    if Course.query.count() == 0:
        db.session.add_all([
            Course(title='مقدمات هوش مصنوعی', description='مفاهیم پایه AI',
                   category='هوش مصنوعی', level='beginner', duration='۸ ساعت',
                   content='<h2>مقدمه</h2><p>آموزش مفاهیم اولیه هوش مصنوعی...</p>'),
            Course(title='Python پیشرفته', description='مباحث پیشرفته پایتون',
                   category='برنامه‌نویسی', level='advanced', duration='۱۲ ساعت',
                   content='<h2>پیشرفته</h2><p>متاکلاس‌ها، دکوراتورها و...</p>'),
            Course(title='تحلیل داده با SQL', description='کار با پایگاه داده',
                   category='داده', level='intermediate', duration='۱۰ ساعت',
                   content='<h2>SQL</h2><p>جداول، JOIN، subquery...</p>'),
        ])
        print("✓ courses seeded")

    # Data Access
    if DataAccess.query.count() == 0:
        db.session.add_all([
            DataAccess(title='REST API', description='دسترسی API', access_type='API',
                       url='https://api.mah-afzar.ir'),
            DataAccess(title='داشبورد', description='داشبورد تحلیلی', access_type='Dashboard',
                       url='https://dash.mah-afzar.ir'),
            DataAccess(title='دانلود', description='مجموعه داده‌ها', access_type='Download',
                       url='https://data.mah-afzar.ir'),
        ])
        print("✓ data access seeded")

    # Gamification Seed
    if LevelConfig.query.count() == 0:
        levels = [
            (1,0,'تازه‌کار','🌱'),(2,100,'مبتدی','🌿'),(3,250,'آموزنده','📚'),
            (4,500,'کوشا','💪'),(5,1000,'دانشجو','🎓'),(10,2500,'متخصص','⭐'),
            (15,5000,'حرفه‌ای','💫'),(20,10000,'خبره','👑'),(25,20000,'استاد','🔥'),
            (30,40000,'نخبه','💎'),(40,80000,'افسانه‌ای','🚀'),(50,150000,'اسطوره','🏆')
        ]
        for lvl,xp,title,icon in levels:
            db.session.add(LevelConfig(level=lvl, xp_required=xp, title=title, icon=icon, perks='{}'))
    if Badge.query.count() == 0:
        badges = [
            ('اولین قدم','ثبت‌نام','👣','activity','signup',1,'common',5),
            ('ورود ۷ روز','استریک ۷ روز','🔥','activity','login_streak',7,'rare',30),
            ('ورود ۳۰ روز','استریک ۳۰ روز','💪','activity','login_streak',30,'epic',100),
            ('یادگیرنده','تکمیل ۵ دوره','📚','learning','course_complete',5,'rare',50),
            ('آزمون‌دهنده','قبولی ۱۰ آزمون','📝','learning','quiz_pass',10,'epic',80),
            ('نظر دهنده','۲۰ نظر','💬','social','comment_count',20,'rare',40),
            ('کامل‌کننده','پروفایل کامل','✅','activity','profile_complete',1,'common',15),
            ('جمع‌کننده','۱۰۰۰ امتیاز','💰','achievement','points_reach',1000,'epic',60),
            ('نخبه','۵۰۰۰ امتیاز','💎','achievement','points_reach',5000,'legendary',200),
            ('اولین آزمون','قبولی اولین آزمون','🎯','learning','quiz_pass',1,'common',20),
        ]
        for name,desc,icon,cat,type,val,rar,pts in badges:
            db.session.add(Badge(name=name,description=desc,icon=icon,category=cat,
                                 requirement_type=type,requirement_value=val,rarity=rar,points_reward=pts))
    if Achievement.query.count() == 0:
        db.session.add_all([
            Achievement(name='تازه‌کار',description='رسیدن به سطح ۵',icon='🌱',category='level',
                       target_type='points',target_value=1000,xp_reward=50),
            Achievement(name='حرفه‌ای',description='رسیدن به سطح ۱۵',icon='⭐',category='level',
                       target_type='points',target_value=5000,xp_reward=200),
            Achievement(name='یادگیرنده',description='قبولی ۵ آزمون',icon='📝',category='learning',
                       target_type='quizzes',target_value=5,xp_reward=100),
            Achievement(name='فعال',description='۱۰ نظر',icon='💬',category='social',
                       target_type='comments',target_value=10,xp_reward=50),
            Achievement(name='متعهد',description='۱۴ روز استریک',icon='🔥',category='activity',
                       target_type='streak',target_value=14,xp_reward=150),
        ])
    print("✓ gamification seeded")

    # Forum Seed
    if ForumCategory.query.count() == 0:
        db.session.add_all([
            ForumCategory(name='عمومی', description='گفتگوی آزاد', slug='general', icon='💬', color='#00f2ff', order=1),
            ForumCategory(name='هوش مصنوعی', description='AI و ML', slug='ai', icon='🤖', color='#4d4dff', order=2),
            ForumCategory(name='برنامه‌نویسی', description='کدنویسی', slug='programming', icon='💻', color='#0f0', order=3),
            ForumCategory(name='پیشنهادات', description='بازخورد', slug='feedback', icon='💡', color='#ffa500', order=4),
            ForumCategory(name='همکاری', description='هم‌تیمی', slug='collaboration', icon='🤝', color='#ff006e', order=5),
        ])
        print("✓ forum categories seeded")

    # Payment Seed (example plans)
    if PaymentPlan.query.count() == 0:
        import json
        db.session.add_all([
            PaymentPlan(name='پایه', description='دسترسی به دوره‌های مقدماتی', price=99000, duration_days=30,
                       features=json.dumps(['دسترسی به ۱۰ دوره', 'آزمون محدود', 'پشتیبانی تیکت']),
                       is_active=True, order=1),
            PaymentPlan(name='حرفه‌ای', description='دسترسی کامل', price=299000, duration_days=90,
                       features=json.dumps(['همه دوره‌ها', 'آزمون نامحدود', 'گواهینامه', 'پشتیبانی ویژه']),
                       is_active=True, is_popular=True, order=2),
            PaymentPlan(name='سازمانی', description='برای تیم‌ها', price=799000, duration_days=365,
                       features=json.dumps(['همه امکانات', 'API', 'مشاوره', 'پنل مدیریت']),
                       is_active=True, order=3),
        ])
        print("✓ payment plans seeded")

    if PaymentDiscount.query.count() == 0:
        db.session.add_all([
            PaymentDiscount(code='WELCOME10', description='۱۰٪ تخفیف خوش‌آمدگویی', discount_type='percentage',
                           discount_value=10, max_uses=100, min_amount=50000, is_active=True,
                           valid_until=datetime(2027,1,1)),
            PaymentDiscount(code='NOROOZ1405', description='تخفیف نوروز', discount_type='fixed',
                           discount_value=50000, max_uses=50, min_amount=200000, is_active=True,
                           valid_until=datetime(2026,4,15)),
        ])
        print("✓ discount codes seeded")

    db.session.commit()
    print("✅ All seed data committed.\n")

if __name__ == '__main__':
    app, socketio = create_app()
    print("="*50)
    print("🚀 MahAfzar Server running on http://127.0.0.1:5000")
    print("📚 Swagger: http://127.0.0.1:5000/api/docs")
    print("👤 admin/admin123  |  user/user123")
    print("="*50)
    socketio.run(app, debug=True, port=5000)
