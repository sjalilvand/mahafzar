from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.recommendation_service import RecommendationService

rec_ns = Namespace('recommendations', description='AI Recommendations')

rec_service = RecommendationService()

@rec_ns.route('/personalized')
class PersonalizedRecommendations(Resource):
    @jwt_required()
    def get(self):
        """توصیه‌های شخصی"""
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        return rec_service.get_personalized_recommendations(int(user_id), limit)

@rec_ns.route('/similar/<int:course_id>')
class SimilarCourses(Resource):
    def get(self, course_id):
        """دوره‌های مشابه"""
        limit = request.args.get('limit', 5, type=int)
        return rec_service.get_similar_courses(course_id, limit)

@rec_ns.route('/trending')
class TrendingCourses(Resource):
    def get(self):
        """دوره‌های ترند"""
        limit = request.args.get('limit', 5, type=int)
        return rec_service.get_trending_courses(limit)

@rec_ns.route('/because-you-watched')
class BecauseYouWatched(Resource):
    @jwt_required()
    def get(self):
        """چون دیدید..."""
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        return rec_service.get_because_you_watched(int(user_id), limit)