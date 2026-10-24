from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.chat_service import ChatService
from models import db, ChatLog
import json

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
        user_message = (data.get('message') or '').strip()
        if not user_message:
            return {'response': 'پیام خالی است!', 'items': [], 'actions': [], 'sources': []}, 400

        user_id = get_jwt_identity()

        # Get response from chat service (dict: text/items/actions یا str قدیمی)
        result, context = chat_service.get_response(user_message)
        if isinstance(result, dict):
            text = result.get('text', '')
            items = result.get('items', [])
            actions = result.get('actions', [])
        else:
            text, items, actions = result, [], []

        # Log chat (کاربر مهمان هم لاگ می‌شود — user_id nullable است)
        try:
            log = ChatLog(
                user_id=user_id if user_id else None,
                message=user_message,
                response=text,
                context_used=json.dumps({'items': [i.get('name') or i.get('title') for i in items][:5],
                                         'sources': list(context)[:5]}, ensure_ascii=False)
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.rollback()  # لاگ حیاتی نیست

        return {
            'response': text,
            'items': items,
            'actions': actions,
            'sources': list(context)[:3]
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
