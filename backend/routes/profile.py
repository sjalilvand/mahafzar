from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, UserSkill, Education, WorkExperience, UserActivity, Certificate
from datetime import datetime
import json

profile_ns = Namespace('profile', description='User profile operations')

# ===== MODELS =====
skill_model = profile_ns.model('Skill', {
    'skill_name': fields.String(required=True),
    'proficiency': fields.Integer(default=50),
    'category': fields.String()
})

education_model = profile_ns.model('Education', {
    'institution': fields.String(required=True),
    'degree': fields.String(),
    'field': fields.String(),
    'start_year': fields.Integer(),
    'end_year': fields.Integer(),
    'is_current': fields.Boolean(default=False)
})

experience_model = profile_ns.model('Experience', {
    'company': fields.String(required=True),
    'position': fields.String(),
    'description': fields.String(),
    'start_date': fields.String(),
    'end_date': fields.String(),
    'is_current': fields.Boolean(default=False)
})


@profile_ns.route('/')
class UserProfile(Resource):
    @jwt_required()
    def get(self):
        """دریافت پروفایل کامل کاربر"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))

        if not user:
            return {'message': 'کاربر یافت نشد'}, 404

        # بروزرسانی آخرین لاگین
        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1

        # ثبت فعالیت
        activity = UserActivity(
            user_id=user.id,
            activity_type='profile_view',
            description='مشاهده پروفایل'
        )
        db.session.add(activity)
        db.session.commit()

        return format_user_profile(user)

    @jwt_required()
    def put(self):
        """بروزرسانی پروفایل"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))

        if not user:
            return {'message': 'کاربر یافت نشد'}, 404

        data = request.get_json()

        # فیلدهای قابل بروزرسانی
        updatable_fields = [
            'full_name', 'bio', 'title', 'location',
            'website', 'github', 'linkedin', 'twitter', 'phone',
            'theme_preference', 'language', 'email_notifications', 'sms_notifications'
        ]

        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])

        user.updated_at = datetime.utcnow()

        # ثبت فعالیت
        activity = UserActivity(
            user_id=user.id,
            activity_type='profile_update',
            description='بروزرسانی پروفایل',
            metadata=json.dumps({'fields': list(data.keys())})
        )
        db.session.add(activity)
        db.session.commit()

        return {
            'message': 'پروفایل با موفقیت بروزرسانی شد',
            'user': format_user_profile(user)
        }


@profile_ns.route('/public/<int:user_id>')
class PublicProfile(Resource):
    def get(self, user_id):
        """دریافت پروفایل عمومی کاربر"""
        user = User.query.get(user_id)
        if not user:
            return {'message': 'کاربر یافت نشد'}, 404

        return {
            'id': user.id,
            'full_name': user.full_name,
            'avatar_url': user.avatar_url,
            'cover_url': user.cover_url,
            'bio': user.bio,
            'title': user.title,
            'location': user.location,
            'skills': [{
                'name': s.skill_name,
                'proficiency': s.proficiency,
                'category': s.category
            } for s in user.skills],
            'points': user.points,
            'level': user.level,
            'badges': [{
                'name': b.badge_name,
                'icon': b.badge_icon,
                'description': b.badge_description
            } for b in UserBadge.query.filter_by(user_id=user.id).all()],
            'joined_at': user.created_at.isoformat() if user.created_at else None
        }


@profile_ns.route('/skills')
class UserSkills(Resource):
    @jwt_required()
    def get(self):
        """دریافت مهارت‌های کاربر"""
        user_id = get_jwt_identity()
        skills = UserSkill.query.filter_by(user_id=user_id).all()
        return [{
            'id': s.id,
            'skill_name': s.skill_name,
            'proficiency': s.proficiency,
            'category': s.category
        } for s in skills]

    @jwt_required()
    @profile_ns.expect(skill_model)
    def post(self):
        """اضافه کردن مهارت"""
        user_id = get_jwt_identity()
        data = request.get_json()

        # بررسی تکراری نبودن
        existing = UserSkill.query.filter_by(
            user_id=user_id,
            skill_name=data['skill_name']
        ).first()

        if existing:
            existing.proficiency = data.get('proficiency', existing.proficiency)
            existing.category = data.get('category', existing.category)
        else:
            skill = UserSkill(
                user_id=user_id,
                skill_name=data['skill_name'],
                proficiency=data.get('proficiency', 50),
                category=data.get('category', '')
            )
            db.session.add(skill)

        db.session.commit()
        return {'message': 'مهارت اضافه شد'}

    @jwt_required()
    def delete(self):
        """حذف مهارت"""
        user_id = get_jwt_identity()
        data = request.get_json()
        skill = UserSkill.query.filter_by(id=data['id'], user_id=user_id).first()
        if skill:
            db.session.delete(skill)
            db.session.commit()
            return {'message': 'مهارت حذف شد'}
        return {'message': 'مهارت یافت نشد'}, 404


@profile_ns.route('/education')
class UserEducation(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        educations = Education.query.filter_by(user_id=user_id).order_by(Education.start_year.desc()).all()
        return [{
            'id': e.id,
            'institution': e.institution,
            'degree': e.degree,
            'field': e.field,
            'start_year': e.start_year,
            'end_year': e.end_year,
            'is_current': e.is_current
        } for e in educations]

    @jwt_required()
    @profile_ns.expect(education_model)
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()

        education = Education(
            user_id=user_id,
            institution=data['institution'],
            degree=data.get('degree', ''),
            field=data.get('field', ''),
            start_year=data.get('start_year'),
            end_year=data.get('end_year'),
            is_current=data.get('is_current', False)
        )
        db.session.add(education)
        db.session.commit()
        return {'message': 'تحصیلات اضافه شد', 'id': education.id}, 201

    @jwt_required()
    def delete(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        education = Education.query.filter_by(id=data['id'], user_id=user_id).first()
        if education:
            db.session.delete(education)
            db.session.commit()
            return {'message': 'تحصیلات حذف شد'}
        return {'message': 'یافت نشد'}, 404


@profile_ns.route('/experience')
class UserExperience(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        experiences = WorkExperience.query.filter_by(user_id=user_id).order_by(WorkExperience.start_date.desc()).all()
        return [{
            'id': e.id,
            'company': e.company,
            'position': e.position,
            'description': e.description,
            'start_date': e.start_date.isoformat() if e.start_date else None,
            'end_date': e.end_date.isoformat() if e.end_date else None,
            'is_current': e.is_current
        } for e in experiences]

    @jwt_required()
    @profile_ns.expect(experience_model)
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()

        experience = WorkExperience(
            user_id=user_id,
            company=data['company'],
            position=data.get('position', ''),
            description=data.get('description', ''),
            start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
            is_current=data.get('is_current', False)
        )
        db.session.add(experience)
        db.session.commit()
        return {'message': 'سابقه کاری اضافه شد', 'id': experience.id}, 201


@profile_ns.route('/activities')
class UserActivities(Resource):
    @jwt_required()
    def get(self):
        """تاریخچه فعالیت‌ها"""
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        activities = UserActivity.query.filter_by(user_id=user_id) \
            .order_by(UserActivity.created_at.desc()) \
            .paginate(page=page, per_page=per_page)

        return {
            'activities': [{
                'id': a.id,
                'type': a.activity_type,
                'description': a.description,
                'created_at': a.created_at.isoformat() if a.created_at else None
            } for a in activities.items],
            'page': page,
            'total_pages': activities.pages
        }


@profile_ns.route('/stats')
class UserStats(Resource):
    @jwt_required()
    def get(self):
        """آمار کاربر"""
        user_id = get_jwt_identity()

        from models import QuizAttempt, Comment, Course

        total_courses = 0
        total_quizzes = QuizAttempt.query.filter_by(user_id=user_id).count()
        total_comments = Comment.query.filter_by(user_id=user_id).count()
        total_certificates = Certificate.query.filter_by(user_id=user_id).count()

        user = User.query.get(int(user_id))

        return {
            'points': user.points or 0,
            'level': user.level or 1,
            'experience': user.experience or 0,
            'total_courses': total_courses,
            'total_quizzes': total_quizzes,
            'total_comments': total_comments,
            'total_certificates': total_certificates,
            'login_count': user.login_count or 0,
            'joined_at': user.created_at.isoformat() if user.created_at else None
        }


def format_user_profile(user):
    """فرمت کردن پروفایل کامل کاربر"""
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'avatar_url': user.avatar_url,
        'cover_url': user.cover_url,
        'bio': user.bio,
        'title': user.title,
        'location': user.location,
        'website': user.website,
        'github': user.github,
        'linkedin': user.linkedin,
        'twitter': user.twitter,
        'phone': user.phone,
        'role': user.role,
        'points': user.points or 0,
        'level': user.level or 1,
        'experience': user.experience or 0,
        'theme_preference': user.theme_preference,
        'language': user.language,
        'email_notifications': user.email_notifications,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'skills': [{
            'id': s.id,
            'skill_name': s.skill_name,
            'proficiency': s.proficiency,
            'category': s.category
        } for s in user.skills],
        'educations': [{
            'id': e.id,
            'institution': e.institution,
            'degree': e.degree,
            'field': e.field,
            'start_year': e.start_year,
            'end_year': e.end_year,
            'is_current': e.is_current
        } for e in user.educations],
        'experiences': [{
            'id': exp.id,
            'company': exp.company,
            'position': exp.position,
            'description': exp.description,
            'start_date': exp.start_date.isoformat() if exp.start_date else None,
            'end_date': exp.end_date.isoformat() if exp.end_date else None,
            'is_current': exp.is_current
        } for exp in user.experiences]
    }