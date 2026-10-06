from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Course, Comment, Rating
from sqlalchemy import or_

courses_ns = Namespace('courses', description='Course operations')

course_model = courses_ns.model('Course', {
    'title': fields.String(required=True),
    'description': fields.String(),
    'content': fields.String(),
    'category': fields.String(),
    'level': fields.String(),
    'tags': fields.String(),
    'video_url': fields.String(),
    'thumbnail_url': fields.String()
})

comment_model = courses_ns.model('Comment', {
    'content': fields.String(required=True),
    'parent_id': fields.Integer()
})


@courses_ns.route('/')
class CourseList(Resource):
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        category = request.args.get('category')
        level = request.args.get('level')
        search = request.args.get('search')
        sort = request.args.get('sort', 'newest')  # 'newest', 'popular', 'rating'

        query = Course.query.filter_by(is_published=True)

        if category:
            query = query.filter_by(category=category)
        if level:
            query = query.filter_by(level=level)
        if search:
            query = query.filter(
                or_(
                    Course.title.ilike(f'%{search}%'),
                    Course.description.ilike(f'%{search}%'),
                    Course.tags.ilike(f'%{search}%')
                )
            )

        if sort == 'popular':
            query = query.order_by(Course.view_count.desc())
        elif sort == 'rating':
            # This would need a more complex query, simplified here
            query = query.order_by(Course.created_at.desc())
        else:  # newest
            query = query.order_by(Course.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page)

        courses = []
        for course in pagination.items:
            avg_rating = db.session.query(db.func.avg(Rating.score)) \
                             .filter_by(course_id=course.id).scalar() or 0

            courses.append({
                'id': course.id,
                'title': course.title,
                'description': course.description[:200] + '...' if len(
                    course.description) > 200 else course.description,
                'category': course.category,
                'level': course.level,
                'tags': course.tags.split(',') if course.tags else [],
                'thumbnail_url': course.thumbnail_url,
                'duration': course.duration,
                'view_count': course.view_count,
                'avg_rating': round(float(avg_rating), 1),
                'comment_count': Comment.query.filter_by(course_id=course.id).count(),
                'created_at': course.created_at.isoformat()
            })

        return {
            'courses': courses,
            'page': page,
            'total_pages': pagination.pages,
            'total_courses': pagination.total
        }


@courses_ns.route('/<int:course_id>')
class CourseDetail(Resource):
    def get(self, course_id):
        course = Course.query.get_or_404(course_id)
        course.view_count += 1
        db.session.commit()

        avg_rating = db.session.query(db.func.avg(Rating.score)) \
                         .filter_by(course_id=course.id).scalar() or 0

        comments = Comment.query.filter_by(
            course_id=course_id,
            parent_id=None,
            is_approved=True
        ).order_by(Comment.created_at.desc()).all()

        comments_data = []
        for comment in comments:
            replies = Comment.query.filter_by(parent_id=comment.id, is_approved=True).all()
            comments_data.append({
                'id': comment.id,
                'content': comment.content,
                'author': comment.author.full_name,
                'author_avatar': comment.author.avatar_url,
                'created_at': comment.created_at.isoformat(),
                'replies': [{
                    'id': reply.id,
                    'content': reply.content,
                    'author': reply.author.full_name,
                    'created_at': reply.created_at.isoformat()
                } for reply in replies]
            })

        return {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'content': course.content,
            'category': course.category,
            'level': course.level,
            'tags': course.tags.split(',') if course.tags else [],
            'video_url': course.video_url,
            'thumbnail_url': course.thumbnail_url,
            'duration': course.duration,
            'view_count': course.view_count,
            'avg_rating': round(float(avg_rating), 1),
            'comments': comments_data,
            'created_at': course.created_at.isoformat()
        }


@courses_ns.route('/<int:course_id>/comments')
class CourseComments(Resource):
    @jwt_required()
    @courses_ns.expect(comment_model)
    def post(self, course_id):
        user_id = get_jwt_identity()
        data = request.get_json()

        comment = Comment(
            content=data['content'],
            user_id=user_id,
            course_id=course_id,
            parent_id=data.get('parent_id')
        )

        db.session.add(comment)
        db.session.commit()

        return {'message': 'نظر شما با موفقیت ثبت شد'}, 201


@courses_ns.route('/<int:course_id>/rate')
class CourseRating(Resource):
    @jwt_required()
    def post(self, course_id):
        user_id = get_jwt_identity()
        data = request.get_json()
        score = data.get('score', 5)

        if score < 1 or score > 5:
            return {'message': 'امتیاز باید بین ۱ تا ۵ باشد'}, 400

        existing = Rating.query.filter_by(user_id=user_id, course_id=course_id).first()
        if existing:
            existing.score = score
        else:
            rating = Rating(user_id=user_id, course_id=course_id, score=score)
            db.session.add(rating)

        db.session.commit()

        avg_rating = db.session.query(db.func.avg(Rating.score)) \
            .filter_by(course_id=course_id).scalar()

        return {
            'message': 'امتیاز شما ثبت شد',
            'avg_rating': round(float(avg_rating), 1)
        }