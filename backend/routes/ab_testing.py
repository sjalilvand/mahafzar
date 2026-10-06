# backend/routes/ab_testing.py
from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ab_testing_service import ABTestingService  # فرض می‌کنیم سرویس در services/ab_testing_service.py باشد
from models import User

ab_ns = Namespace('ab-testing', description='A/B Testing operations')
ab_service = ABTestingService()

@ab_ns.route('/variant/<experiment_key>')
class GetVariant(Resource):
    @jwt_required(optional=True)   # اصلاح‌شده
    def get(self, experiment_key):
        user_id = get_jwt_identity() if get_jwt_identity() else 'anonymous'
        variant = ab_service.assign_variant(str(user_id), experiment_key)
        return {
            'experiment': experiment_key,
            'variant': variant
        }

@ab_ns.route('/track')
class TrackEvent(Resource):
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        ab_service.track_event(
            user_id=user_id,
            experiment_key=data['experiment_key'],
            variant=data['variant'],
            event_type=data['event_type'],
            data=data.get('data')
        )
        return {'message': 'رویداد ثبت شد'}

@ab_ns.route('/results/<experiment_key>')
class ExperimentResults(Resource):
    @jwt_required()
    def get(self, experiment_key):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return {'message': 'دسترسی غیرمجاز'}, 403
        return ab_service.get_experiment_results(experiment_key)

@ab_ns.route('/experiments')
class AllExperiments(Resource):
    @jwt_required()
    def get(self):
        return ab_service.get_all_experiments()