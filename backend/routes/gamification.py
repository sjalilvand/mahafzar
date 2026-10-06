from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Badge, UserBadge, Achievement, UserAchievement, DailyLogin, LevelConfig, LeaderboardCache, \
    UserActivity
from datetime import datetime, timedelta, date
from sqlalchemy import func, desc
import random

gamification_ns = Namespace('gamification', description='Gamification operations')

# Constants
POINTS = {
    'daily_login': 10,
    'streak_bonus': 5,  # per day of streak
    'course_complete': 50,
    'quiz_pass': 30,
    'perfect_quiz': 50,
    'comment': 5,
    'suggestion': 10,
    'profile_complete': 25,
    'badge_share': 15,
    'referral': 100
}

XP = {
    'daily_login': 10,
    'course_complete': 100,
    'quiz_pass': 50,
    'perfect_quiz': 100,
    'comment': 10,
    'badge_earned': 25,
    'level_up': 0
}


# ===== POINTS & XP =====
def award_points(user_id, amount, activity_type, description):
    """اعطای امتیاز به کاربر"""
    user = User.query.get(user_id)
    if user:
        user.points = (user.points or 0) + amount

        # XP و Level
        user.experience = (user.experience or 0) + amount
        check_level_up(user)

        # ثبت فعالیت
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            description=f'{description} (+{amount} XP)',
            metadata=str({'points': amount})
        )
        db.session.add(activity)
        db.session.commit()

        # بررسی دستاوردها
        check_achievements(user_id)


def check_level_up(user):
    """بررسی و ارتقاء سطح"""
    levels = LevelConfig.query.order_by(LevelConfig.level).all()

    for level_config in levels:
        if user.experience >= level_config.xp_required and user.level < level_config.level:
            old_level = user.level
            user.level = level_config.level

            # ثبت فعالیت
            activity = UserActivity(
                user_id=user.id,
                activity_type='level_up',
                description=f'🎉 ارتقاء به سطح {level_config.level} - {level_config.title}',
                metadata=str({'old_level': old_level, 'new_level': level_config.level})
            )
            db.session.add(activity)

            # اعطای نشان سطح
            check_level_badge(user.id, level_config.level)


def check_level_badge(user_id, level):
    """اعطای نشان مخصوص سطح"""
    badge_levels = {
        5: '🌟',
        10: '⭐',
        15: '💫',
        20: '👑',
        25: '🔥',
        30: '💎',
        40: '🚀',
        50: '🏆'
    }

    if level in badge_levels:
        badge = Badge.query.filter_by(name=f'سطح {level}').first()
        if not badge:
            badge = Badge(
                name=f'سطح {level}',
                description=f'رسیدن به سطح {level}',
                icon=badge_levels[level],
                category='achievement',
                rarity='legendary' if level >= 40 else 'epic' if level >= 25 else 'rare',
                points_reward=level * 10
            )
            db.session.add(badge)
            db.session.commit()

        award_badge(user_id, badge.id)


# ===== BADGES =====
def award_badge(user_id, badge_id):
    """اعطای نشان"""
    existing = UserBadge.query.filter_by(user_id=user_id, badge_id=badge_id).first()
    if existing:
        return

    user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
    db.session.add(user_badge)

    badge = Badge.query.get(badge_id)
    if badge:
        award_points(user_id, badge.points_reward, 'badge_earned', f'🏅 دریافت نشان: {badge.name}')

    db.session.commit()


def check_achievements(user_id):
    """بررسی و اعطای دستاوردها"""
    user = User.query.get(user_id)
    achievements = Achievement.query.all()

    for achievement in achievements:
        # بررسی نکردن دستاوردهای تکمیل شده
        ua = UserAchievement.query.filter_by(
            user_id=user_id,
            achievement_id=achievement.id,
            completed=True
        ).first()
        if ua:
            continue

        # محاسبه پیشرفت
        progress = calculate_progress(user, achievement)

        # ایجاد یا بروزرسانی
        user_ach = UserAchievement.query.filter_by(
            user_id=user_id,
            achievement_id=achievement.id
        ).first()

        if not user_ach:
            user_ach = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id
            )
            db.session.add(user_ach)

        user_ach.progress = min(progress, 100)

        if progress >= 100:
            user_ach.completed = True
            user_ach.completed_at = datetime.utcnow()

            # اعطای XP
            award_points(user_id, achievement.xp_reward, 'achievement',
                         f'🎯 دستاورد: {achievement.name}')

            # اعطای نشان مرتبط
            if achievement.badge_id:
                award_badge(user_id, achievement.badge_id)

        db.session.commit()


def calculate_progress(user, achievement):
    """محاسبه درصد پیشرفت دستاورد"""
    target = achievement.target_value
    if target <= 0:
        return 0

    if achievement.target_type == 'points':
        current = user.points or 0
    elif achievement.target_type == 'courses':
        current = 0  # باید تعداد دوره‌های تکمیل شده محاسبه شود
    elif achievement.target_type == 'quizzes':
        from models import QuizAttempt
        current = QuizAttempt.query.filter_by(user_id=user.id, passed=True).count()
    elif achievement.target_type == 'comments':
        from models import Comment
        current = Comment.query.filter_by(user_id=user.id).count()
    elif achievement.target_type == 'streak':
        current = get_login_streak(user.id)
    else:
        current = 0

    return int((current / target) * 100)


def get_login_streak(user_id):
    """محاسبه تعداد روزهای متوالی ورود"""
    today = date.today()
    streak = 0

    for i in range(365):
        check_date = today - timedelta(days=i)
        login = DailyLogin.query.filter_by(
            user_id=user_id,
            login_date=check_date
        ).first()

        if login:
            streak += 1
        else:
            if i == 0:  # امروز لاگین نکرده
                continue
            break

    return streak


# ===== API ENDPOINTS =====
@gamification_ns.route('/daily-login')
class DailyLoginEndpoint(Resource):
    @jwt_required()
    def post(self):
        """ثبت ورود روزانه"""
        user_id = get_jwt_identity()
        today = date.today()

        # بررسی لاگین امروز
        existing = DailyLogin.query.filter_by(
            user_id=user_id,
            login_date=today
        ).first()

        if existing:
            return {
                'message': 'امروز قبلاً ثبت شده',
                'streak': get_login_streak(user_id),
                'already_claimed': True
            }

        # محاسبه streak
        yesterday = today - timedelta(days=1)
        yesterday_login = DailyLogin.query.filter_by(
            user_id=user_id,
            login_date=yesterday
        ).first()

        streak = (yesterday_login.streak_day + 1) if yesterday_login else 1

        # محاسبه امتیاز
        points = POINTS['daily_login'] + (POINTS['streak_bonus'] * (streak - 1))

        # ثبت
        daily = DailyLogin(
            user_id=user_id,
            login_date=today,
            streak_day=streak,
            points_earned=points
        )
        db.session.add(daily)
        db.session.commit()

        # اعطای امتیاز
        streak_bonus = POINTS['streak_bonus'] * (streak - 1)
        award_points(user_id, points, 'daily_login',
                     f'ورود روز {streak} (+{POINTS["daily_login"]} + {streak_bonus} streak bonus)')

        # نشان‌های streak
        if streak in [7, 30, 100, 365]:
            badge = Badge.query.filter_by(name=f'Streak {streak} روز').first()
            if badge:
                award_badge(user_id, badge.id)

        return {
            'message': f'ورود روز {streak} ثبت شد',
            'points_earned': points,
            'streak': streak,
            'total_points': User.query.get(int(user_id)).points
        }


@gamification_ns.route('/badges')
class BadgesList(Resource):
    def get(self):
        """لیست نشان‌ها"""
        badges = Badge.query.filter_by(is_active=True).all()
        return [{
            'id': b.id,
            'name': b.name,
            'description': b.description,
            'icon': b.icon,
            'category': b.category,
            'rarity': b.rarity,
            'points_reward': b.points_reward
        } for b in badges]


@gamification_ns.route('/my-badges')
class MyBadges(Resource):
    @jwt_required()
    def get(self):
        """نشان‌های کاربر"""
        user_id = get_jwt_identity()
        user_badges = UserBadge.query.filter_by(user_id=user_id).all()

        earned = [{
            'id': ub.id,
            'badge_name': ub.badge.name,
            'badge_icon': ub.badge.icon,
            'badge_description': ub.badge.description,
            'rarity': ub.badge.rarity,
            'category': ub.badge.category,
            'earned_at': ub.earned_at.isoformat() if ub.earned_at else None
        } for ub in user_badges]

        all_badges = Badge.query.filter_by(is_active=True).all()
        all_ids = {b.id for b in all_badges}
        earned_ids = {b.id for b in [ub.badge for ub in user_badges]}
        unearned_ids = all_ids - earned_ids

        unearned = [{
            'id': b.id,
            'name': b.name,
            'description': b.description,
            'icon': b.icon,
            'rarity': b.rarity,
            'category': b.category
        } for b in all_badges if b.id in unearned_ids]

        return {
            'earned': earned,
            'unearned': unearned,
            'total': len(all_badges),
            'earned_count': len(earned),
            'completion': round(len(earned) / len(all_badges) * 100, 1) if all_badges else 0
        }


@gamification_ns.route('/achievements')
class AchievementsList(Resource):
    def get(self):
        """لیست دستاوردها"""
        achievements = Achievement.query.all()
        return [{
            'id': a.id,
            'name': a.name,
            'description': a.description,
            'icon': a.icon,
            'category': a.category,
            'target_type': a.target_type,
            'target_value': a.target_value,
            'xp_reward': a.xp_reward,
            'is_hidden': a.is_hidden
        } for a in achievements]


@gamification_ns.route('/my-achievements')
class MyAchievements(Resource):
    @jwt_required()
    def get(self):
        """دستاوردهای کاربر با پیشرفت"""
        user_id = get_jwt_identity()

        achievements = Achievement.query.all()
        result = []

        for ach in achievements:
            ua = UserAchievement.query.filter_by(
                user_id=user_id,
                achievement_id=ach.id
            ).first()

            result.append({
                'id': ach.id,
                'name': ach.name,
                'description': ach.description,
                'icon': ach.icon,
                'category': ach.category,
                'xp_reward': ach.xp_reward,
                'progress': ua.progress if ua else 0,
                'completed': ua.completed if ua else False,
                'completed_at': ua.completed_at.isoformat() if ua and ua.completed_at else None,
                'is_hidden': ach.is_hidden and not (ua and ua.completed)
            })

        completed = sum(1 for r in result if r['completed'])

        return {
            'achievements': result,
            'total': len(result),
            'completed': completed,
            'completion_rate': round(completed / len(result) * 100, 1) if result else 0
        }


@gamification_ns.route('/leaderboard')
class Leaderboard(Resource):
    def get(self):
        """جدول امتیازات"""
        period = request.args.get('period', 'all_time')
        limit = request.args.get('limit', 20, type=int)

        users = User.query.order_by(User.points.desc()).limit(limit).all()

        return [{
            'rank': idx + 1,
            'user_id': u.id,
            'name': u.full_name,
            'avatar': u.avatar_url,
            'points': u.points or 0,
            'level': u.level or 1,
            'badges_count': UserBadge.query.filter_by(user_id=u.id).count(),
            'title': LevelConfig.query.filter_by(level=u.level).first().title if LevelConfig.query.filter_by(
                level=u.level).first() else 'تازه‌کار'
        } for idx, u in enumerate(users)]


@gamification_ns.route('/my-stats')
class MyGamificationStats(Resource):
    @jwt_required()
    def get(self):
        """آمار گیمیفیکیشن کاربر"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))

        if not user:
            return {'message': 'کاربر یافت نشد'}, 404

        streak = get_login_streak(user_id)
        badges_count = UserBadge.query.filter_by(user_id=user_id).count()
        total_badges = Badge.query.count()

        achievements = UserAchievement.query.filter_by(user_id=user_id, completed=True).count()
        total_achievements = Achievement.query.count()

        next_level = LevelConfig.query.filter(
            LevelConfig.level > (user.level or 1)
        ).order_by(LevelConfig.level).first()

        xp_to_next = next_level.xp_required - (user.experience or 0) if next_level else 0
        current_level_xp = LevelConfig.query.filter_by(level=user.level or 1).first()

        if current_level_xp and next_level:
            xp_progress = ((user.experience or 0) - current_level_xp.xp_required) / (
                        next_level.xp_required - current_level_xp.xp_required) * 100
        else:
            xp_progress = 100

        return {
            'points': user.points or 0,
            'experience': user.experience or 0,
            'level': user.level or 1,
            'level_title': LevelConfig.query.filter_by(
                level=user.level or 1).first().title if LevelConfig.query.filter_by(
                level=user.level or 1).first() else 'تازه‌کار',
            'xp_progress': round(xp_progress, 1),
            'xp_to_next': xp_to_next,
            'next_level_title': next_level.title if next_level else 'Max',
            'login_streak': streak,
            'badges': {
                'earned': badges_count,
                'total': total_badges,
                'completion': round(badges_count / total_badges * 100, 1) if total_badges else 0
            },
            'achievements': {
                'completed': achievements,
                'total': total_achievements,
                'completion': round(achievements / total_achievements * 100, 1) if total_achievements else 0
            }
        }


@gamification_ns.route('/levels')
class LevelsConfig(Resource):
    def get(self):
        """تنظیمات سطوح"""
        levels = LevelConfig.query.order_by(LevelConfig.level).all()
        return [{
            'level': l.level,
            'xp_required': l.xp_required,
            'title': l.title,
            'icon': l.icon,
            'perks': l.perks
        } for l in levels]