from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.chat_service import ChatService
from models import db, ChatLog

chat_ns = Namespace('chat', description='Chat operations')
chat_service = ChatService()

chat_model = chat_ns.model('ChatMessage', {
    'message': fields.String(required=True)
})


@chat_ns.route('/')
class Chat(Resource):
    @jwt_required(optional=True)
    @chat_ns.expect(chat_model)
    def post(self):
        data = request.get_json()
        user_message = data['message']
        user_id = get_jwt_identity()

        # Get response from chat service
        response, context = chat_service.get_response(user_message)

        # Log chat
        if user_id:
            log = ChatLog(
                user_id=user_id,
                message=user_message,
                response=response,
                context_used=str(context)
            )
            db.session.add(log)
            db.session.commit()

        return {
            'response': response,
            'sources': context[:3]  # Return top 3 sources
        }


@chat_ns.route('/history')
class ChatHistory(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        logs = ChatLog.query.filter_by(user_id=user_id) \
            .order_by(ChatLog.created_at.desc()) \
            .limit(50).all()

        return [{
            'message': log.message,
            'response': log.response,
            'created_at': log.created_at.isoformat()
        } for log in logs]