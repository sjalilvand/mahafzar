from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Course, Comment, QuizAttempt, Suggestion, ChatLog, UserActivity, Rating
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import json

analytics_ns = Namespace('analytics', description='Analytics operations')


@analytics_ns.route('/dashboard')
class DashboardAnalytics(Resource):
    @jwt_required()
    def get(self):
        """آمار کلی داشبورد"""
        user_id = get_jwt_identity()

        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # آمار کلی
        total_users = User.query.count()
        total_courses = Course.query.count()
        total_comments = Comment.query.count()
        total_quizzes = QuizAttempt.query.count()

        # کاربران جدید
        new_users_week = User.query.filter(User.created_at >= week_ago).count()
        new_users_month = User.query.filter(User.created_at >= month_ago).count()

        # فعالیت‌های امروز
        today_activities = UserActivity.query.filter(
            UserActivity.created_at >= today
        ).count()

        # نظرات امروز
        today_comments = Comment.query.filter(
            Comment.created_at >= today
        ).count()

        # بازدید دوره‌ها
        total_views = db.session.query(func.sum(Course.view_count)).scalar() or 0

        # میانگین امتیاز
        avg_rating = db.session.query(func.avg(Rating.score)).scalar() or 0

        return {
            'total_stats': {
                'users': total_users,
                'courses': total_courses,
                'comments': total_comments,
                'quizzes': total_quizzes,
                'total_views': total_views,
                'avg_rating': round(float(avg_rating), 1)
            },
            'new_users': {
                'week': new_users_week,
                'month': new_users_month
            },
            'today': {
                'activities': today_activities,
                'comments': today_comments
            }
        }


@analytics_ns.route('/user-activity')
class UserActivityAnalytics(Resource):
    @jwt_required()
    def get(self):
        days = request.args.get('days', 30, type=int)
        activities = db.session.query(
            func.date(UserActivity.created_at).label('date'),
            func.count(UserActivity.id).label('count'),
            UserActivity.activity_type
        ).filter(
            UserActivity.created_at >= datetime.utcnow() - timedelta(days=days)
        ).group_by(
            func.date(UserActivity.created_at),
            UserActivity.activity_type
        ).order_by('date').all()

        dates = []
        activity_types = set()
        data_by_date = {}

        for activity in activities:
            # اصلاح: activity.date یک شیء date است، مستقیم strftime بگیر
            date_str = activity.date.strftime('%Y-%m-%d') if hasattr(activity.date, 'strftime') else str(activity.date)
            dates.append(date_str)
            activity_types.add(activity.activity_type)
            if date_str not in data_by_date:
                data_by_date[date_str] = {}
            data_by_date[date_str][activity.activity_type] = activity.count

        result = {
            'labels': sorted(list(set(dates))),
            'activity_types': list(activity_types),
            'datasets': []
        }
        for act_type in activity_types:
            dataset = {
                'label': act_type,
                'data': [data_by_date.get(date, {}).get(act_type, 0) for date in result['labels']]
            }
            result['datasets'].append(dataset)
        return result


@analytics_ns.route('/courses-popularity')
class CoursePopularity(Resource):
    def get(self):
        """محبوب‌ترین دوره‌ها"""
        courses = Course.query.order_by(Course.view_count.desc()).limit(10).all()
        return {
            'labels': [c.title for c in courses],
            'views': [c.view_count or 0 for c in courses],
            'ratings': [
                float(db.session.query(func.avg(Rating.score))
                      .filter_by(course_id=c.id).scalar() or 0)
                for c in courses
            ],
            'comment_counts': [
                Comment.query.filter_by(course_id=c.id).count()
                for c in courses
            ]
        }


@analytics_ns.route('/course-categories')
class CourseCategories(Resource):
    def get(self):
        """توزیع دوره‌ها براساس دسته‌بندی"""
        categories = db.session.query(
            Course.category,
            func.count(Course.id).label('count')
        ).group_by(Course.category).all()

        return {
            'labels': [c[0] for c in categories],
            'data': [c[1] for c in categories]
        }


@analytics_ns.route('/course-levels')
class CourseLevels(Resource):
    def get(self):
        """توزیع دوره‌ها براساس سطح"""
        levels = db.session.query(
            Course.level,
            func.count(Course.id).label('count')
        ).group_by(Course.level).all()

        level_names = {
            'beginner': 'مقدماتی',
            'intermediate': 'متوسط',
            'advanced': 'پیشرفته'
        }

        return {
            'labels': [level_names.get(l[0], l[0]) for l in levels],
            'data': [l[1] for l in levels]
        }


@analytics_ns.route('/user-growth')
class UserGrowth(Resource):
    @jwt_required()
    def get(self):
        """رشد کاربران در ۱۲ ماه گذشته"""
        months = 12

        growth = db.session.query(
            extract('year', User.created_at).label('year'),
            extract('month', User.created_at).label('month'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= datetime.utcnow() - timedelta(days=365)
        ).group_by('year', 'month').order_by('year', 'month').all()

        labels = []
        data = []
        cumulative = 0

        for g in growth:
            month_name = f"{int(g.year)}-{int(g.month):02d}"
            labels.append(month_name)
            cumulative += g.count
            data.append(cumulative)

        return {
            'labels': labels,
            'data': data
        }


@analytics_ns.route('/quiz-performance')
class QuizPerformance(Resource):
    @jwt_required()
    def get(self):
        # فقط آزمون‌های پایان‌یافته
        attempts = QuizAttempt.query.filter(QuizAttempt.completed_at != None).all()

        if not attempts:
            return {'labels': [], 'data': [], 'pass_rate': 0}

        scores = [a.score for a in attempts if a.score is not None]
        total_points = [a.total_points for a in attempts if a.total_points is not None]

        percentages = []
        for score, total in zip(scores, total_points):
            if total > 0:
                percentages.append(round(score / total * 100, 1))

        ranges = {
            '۰-۲۰٪': 0, '۲۱-۴۰٪': 0, '۴۱-۶۰٪': 0, '۶۱-۸۰٪': 0, '۸۱-۱۰۰٪': 0
        }
        for p in percentages:
            if p <= 20:
                ranges['۰-۲۰٪'] += 1
            elif p <= 40:
                ranges['۲۱-۴۰٪'] += 1
            elif p <= 60:
                ranges['۴۱-۶۰٪'] += 1
            elif p <= 80:
                ranges['۶۱-۸۰٪'] += 1
            else:
                ranges['۸۱-۱۰۰٪'] += 1

        pass_count = QuizAttempt.query.filter_by(passed=True).count()
        pass_rate = round(pass_count / len(attempts) * 100, 1) if attempts else 0

        return {
            'distribution': {
                'labels': list(ranges.keys()),
                'data': list(ranges.values())
            },
            'pass_rate': pass_rate,
            'avg_score': round(sum(percentages) / len(percentages), 1) if percentages else 0,
            'total_attempts': len(attempts)
        }


@analytics_ns.route('/user-engagement')
class UserEngagement(Resource):
    @jwt_required()
    def get(self):
        """میزان تعامل کاربران"""
        # کاربران فعال (در ۷ روز گذشته)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = User.query.filter(User.last_login >= week_ago).count()

        # کاربران با بیشترین فعالیت
        top_users = db.session.query(
            User.full_name,
            User.avatar_url,
            func.count(UserActivity.id).label('activity_count')
        ).join(UserActivity).group_by(User.id).order_by(
            func.count(UserActivity.id).desc()
        ).limit(10).all()

        return {
            'active_users': active_users,
            'total_users': User.query.count(),
            'engagement_rate': round(active_users / User.query.count() * 100, 1) if User.query.count() > 0 else 0,
            'top_users': [{
                'name': u[0],
                'avatar': u[1],
                'activities': u[2]
            } for u in top_users]
        }


@analytics_ns.route('/hourly-activity')
class HourlyActivity(Resource):
    @jwt_required()
    def get(self):
        """فعالیت ساعتی کاربران"""
        hours = db.session.query(
            extract('hour', UserActivity.created_at).label('hour'),
            func.count(UserActivity.id).label('count')
        ).group_by('hour').order_by('hour').all()

        labels = [f"{int(h[0]):02d}:00" for h in hours]
        data = [h[1] for h in hours]

        return {'labels': labels, 'data': data}


@analytics_ns.route('/my-stats')
class MyStats(Resource):
    @jwt_required()
    def get(self):
        """آمار شخصی کاربر"""
        user_id = get_jwt_identity()

        # نظرات
        my_comments = Comment.query.filter_by(user_id=user_id).count()

        # آزمون‌ها
        my_quizzes = QuizAttempt.query.filter_by(user_id=user_id).all()
        quiz_count = len(my_quizzes)
        passed_count = sum(1 for q in my_quizzes if q.passed)

        # میانگین نمرات
        scores = []
        for q in my_quizzes:
            if q.score and q.total_points:
                scores.append(q.score / q.total_points * 100)
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        # فعالیت‌ها
        activities = UserActivity.query.filter_by(user_id=user_id).count()

        # بازخوردها
        suggestions = Suggestion.query.filter_by(user_id=user_id).count()

        # تاریخچه چت
        chats = ChatLog.query.filter_by(user_id=user_id).count()

        return {
            'comments': my_comments,
            'quizzes_taken': quiz_count,
            'quizzes_passed': passed_count,
            'avg_score': avg_score,
            'activities': activities,
            'suggestions': suggestions,
            'chats': chats
        }