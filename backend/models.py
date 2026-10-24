from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ==================== USERS ====================
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(150))
    role = db.Column(db.String(50), default='user')

    # پروفایل
    avatar_url = db.Column(db.String(500))
    cover_url = db.Column(db.String(500))
    bio = db.Column(db.Text)
    title = db.Column(db.String(200))
    location = db.Column(db.String(200))
    website = db.Column(db.String(300))
    github = db.Column(db.String(300))
    linkedin = db.Column(db.String(300))
    twitter = db.Column(db.String(300))
    phone = db.Column(db.String(20))

    # تنظیمات
    theme_preference = db.Column(db.String(50), default='dark')
    language = db.Column(db.String(10), default='fa')
    email_notifications = db.Column(db.Boolean, default=True)
    sms_notifications = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)

    # گیمیفیکیشن
    points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    experience = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime)
    login_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # روابط
    comments = db.relationship('Comment', backref='author', lazy=True)
    ratings = db.relationship('Rating', backref='user', lazy=True)
    suggestions = db.relationship('Suggestion', backref='user', lazy=True)
    skills = db.relationship('UserSkill', backref='user', lazy=True, cascade='all, delete-orphan')
    educations = db.relationship('Education', backref='user', lazy=True, cascade='all, delete-orphan')
    experiences = db.relationship('WorkExperience', backref='user', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('UserActivity', backref='user', lazy=True, order_by='desc(UserActivity.created_at)')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy=True)
    certificates = db.relationship('Certificate', backref='user', lazy=True)
    forum_topics = db.relationship('ForumTopic', foreign_keys='ForumTopic.user_id', backref='author', lazy=True)
    forum_posts = db.relationship('ForumPost', backref='author', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    wallet = db.relationship('Wallet', backref='user', uselist=False)
    subscription = db.relationship('UserSubscription', backref='user', uselist=False)
    badges = db.relationship('UserBadge', backref='user', lazy=True)
    achievements = db.relationship('UserAchievement', backref='user', lazy=True)
    ab_test_events = db.relationship('ABTestEvent', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# ==================== MEMBERS & MISSIONS ====================
class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    position = db.Column(db.String(200))
    department = db.Column(db.String(100))
    bio = db.Column(db.Text)
    skills = db.Column(db.String(500))
    linkedin_url = db.Column(db.String(300))
    github_url = db.Column(db.String(300))
    avatar_url = db.Column(db.String(500))
    is_featured = db.Column(db.Boolean, default=False)
    join_date = db.Column(db.DateTime, default=datetime.utcnow)

class Mission(db.Model):
    __tablename__ = 'missions'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100))
    mission_type = db.Column(db.String(50))
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== COURSES & QUIZ ====================
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)
    category = db.Column(db.String(100))
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    thumbnail_url = db.Column(db.String(500))
    video_url = db.Column(db.String(500))
    duration = db.Column(db.String(50))
    level = db.Column(db.String(50))
    tags = db.Column(db.String(500))
    is_published = db.Column(db.Boolean, default=True)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = db.relationship('Comment', backref='course', lazy=True)
    ratings = db.relationship('Rating', backref='course', lazy=True)
    quizzes = db.relationship('Quiz', backref='course', lazy=True)
    certificates = db.relationship('Certificate', backref='course', lazy=True)


class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))
    is_approved = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]))

class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'course_id'),)


class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'))
    passing_score = db.Column(db.Integer, default=70)
    time_limit = db.Column(db.Integer)
    max_attempts = db.Column(db.Integer, default=3)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='multiple_choice')
    options = db.Column(db.Text)
    correct_answer = db.Column(db.String(500))
    points = db.Column(db.Integer, default=10)
    explanation = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float)
    total_points = db.Column(db.Integer)
    passed = db.Column(db.Boolean, default=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    answers = db.Column(db.Text)

class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    quiz_attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempts.id'))
    certificate_code = db.Column(db.String(100), unique=True)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== PROFILE EXTRAS ====================
class UserSkill(db.Model):
    __tablename__ = 'user_skills'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    proficiency = db.Column(db.Integer, default=50)
    category = db.Column(db.String(50))

class Education(db.Model):
    __tablename__ = 'educations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    institution = db.Column(db.String(200), nullable=False)
    degree = db.Column(db.String(100))
    field = db.Column(db.String(200))
    start_year = db.Column(db.Integer)
    end_year = db.Column(db.Integer)
    is_current = db.Column(db.Boolean, default=False)

class WorkExperience(db.Model):
    __tablename__ = 'work_experiences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    position = db.Column(db.String(200))
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    is_current = db.Column(db.Boolean, default=False)

# ستون metadata را به extra_data تغییر نام دادیم تا با attribute رزرو شده تداخل نکند
class UserActivity(db.Model):
    __tablename__ = 'user_activities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50))
    description = db.Column(db.String(500))
    extra_data = db.Column(db.Text)  # قبلاً metadata بود
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== SUGGESTIONS, DATA, CHAT ====================
class Suggestion(db.Model):
    __tablename__ = 'suggestions'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    category = db.Column(db.String(100))
    status = db.Column(db.String(50), default='pending')
    admin_response = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DataAccess(db.Model):
    __tablename__ = 'data_access'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    access_type = db.Column(db.String(100))
    url = db.Column(db.String(500))
    documentation = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatLog(db.Model):
    __tablename__ = 'chat_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    context_used = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChatFeedback(db.Model):
    """round-12 — نتایج نظرسنجی گرافیکی چت (ستاره/ایموجی) و بازخورد پاسخ‌ها"""
    __tablename__ = 'chat_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_id = db.Column(db.String(80), index=True)
    survey_id = db.Column(db.String(80), index=True)
    kind = db.Column(db.String(30))          # answer_rating | survey_step | survey_comment
    question = db.Column(db.String(300))
    rating = db.Column(db.Integer)           # ۱ تا ۵ (۰ برای نظر متنی)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== GAMIFICATION ====================
class Badge(db.Model):
    __tablename__ = 'badges'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    icon = db.Column(db.String(50))
    category = db.Column(db.String(50))
    requirement_type = db.Column(db.String(50))
    requirement_value = db.Column(db.Integer)
    rarity = db.Column(db.String(20))
    points_reward = db.Column(db.Integer, default=10)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserBadge(db.Model):
    __tablename__ = 'user_badges'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.Column(db.Integer, default=0)
    badge = db.relationship('Badge', backref='earned_by')

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    icon = db.Column(db.String(50))
    category = db.Column(db.String(50))
    target_type = db.Column(db.String(50))
    target_value = db.Column(db.Integer)
    xp_reward = db.Column(db.Integer, default=100)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'))
    is_hidden = db.Column(db.Boolean, default=False)
    badge = db.relationship('Badge', backref='achievement')

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    progress = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    notified = db.Column(db.Boolean, default=False)
    achievement = db.relationship('Achievement', backref='user_progress')

class DailyLogin(db.Model):
    __tablename__ = 'daily_logins'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    login_date = db.Column(db.Date, nullable=False)
    streak_day = db.Column(db.Integer, default=1)
    points_earned = db.Column(db.Integer, default=10)
    __table_args__ = (db.UniqueConstraint('user_id', 'login_date'),)

class LevelConfig(db.Model):
    __tablename__ = 'level_config'
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, unique=True, nullable=False)
    xp_required = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100))
    perks = db.Column(db.Text)
    icon = db.Column(db.String(50))

class LeaderboardCache(db.Model):
    __tablename__ = 'leaderboard_cache'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    badges_count = db.Column(db.Integer, default=0)
    rank = db.Column(db.Integer)
    period = db.Column(db.String(20))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== FORUM ====================
class ForumCategory(db.Model):
    __tablename__ = 'forum_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    slug = db.Column(db.String(200), unique=True)
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    topics_count = db.Column(db.Integer, default=0)
    posts_count = db.Column(db.Integer, default=0)
    last_post_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    topics = db.relationship('ForumTopic', backref='category', lazy=True)

class ForumTopic(db.Model):
    __tablename__ = 'forum_topics'
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('forum_categories.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    slug = db.Column(db.String(500), unique=True)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(500))
    is_pinned = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    is_solved = db.Column(db.Boolean, default=False)
    views = db.Column(db.Integer, default=0)
    posts_count = db.Column(db.Integer, default=0)
    upvotes = db.Column(db.Integer, default=0)
    downvotes = db.Column(db.Integer, default=0)
    last_post_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_post_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_poster = db.relationship('User', foreign_keys=[last_post_user_id])
    posts = db.relationship('ForumPost', backref='topic', lazy=True, order_by='ForumPost.created_at')

class ForumPost(db.Model):
    __tablename__ = 'forum_posts'
    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topics.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_answer = db.Column(db.Boolean, default=False)
    upvotes = db.Column(db.Integer, default=0)
    downvotes = db.Column(db.Integer, default=0)
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ForumTag(db.Model):
    __tablename__ = 'forum_tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True)
    description = db.Column(db.Text)
    color = db.Column(db.String(20))
    topics_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TopicTag(db.Model):
    __tablename__ = 'topic_tags'
    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topics.id'), nullable=False)
    tag_id = db.Column(db.Integer, db.ForeignKey('forum_tags.id'), nullable=False)


# ==================== PAYMENTS ====================
class PaymentPlan(db.Model):
    __tablename__ = 'payment_plans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Integer, nullable=False)
    duration_days = db.Column(db.Integer)
    features = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payments = db.relationship('Payment', backref='plan', lazy=True)

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('payment_plans.id'))
    amount = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default='pending')
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(200))
    reference_id = db.Column(db.String(200))
    authority = db.Column(db.String(200))
    description = db.Column(db.Text)
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserSubscription(db.Model):
    __tablename__ = 'user_subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('payment_plans.id'))
    is_active = db.Column(db.Boolean, default=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    auto_renew = db.Column(db.Boolean, default=False)
    plan = db.relationship('PaymentPlan')

class PaymentDiscount(db.Model):
    __tablename__ = 'payment_discounts'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(300))
    discount_type = db.Column(db.String(20))
    discount_value = db.Column(db.Integer, nullable=False)
    max_uses = db.Column(db.Integer)
    used_count = db.Column(db.Integer, default=0)
    min_amount = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Wallet(db.Model):
    __tablename__ = 'wallets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    balance = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    transactions = db.relationship('WalletTransaction', backref='wallet', lazy=True)

class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'
    id = db.Column(db.Integer, primary_key=True)
    wallet_id = db.Column(db.Integer, db.ForeignKey('wallets.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(20))
    description = db.Column(db.String(300))
    reference_id = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== A/B TESTING ====================
class ABTestEvent(db.Model):
    __tablename__ = 'ab_test_events'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    experiment_key = db.Column(db.String(100), nullable=False)
    variant = db.Column(db.String(50), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    data = db.Column(db.Text)  # renamed from data to avoid issues
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TopicVote(db.Model):
    __tablename__ = 'topic_votes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topics.id'), nullable=False)
    vote_type = db.Column(db.String(10))  # 'up' or 'down'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'topic_id'),)

class PostVote(db.Model):
    __tablename__ = 'post_votes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('forum_posts.id'), nullable=False)
    vote_type = db.Column(db.String(10))  # 'up' or 'down'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id'),)