from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.chat_service import ChatService
from models import db, ChatLog, ChatFeedback
import json

chat_ns = Namespace('chat', description='Chat operations')
chat_service = ChatService()

chat_model = chat_ns.model('ChatMessage', {
    'message': fields.String(required=True),
    'session_id': fields.String(required=False, description='شناسه جلسه برای حافظه مکالمه')
})

feedback_model = chat_ns.model('ChatFeedback', {
    'survey_id': fields.String(required=True),
    'rating': fields.Integer(required=False),
    'comment': fields.String(required=False),
    'question': fields.String(required=False),
    'session_id': fields.String(required=False),
})


@chat_ns.route('/')
class Chat(Resource):
    @jwt_required(optional=True)
    @chat_ns.expect(chat_model)
    def post(self):
        data = request.get_json()
        user_message = (data.get('message') or '').strip()
        session_id = (data.get('session_id') or '')[:80]
        if not user_message:
            return {'response': 'پیام خالی است!', 'items': [], 'actions': [], 'sources': []}, 400

        user_id = get_jwt_identity()
        survey = None

        # round-12: اگر پیام جواب سوال متنی نظرسنجی باشد، ثبت و پاسخ تشکر برمی‌گردد
        comment_state = chat_service.consume_survey_comment(session_id, user_message)
        if comment_state == 'comment':
            text = 'ممنون از نظرتون! 🌸 نظرسنجی کامل شد — هر سوال دیگه‌ای داشتید در خدمتم.'
            items, actions, sources = [], [], []
            try:
                db.session.add(ChatFeedback(
                    user_id=user_id if user_id else None,
                    session_id=session_id or None,
                    survey_id='survey_comment', kind='survey_comment',
                    question='پیشنهاد بهبود چت', rating=0, comment=user_message[:500]))
                db.session.commit()
            except Exception:
                db.session.rollback()
        else:
            # Get response from chat service (dict: text/items/actions/survey یا str قدیمی)
            result, context = chat_service.get_response(user_message, session_id)
            items, actions, sources, survey = _unpack(result, context)
            text = result.get('text', '') if isinstance(result, dict) else str(result)

        # Log chat (کاربر مهمان هم لاگ می‌شود — user_id nullable است)
        try:
            log = ChatLog(
                user_id=user_id if user_id else None,
                message=user_message,
                response=text,
                context_used=json.dumps({'items': [i.get('name') or i.get('title') for i in items][:5],
                                         'sources': list(sources)[:5],
                                         'session': session_id or None}, ensure_ascii=False)
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.rollback()  # لاگ حیاتی نیست

        payload = {
            'response': text,
            'items': items,
            'actions': actions,
            'sources': list(sources)[:3]
        }
        if comment_state != 'comment':
            payload['survey'] = survey
        return payload


def _unpack(result, context):
    """نرمال‌سازی خروجی سرویس چت"""
    if isinstance(result, dict):
        items = result.get('items', [])
        actions = result.get('actions', [])
        survey = result.get('survey')
        sources = list(context)
    else:
        items, actions, survey, sources = [], [], [], list(context)
    return items, actions, sources, survey


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


@chat_ns.route('/feedback')
class ChatFeedbackRes(Resource):
    """round-12 — ثبت امتیاز نظرسنجی گرافیکی چت (ستاره/ایموجی)"""
    @jwt_required(optional=True)
    @chat_ns.expect(feedback_model)
    def post(self):
        data = request.get_json() or {}
        survey_id = (data.get('survey_id') or '').strip()[:80]
        if not survey_id:
            return {'message': 'survey_id الزامی است'}, 400
        try:
            rating = int(data.get('rating') or 0)
        except (TypeError, ValueError):
            rating = 0
        rating = max(0, min(5, rating))
        comment = (data.get('comment') or '')[:500]
        question = (data.get('question') or '')[:300]
        session_id = (data.get('session_id') or '')[:80]
        if rating == 0 and not comment:
            return {'message': 'امتیاز یا نظر لازم است'}, 400

        user_id = get_jwt_identity()
        kind = 'survey_step' if (survey_id.startswith('sv_')) else 'answer_rating'
        try:
            db.session.add(ChatFeedback(
                user_id=user_id if user_id else None,
                session_id=session_id or None,
                survey_id=survey_id, kind=kind,
                question=question, rating=rating, comment=comment or None))
            db.session.commit()
        except Exception:
            db.session.rollback()

        # جلو بردن جریان نظرسنجی چندمرحله‌ای (سوال بعدی)
        nxt = chat_service.survey_answered(session_id, survey_id, rating, question)
        return {'ok': True, 'done': nxt.get('done', True),
                'thanks': nxt.get('thanks', 'ممنون از بازخوردتون! 🌸'),
                'next': nxt.get('next')}


@chat_ns.route('/feedback/summary')
class ChatFeedbackSummary(Resource):
    """round-12 — نتیجه گرافیکی نظرسنجی: توزیع امتیازها + میانگین (برای نمودار میله‌ای چت)"""
    def get(self):
        survey_id = request.args.get('survey_id')
        q = ChatFeedback.query.filter(ChatFeedback.rating > 0)
        if survey_id:
            q = q.filter(ChatFeedback.survey_id == survey_id)
        rows = q.all()
        dist = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
        total = 0
        for r in rows:
            key = str(max(1, min(5, r.rating)))
            dist[key] += 1
            total += r.rating
        count = sum(dist.values())
        return {
            'count': count,
            'avg': round(total / count, 2) if count else 0,
            'dist': dist,
        }
