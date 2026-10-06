import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from models import db, User, Course, UserActivity, Rating, Comment
from sqlalchemy import func
from collections import Counter
import json


class RecommendationService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words=None, max_features=100)
        self.course_vectors = None
        self.courses = None

    def get_personalized_recommendations(self, user_id, limit=5):
        """توصیه‌های شخصی‌سازی شده"""
        user = User.query.get(user_id)
        if not user:
            return self.get_popular_courses(limit)

        # ۱. تحلیل تاریخچه کاربر
        viewed_courses = self._get_viewed_courses(user_id)
        rated_courses = self._get_rated_courses(user_id)
        user_tags = self._extract_user_interests(user_id)

        # ۲. امتیازدهی به دوره‌ها
        all_courses = Course.query.filter_by(is_published=True).all()
        scores = []

        for course in all_courses:
            if course.id in viewed_courses:
                continue  # قبلاً دیده شده

            score = 0

            # شباهت محتوا
            content_score = self._calculate_content_similarity(course, user_tags)
            score += content_score * 0.4

            # امتیاز دوره
            avg_rating = db.session.query(func.avg(Rating.score)) \
                             .filter_by(course_id=course.id).scalar() or 0
            score += (avg_rating / 5) * 0.3

            # محبوبیت
            popularity = course.view_count / max(1, max(c.view_count for c in all_courses))
            score += popularity * 0.2

            # هماهنگی با مهارت کاربر
            skill_match = self._calculate_skill_match(course, user)
            score += skill_match * 0.1

            scores.append((course, score))

        # مرتب‌سازی و انتخاب بهترین‌ها
        scores.sort(key=lambda x: x[1], reverse=True)

        return [{
            'course_id': course.id,
            'title': course.title,
            'description': course.description[:150],
            'category': course.category,
            'level': course.level,
            'score': round(score * 100, 1),
            'reason': self._get_recommendation_reason(score, course)
        } for course, score in scores[:limit]]

    def get_similar_courses(self, course_id, limit=5):
        """دوره‌های مشابه"""
        course = Course.query.get(course_id)
        if not course:
            return []

        all_courses = Course.query.filter(
            Course.id != course_id,
            Course.is_published == True
        ).all()

        # ترکیب ویژگی‌های دوره
        course_text = f"{course.title} {course.description} {course.tags} {course.category}"
        other_texts = [f"{c.title} {c.description} {c.tags} {c.category}" for c in all_courses]

        try:
            self.vectorizer.fit([course_text] + other_texts)
            vectors = self.vectorizer.transform([course_text] + other_texts)
            similarities = cosine_similarity(vectors[0:1], vectors[1:])[0]

            similar = list(zip(all_courses, similarities))
            similar.sort(key=lambda x: x[1], reverse=True)

            return [{
                'course_id': c.id,
                'title': c.title,
                'similarity': round(s * 100, 1),
                'category': c.category,
                'level': c.level
            } for c, s in similar[:limit]]
        except:
            return self.get_popular_courses(limit)

    def get_trending_courses(self, limit=5):
        """دوره‌های ترند"""
        # دوره‌هایی که در ۷ روز گذشته بیشترین بازدید را داشته‌اند
        week_ago = datetime.utcnow() - timedelta(days=7)

        trending = Course.query.filter_by(is_published=True) \
            .order_by(Course.view_count.desc()) \
            .limit(limit * 2).all()

        return [{
            'course_id': c.id,
            'title': c.title,
            'views': c.view_count,
            'category': c.category,
            'trend_score': c.view_count
        } for c in trending[:limit]]

    def get_because_you_watched(self, user_id, limit=5):
        """چون این دوره‌ها را دیدید..."""
        viewed = self._get_viewed_courses(user_id)[-3:]  # آخرین ۳ دوره
        if not viewed:
            return []

        recommendations = []
        for course_id in viewed:
            similar = self.get_similar_courses(course_id, 2)
            recommendations.extend(similar)

        # حذف تکراری‌ها
        seen_ids = set()
        unique = []
        for r in recommendations:
            if r['course_id'] not in seen_ids:
                unique.append(r)
                seen_ids.add(r['course_id'])

        return unique[:limit]

    def get_popular_courses(self, limit=5):
        """دوره‌های محبوب"""
        courses = Course.query.filter_by(is_published=True) \
            .order_by(Course.view_count.desc()) \
            .limit(limit).all()

        return [{
            'course_id': c.id,
            'title': c.title,
            'views': c.view_count,
            'category': c.category,
            'reason': 'محبوب در میان کاربران'
        } for c in courses]

    def _get_viewed_courses(self, user_id):
        activities = UserActivity.query.filter_by(
            user_id=user_id,
            activity_type='course_view'
        ).all()

        course_ids = set()
        for a in activities:
            try:
                meta = json.loads(a.metadata or '{}')
                if 'course_id' in meta:
                    course_ids.add(meta['course_id'])
            except:
                pass
        return list(course_ids)

    def _get_rated_courses(self, user_id):
        ratings = Rating.query.filter_by(user_id=user_id).all()
        return [r.course_id for r in ratings]

    def _extract_user_interests(self, user_id):
        """استخراج علایق کاربر"""
        interests = []

        # از دوره‌های دیده شده
        viewed = self._get_viewed_courses(user_id)
        for cid in viewed:
            course = Course.query.get(cid)
            if course:
                if course.tags:
                    interests.extend(course.tags.split(','))
                interests.append(course.category)

        # از مهارت‌های کاربر
        user = User.query.get(user_id)
        if user and user.skills:
            for skill in user.skills:
                interests.append(skill.skill_name)

        return list(set(interests))

    def _calculate_content_similarity(self, course, user_tags):
        """محاسبه شباهت محتوا با علایق کاربر"""
        if not user_tags:
            return 0.5

        course_tags = course.tags.split(',') if course.tags else []
        course_text = set(course_tags + [course.category, course.title])
        user_interests = set(user_tags)

        if not course_text:
            return 0.3

        intersection = course_text.intersection(user_interests)
        return len(intersection) / max(1, len(course_text))

    def _calculate_skill_match(self, course, user):
        """محاسبه هماهنگی با مهارت کاربر"""
        if not user.skills:
            return 0.5

        course_tags = set(course.tags.split(',')) if course.tags else set()
        user_skills = set(s.skill_name for s in user.skills)

        if not course_tags:
            return 0.5

        match = course_tags.intersection(user_skills)
        return len(match) / max(1, len(course_tags))

    def _get_recommendation_reason(self, score, course):
        """دلیل توصیه"""
        if score > 0.8:
            return '🎯 کاملاً مطابق با علایق شما'
        elif score > 0.6:
            return '⭐ محبوب و متناسب با سطح شما'
        elif score > 0.4:
            return '📈 در حال ترند شدن'
        else:
            return '🆕 دوره جدید'