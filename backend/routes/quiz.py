from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Quiz, Question, QuizAttempt, Certificate
from datetime import datetime
import json
import random
import string

quiz_ns = Namespace('quiz', description='Quiz operations')

question_model = quiz_ns.model('Question', {
    'question_text': fields.String(required=True),
    'question_type': fields.String(default='multiple_choice'),
    'options': fields.String(),
    'correct_answer': fields.String(required=True),
    'points': fields.Integer(default=10),
    'explanation': fields.String(),
    'order': fields.Integer(default=0)
})

quiz_model = quiz_ns.model('Quiz', {
    'title': fields.String(required=True),
    'description': fields.String(),
    'course_id': fields.Integer(),
    'passing_score': fields.Integer(default=70),
    'time_limit': fields.Integer(),
    'max_attempts': fields.Integer(default=3)
})


@quiz_ns.route('/')
class QuizList(Resource):
    def get(self):
        """دریافت لیست آزمون‌ها"""
        quizzes = Quiz.query.filter_by(is_active=True).all()
        return [{
            'id': q.id,
            'title': q.title,
            'description': q.description,
            'course_id': q.course_id,
            'passing_score': q.passing_score,
            'time_limit': q.time_limit,
            'question_count': len(q.questions),
            'total_points': sum(que.points for que in q.questions),
            'created_at': q.created_at.isoformat() if q.created_at else None
        } for q in quizzes]

    @jwt_required()
    def post(self):
        """ایجاد آزمون جدید (ادمین)"""
        user_id = get_jwt_identity()
        from models import User
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return {'message': 'دسترسی غیرمجاز'}, 403

        data = request.get_json()
        quiz = Quiz(
            title=data['title'],
            description=data.get('description', ''),
            course_id=data.get('course_id'),
            passing_score=data.get('passing_score', 70),
            time_limit=data.get('time_limit'),
            max_attempts=data.get('max_attempts', 3)
        )
        db.session.add(quiz)
        db.session.commit()
        return {'message': 'آزمون ایجاد شد', 'id': quiz.id}, 201


@quiz_ns.route('/<int:quiz_id>')
class QuizDetail(Resource):
    def get(self, quiz_id):
        """دریافت جزئیات آزمون با سوالات"""
        quiz = Quiz.query.get_or_404(quiz_id)
        return {
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'passing_score': quiz.passing_score,
            'time_limit': quiz.time_limit,
            'max_attempts': quiz.max_attempts,
            'total_points': sum(q.points for q in quiz.questions),
            'questions': [{
                'id': q.id,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'options': json.loads(q.options) if q.options else [],
                'points': q.points,
                'order': q.order
            } for q in sorted(quiz.questions, key=lambda x: x.order)]
        }


@quiz_ns.route('/<int:quiz_id>/questions')
class QuestionManagement(Resource):
    @jwt_required()
    @quiz_ns.expect(question_model)
    def post(self, quiz_id):
        """اضافه کردن سوال به آزمون"""
        user_id = get_jwt_identity()
        from models import User
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return {'message': 'دسترسی غیرمجاز'}, 403

        data = request.get_json()
        question = Question(
            quiz_id=quiz_id,
            question_text=data['question_text'],
            question_type=data.get('question_type', 'multiple_choice'),
            options=data.get('options'),
            correct_answer=data['correct_answer'],
            points=data.get('points', 10),
            explanation=data.get('explanation', ''),
            order=data.get('order', 0)
        )
        db.session.add(question)
        db.session.commit()
        return {'message': 'سوال اضافه شد', 'id': question.id}, 201


@quiz_ns.route('/<int:quiz_id>/start')
class StartQuiz(Resource):
    @jwt_required()
    def post(self, quiz_id):
        """شروع آزمون"""
        user_id = get_jwt_identity()
        quiz = Quiz.query.get_or_404(quiz_id)

        # بررسی تعداد دفعات مجاز
        attempts = QuizAttempt.query.filter_by(
            user_id=user_id,
            quiz_id=quiz_id
        ).count()

        if attempts >= quiz.max_attempts:
            return {'message': 'تعداد دفعات مجاز به پایان رسیده است'}, 400

        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            total_points=sum(q.points for q in quiz.questions),
            answers='{}'
        )
        db.session.add(attempt)
        db.session.commit()

        return {
            'message': 'آزمون شروع شد',
            'attempt_id': attempt.id,
            'started_at': attempt.started_at.isoformat()
        }


@quiz_ns.route('/attempt/<int:attempt_id>/submit')
class SubmitQuiz(Resource):
    @jwt_required()
    def post(self, attempt_id):
        """ثبت پاسخ‌ها و پایان آزمون"""
        user_id = get_jwt_identity()
        attempt = QuizAttempt.query.get_or_404(attempt_id)

        if attempt.user_id != int(user_id):
            return {'message': 'دسترسی غیرمجاز'}, 403

        if attempt.completed_at:
            return {'message': 'این آزمون قبلاً به پایان رسیده است'}, 400

        data = request.get_json()
        user_answers = data.get('answers', {})

        # محاسبه نمره
        quiz = attempt.quiz
        score = 0
        for question in quiz.questions:
            correct = question.correct_answer
            user_answer = user_answers.get(str(question.id), '')
            if user_answer == correct:
                score += question.points

        # محاسبه درصد
        total = sum(q.points for q in quiz.questions)
        percentage = (score / total * 100) if total > 0 else 0

        # بروزرسانی
        attempt.answers = json.dumps(user_answers)
        attempt.score = score
        attempt.passed = percentage >= quiz.passing_score
        attempt.completed_at = datetime.utcnow()
        db.session.commit()

        # ایجاد گواهینامه در صورت قبولی
        certificate = None
        if attempt.passed:
            cert_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
            certificate = Certificate(
                user_id=user_id,
                course_id=quiz.course_id,
                quiz_attempt_id=attempt.id,
                certificate_code=cert_code
            )
            db.session.add(certificate)
            db.session.commit()

        return {
            'score': score,
            'total': total,
            'percentage': round(percentage, 1),
            'passed': attempt.passed,
            'certificate_code': certificate.certificate_code if certificate else None,
            'correct_answers': {
                str(q.id): q.correct_answer for q in quiz.questions
            }
        }


@quiz_ns.route('/certificates')
class UserCertificates(Resource):
    @jwt_required()
    def get(self):
        """گواهینامه‌های کاربر"""
        user_id = get_jwt_identity()
        certificates = Certificate.query.filter_by(user_id=user_id).all()
        return [{
            'id': c.id,
            'course_title': c.course.title if c.course else 'نامشخص',
            'certificate_code': c.certificate_code,
            'score': c.quiz_attempt.score if c.quiz_attempt else 0,
            'issued_at': c.issued_at.isoformat() if c.issued_at else None
        } for c in certificates]