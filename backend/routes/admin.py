from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Member, Mission, Course, Comment, Suggestion, ChatLog
from functools import wraps

admin_ns = Namespace('admin', description='Admin operations')

# ===== RBAC DECORATOR =====
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return {'message': 'دسترسی غیرمجاز'}, 403
        return f(*args, **kwargs)
    return decorated

# ===== USER MANAGEMENT =====
@admin_ns.route('/users')
class UserManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        users = User.query.all()
        return [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'created_at': u.created_at.isoformat() if u.created_at else None
        } for u in users]

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        user = User.query.get(data['id'])
        if user:
            user.role = data.get('role', user.role)
            user.full_name = data.get('full_name', user.full_name)
            db.session.commit()
            return {'message': 'کاربر به‌روزرسانی شد'}
        return {'message': 'کاربر یافت نشد'}, 404

    @jwt_required()
    @admin_required
    def delete(self):
        data = request.get_json()
        user = User.query.get(data['id'])
        if user and user.role != 'admin':
            db.session.delete(user)
            db.session.commit()
            return {'message': 'کاربر حذف شد'}
        return {'message': 'نمی‌توان ادمین را حذف کرد'}, 400

# ===== MEMBER MANAGEMENT =====
member_model = admin_ns.model('MemberAdmin', {
    'name': fields.String(required=True),
    'position': fields.String(),
    'department': fields.String(),
    'bio': fields.String(),
    'skills': fields.String(),
    'linkedin_url': fields.String(),
    'github_url': fields.String(),
    'is_featured': fields.Boolean()
})

@admin_ns.route('/members')
class MemberManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        members = Member.query.all()
        return [{
            'id': m.id,
            'name': m.name,
            'position': m.position,
            'department': m.department,
            'bio': m.bio,
            'skills': m.skills.split(',') if m.skills else [],
            'is_featured': m.is_featured,
            'linkedin_url': m.linkedin_url,
            'github_url': m.github_url
        } for m in members]

    @jwt_required()
    @admin_required
    @admin_ns.expect(member_model)
    def post(self):
        data = request.get_json()
        member = Member(
            name=data['name'],
            position=data.get('position', ''),
            department=data.get('department', ''),
            bio=data.get('bio', ''),
            skills=data.get('skills', ''),
            linkedin_url=data.get('linkedin_url', ''),
            github_url=data.get('github_url', ''),
            is_featured=data.get('is_featured', False)
        )
        db.session.add(member)
        db.session.commit()
        return {'message': 'عضو جدید اضافه شد', 'id': member.id}, 201

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        member = Member.query.get(data['id'])
        if member:
            for key in ['name', 'position', 'department', 'bio', 'skills', 'linkedin_url', 'github_url', 'is_featured']:
                if key in data:
                    setattr(member, key, data[key])
            db.session.commit()
            return {'message': 'اطلاعات عضو به‌روزرسانی شد'}
        return {'message': 'عضو یافت نشد'}, 404

    @jwt_required()
    @admin_required
    def delete(self):
        data = request.get_json()
        member = Member.query.get(data['id'])
        if member:
            db.session.delete(member)
            db.session.commit()
            return {'message': 'عضو حذف شد'}
        return {'message': 'عضو یافت نشد'}, 404

# ===== COURSE MANAGEMENT =====
course_model = admin_ns.model('CourseAdmin', {
    'title': fields.String(required=True),
    'description': fields.String(),
    'content': fields.String(),
    'category': fields.String(),
    'level': fields.String(),
    'duration': fields.String(),
    'tags': fields.String(),
    'is_published': fields.Boolean()
})

@admin_ns.route('/courses')
class CourseManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        courses = Course.query.all()
        return [{
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'category': c.category,
            'level': c.level,
            'duration': c.duration,
            'is_published': c.is_published,
            'view_count': c.view_count,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in courses]

    @jwt_required()
    @admin_required
    @admin_ns.expect(course_model)
    def post(self):
        data = request.get_json()
        course = Course(
            title=data['title'],
            description=data.get('description', ''),
            content=data.get('content', ''),
            category=data.get('category', ''),
            level=data.get('level', 'beginner'),
            duration=data.get('duration', ''),
            tags=data.get('tags', ''),
            is_published=data.get('is_published', True)
        )
        db.session.add(course)
        db.session.commit()
        return {'message': 'دوره جدید ایجاد شد', 'id': course.id}, 201

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        course = Course.query.get(data['id'])
        if course:
            for key in ['title', 'description', 'content', 'category', 'level', 'duration', 'tags', 'is_published']:
                if key in data:
                    setattr(course, key, data[key])
            db.session.commit()
            return {'message': 'دوره به‌روزرسانی شد'}
        return {'message': 'دوره یافت نشد'}, 404

    @jwt_required()
    @admin_required
    def delete(self):
        data = request.get_json()
        course = Course.query.get(data['id'])
        if course:
            db.session.delete(course)
            db.session.commit()
            return {'message': 'دوره حذف شد'}
        return {'message': 'دوره یافت نشد'}, 404

# ===== COMMENT MANAGEMENT =====
@admin_ns.route('/comments')
class CommentManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        comments = Comment.query.order_by(Comment.created_at.desc()).all()
        return [{
            'id': c.id,
            'content': c.content,
            'author': c.author.full_name if c.author else 'ناشناس',
            'course_title': c.course.title if c.course else 'بدون دوره',
            'is_approved': c.is_approved,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in comments]

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        comment = Comment.query.get(data['id'])
        if comment:
            comment.is_approved = data.get('is_approved', comment.is_approved)
            db.session.commit()
            return {'message': 'وضعیت نظر تغییر کرد'}
        return {'message': 'نظر یافت نشد'}, 404

    @jwt_required()
    @admin_required
    def delete(self):
        data = request.get_json()
        comment = Comment.query.get(data['id'])
        if comment:
            db.session.delete(comment)
            db.session.commit()
            return {'message': 'نظر حذف شد'}
        return {'message': 'نظر یافت نشد'}, 404

# ===== FEEDBACK MANAGEMENT =====
@admin_ns.route('/suggestions')
class FeedbackManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        suggestions = Suggestion.query.order_by(Suggestion.created_at.desc()).all()
        return [{
            'id': s.id,
            'subject': s.subject,
            'content': s.content,
            'category': s.category,
            'status': s.status,
            'author': s.user.full_name if s.user else 'ناشناس',
            'admin_response': s.admin_response,
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in suggestions]

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        suggestion = Suggestion.query.get(data['id'])
        if suggestion:
            suggestion.status = data.get('status', suggestion.status)
            suggestion.admin_response = data.get('admin_response', suggestion.admin_response)
            db.session.commit()
            return {'message': 'بازخورد به‌روزرسانی شد'}
        return {'message': 'بازخورد یافت نشد'}, 404

# ===== CHAT HISTORY =====
@admin_ns.route('/chats')
class ChatHistoryManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        chats = ChatLog.query.order_by(ChatLog.created_at.desc()).limit(100).all()
        return [{
            'id': c.id,
            'username': c.user.full_name if c.user else 'ناشناس',
            'message': c.message,
            'response': c.response,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in chats]

# ===== MISSION MANAGEMENT =====
@admin_ns.route('/missions')
class MissionManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        missions = Mission.query.all()
        return [{
            'id': m.id,
            'title': m.title,
            'content': m.content,
            'icon': m.icon,
            'mission_type': m.mission_type,
            'order': m.order,
            'is_active': m.is_active
        } for m in missions]

    @jwt_required()
    @admin_required
    def put(self):
        data = request.get_json()
        mission = Mission.query.get(data['id'])
        if mission:
            for key in ['title', 'content', 'icon', 'mission_type', 'order', 'is_active']:
                if key in data:
                    setattr(mission, key, data[key])
            db.session.commit()
            return {'message': 'ماموریت به‌روزرسانی شد'}
        return {'message': 'ماموریت یافت نشد'}, 404

# ===== DASHBOARD STATS =====
@admin_ns.route('/stats')
class AdminStats(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        return {
            'total_users': User.query.count(),
            'total_members': Member.query.count(),
            'total_courses': Course.query.count(),
            'total_comments': Comment.query.count(),
            'total_suggestions': Suggestion.query.count(),
            'total_chats': ChatLog.query.count(),
            'total_views': db.session.query(db.func.sum(Course.view_count)).scalar() or 0
        }