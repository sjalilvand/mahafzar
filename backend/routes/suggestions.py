from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Suggestion

suggestions_ns = Namespace('suggestions', description='Suggestion operations')

suggestion_model = suggestions_ns.model('Suggestion', {
    'subject': fields.String(required=True),
    'content': fields.String(required=True),
    'category': fields.String()
})


@suggestions_ns.route('/')
class SuggestionList(Resource):
    @jwt_required()
    @suggestions_ns.expect(suggestion_model)
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()

        suggestion = Suggestion(
            subject=data['subject'],
            content=data['content'],
            category=data.get('category', 'general'),
            user_id=user_id
        )

        db.session.add(suggestion)
        db.session.commit()

        return {'message': 'پیشنهاد شما با موفقیت ثبت شد'}, 201

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        suggestions = Suggestion.query.filter_by(user_id=user_id) \
            .order_by(Suggestion.created_at.desc()).all()

        return [{
            'id': s.id,
            'subject': s.subject,
            'content': s.content,
            'category': s.category,
            'status': s.status,
            'admin_response': s.admin_response,
            'created_at': s.created_at.isoformat()
        } for s in suggestions]