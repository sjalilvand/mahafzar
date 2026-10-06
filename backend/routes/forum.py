from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, ForumCategory, ForumTopic, ForumPost, TopicVote, PostVote, ForumTag
from datetime import datetime
from sqlalchemy import or_, desc, func
import re
from flask_jwt_extended import jwt_required, get_jwt_identity

forum_ns = Namespace('forum', description='Forum operations')


def generate_slug(title):
    """تولید slug از عنوان"""
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:200]


# ===== CATEGORIES =====
@forum_ns.route('/categories')
class CategoryList(Resource):
    def get(self):
        """لیست دسته‌بندی‌ها"""
        categories = ForumCategory.query.filter_by(is_active=True) \
            .order_by(ForumCategory.order).all()

        return [{
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'slug': c.slug,
            'icon': c.icon,
            'color': c.color,
            'topics_count': c.topics_count,
            'posts_count': c.posts_count,
            'last_post_at': c.last_post_at.isoformat() if c.last_post_at else None
        } for c in categories]


# ===== TOPICS =====
topic_model = forum_ns.model('Topic', {
    'title': fields.String(required=True, min_length=5, max_length=500),
    'content': fields.String(required=True, min_length=10),
    'category_id': fields.Integer(required=True),
    'tags': fields.String()
})


@forum_ns.route('/topics')
class TopicList(Resource):
    def get(self):
        """لیست تاپیک‌ها"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        sort = request.args.get('sort', 'latest')  # 'latest', 'popular', 'solved'
        search = request.args.get('search')
        tag = request.args.get('tag')

        query = ForumTopic.query

        if category:
            cat = ForumCategory.query.filter_by(slug=category).first()
            if cat:
                query = query.filter_by(category_id=cat.id)

        if search:
            query = query.filter(
                or_(
                    ForumTopic.title.ilike(f'%{search}%'),
                    ForumTopic.content.ilike(f'%{search}%')
                )
            )

        if tag:
            tag_obj = ForumTag.query.filter_by(slug=tag).first()
            if tag_obj:
                topic_ids = [tt.topic_id for tt in TopicTag.query.filter_by(tag_id=tag_obj.id).all()]
                query = query.filter(ForumTopic.id.in_(topic_ids))

        # مرتب‌سازی
        if sort == 'popular':
            query = query.order_by(desc(ForumTopic.upvotes - ForumTopic.downvotes))
        elif sort == 'solved':
            query = query.filter_by(is_solved=True)
        else:
            query = query.order_by(desc(ForumTopic.is_pinned), desc(ForumTopic.last_post_at))

        pagination = query.paginate(page=page, per_page=per_page)

        topics = []
        for topic in pagination.items:
            topics.append(format_topic(topic))

        return {
            'topics': topics,
            'page': page,
            'total_pages': pagination.pages,
            'total_topics': pagination.total
        }

    @jwt_required()
    @forum_ns.expect(topic_model)
    def post(self):
        """ایجاد تاپیک جدید"""
        user_id = get_jwt_identity()
        data = request.get_json()

        slug = generate_slug(data['title'])
        # اطمینان از یکتایی slug
        base_slug = slug
        counter = 1
        while ForumTopic.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        topic = ForumTopic(
            category_id=data['category_id'],
            user_id=user_id,
            title=data['title'],
            slug=slug,
            content=data['content'],
            tags=data.get('tags', '[]'),
            last_post_user_id=user_id
        )
        db.session.add(topic)

        # بروزرسانی آمار دسته‌بندی
        category = ForumCategory.query.get(data['category_id'])
        if category:
            category.topics_count = (category.topics_count or 0) + 1
            category.last_post_at = datetime.utcnow()

        # تگ‌ها
        if data.get('tags'):
            try:
                import json
                tags = json.loads(data['tags'])
                for tag_name in tags:
                    tag = ForumTag.query.filter_by(name=tag_name).first()
                    if not tag:
                        tag = ForumTag(name=tag_name, slug=generate_slug(tag_name))
                        db.session.add(tag)
                        db.session.flush()

                    topic_tag = TopicTag(topic_id=topic.id, tag_id=tag.id)
                    db.session.add(topic_tag)

                    tag.topics_count = (tag.topics_count or 0) + 1
            except:
                pass

        db.session.commit()

        return {
            'message': 'تاپیک ایجاد شد',
            'topic_id': topic.id,
            'slug': topic.slug
        }, 201


@forum_ns.route('/topics/<slug>')
class TopicDetail(Resource):
    @jwt_required(optional=True)
    def get(self, slug):
        """جزئیات تاپیک"""
        topic = ForumTopic.query.filter_by(slug=slug).first_or_404()

        # افزایش بازدید
        topic.views = (topic.views or 0) + 1
        db.session.commit()

        # پست‌ها
        posts = ForumPost.query.filter_by(topic_id=topic.id) \
            .order_by(ForumPost.is_answer.desc(), ForumPost.created_at).all()

        return {
            'topic': format_topic(topic),
            'posts': [format_post(p) for p in posts]
        }


@forum_ns.route('/topics/<int:topic_id>')
class TopicActions(Resource):
    @jwt_required()
    def put(self, topic_id):
        """بروزرسانی تاپیک (پین، قفل، حل شده)"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        topic = ForumTopic.query.get_or_404(topic_id)

        data = request.get_json()
        action = data.get('action')

        if action == 'pin' and (user.role == 'admin' or topic.user_id == int(user_id)):
            topic.is_pinned = not topic.is_pinned
        elif action == 'lock' and user.role == 'admin':
            topic.is_locked = not topic.is_locked
        elif action == 'solved' and topic.user_id == int(user_id):
            topic.is_solved = True
        else:
            return {'message': 'دسترسی غیرمجاز'}, 403

        db.session.commit()
        return {'message': 'بروزرسانی شد'}


# ===== POSTS =====
post_model = forum_ns.model('Post', {
    'content': fields.String(required=True, min_length=2)
})


@forum_ns.route('/topics/<int:topic_id>/posts')
class PostList(Resource):
    @jwt_required()
    @forum_ns.expect(post_model)
    def post(self, topic_id):
        """ارسال پاسخ"""
        user_id = get_jwt_identity()
        topic = ForumTopic.query.get_or_404(topic_id)

        if topic.is_locked:
            return {'message': 'این تاپیک قفل شده است'}, 403

        data = request.get_json()

        post = ForumPost(
            topic_id=topic_id,
            user_id=user_id,
            content=data['content']
        )
        db.session.add(post)

        # بروزرسانی آمار تاپیک
        topic.posts_count = (topic.posts_count or 0) + 1
        topic.last_post_at = datetime.utcnow()
        topic.last_post_user_id = user_id

        # بروزرسانی آمار دسته‌بندی
        category = topic.category
        if category:
            category.posts_count = (category.posts_count or 0) + 1
            category.last_post_at = datetime.utcnow()

        db.session.commit()

        return {
            'message': 'پاسخ ارسال شد',
            'post': format_post(post)
        }, 201


@forum_ns.route('/posts/<int:post_id>')
class PostActions(Resource):
    @jwt_required()
    def put(self, post_id):
        """ویرایش پست"""
        user_id = get_jwt_identity()
        post = ForumPost.query.get_or_404(post_id)

        if post.user_id != int(user_id):
            return {'message': 'دسترسی غیرمجاز'}, 403

        data = request.get_json()
        post.content = data['content']
        post.is_edited = True
        post.edited_at = datetime.utcnow()
        db.session.commit()

        return {'message': 'پست ویرایش شد'}

    @jwt_required()
    def delete(self, post_id):
        """حذف پست"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        post = ForumPost.query.get_or_404(post_id)

        if post.user_id != int(user_id) and user.role != 'admin':
            return {'message': 'دسترسی غیرمجاز'}, 403

        topic = post.topic
        db.session.delete(post)

        # بروزرسانی آمار
        topic.posts_count = max(0, (topic.posts_count or 1) - 1)
        if topic.category:
            topic.category.posts_count = max(0, (topic.category.posts_count or 1) - 1)

        db.session.commit()
        return {'message': 'پست حذف شد'}


@forum_ns.route('/posts/<int:post_id>/answer')
class MarkAsAnswer(Resource):
    @jwt_required()
    def post(self, post_id):
        """علامت‌گذاری به عنوان پاسخ"""
        user_id = get_jwt_identity()
        post = ForumPost.query.get_or_404(post_id)
        topic = post.topic

        if topic.user_id != int(user_id):
            return {'message': 'فقط نویسنده تاپیک می‌تواند پاسخ را علامت بزند'}, 403

        # حذف علامت از همه پست‌ها
        ForumPost.query.filter_by(topic_id=topic.id).update({'is_answer': False})

        # علامت‌گذاری پست جدید
        post.is_answer = True
        topic.is_solved = True
        db.session.commit()

        return {'message': 'پاسخ علامت‌گذاری شد'}


# ===== VOTES =====
@forum_ns.route('/topics/<int:topic_id>/vote')
class TopicVoteEndpoint(Resource):
    @jwt_required()
    def post(self, topic_id):
        """رای به تاپیک"""
        user_id = get_jwt_identity()
        data = request.get_json()
        vote_type = data.get('type', 'up')  # 'up' or 'down'

        existing = TopicVote.query.filter_by(user_id=user_id, topic_id=topic_id).first()
        topic = ForumTopic.query.get_or_404(topic_id)

        if existing:
            if existing.vote_type == vote_type:
                # حذف رای
                if vote_type == 'up':
                    topic.upvotes = max(0, (topic.upvotes or 1) - 1)
                else:
                    topic.downvotes = max(0, (topic.downvotes or 1) - 1)
                db.session.delete(existing)
            else:
                # تغییر رای
                if existing.vote_type == 'up':
                    topic.upvotes = max(0, (topic.upvotes or 1) - 1)
                    topic.downvotes = (topic.downvotes or 0) + 1
                else:
                    topic.downvotes = max(0, (topic.downvotes or 1) - 1)
                    topic.upvotes = (topic.upvotes or 0) + 1
                existing.vote_type = vote_type
        else:
            # رای جدید
            vote = TopicVote(user_id=user_id, topic_id=topic_id, vote_type=vote_type)
            db.session.add(vote)
            if vote_type == 'up':
                topic.upvotes = (topic.upvotes or 0) + 1
            else:
                topic.downvotes = (topic.downvotes or 0) + 1

        db.session.commit()

        return {
            'upvotes': topic.upvotes,
            'downvotes': topic.downvotes,
            'score': (topic.upvotes or 0) - (topic.downvotes or 0)
        }


@forum_ns.route('/posts/<int:post_id>/vote')
class PostVoteEndpoint(Resource):
    @jwt_required()
    def post(self, post_id):
        """رای به پست"""
        user_id = get_jwt_identity()
        data = request.get_json()
        vote_type = data.get('type', 'up')

        existing = PostVote.query.filter_by(user_id=user_id, post_id=post_id).first()
        post = ForumPost.query.get_or_404(post_id)

        if existing:
            if existing.vote_type == vote_type:
                if vote_type == 'up':
                    post.upvotes = max(0, (post.upvotes or 1) - 1)
                else:
                    post.downvotes = max(0, (post.downvotes or 1) - 1)
                db.session.delete(existing)
            else:
                if existing.vote_type == 'up':
                    post.upvotes = max(0, (post.upvotes or 1) - 1)
                    post.downvotes = (post.downvotes or 0) + 1
                else:
                    post.downvotes = max(0, (post.downvotes or 1) - 1)
                    post.upvotes = (post.upvotes or 0) + 1
                existing.vote_type = vote_type
        else:
            vote = PostVote(user_id=user_id, post_id=post_id, vote_type=vote_type)
            db.session.add(vote)
            if vote_type == 'up':
                post.upvotes = (post.upvotes or 0) + 1
            else:
                post.downvotes = (post.downvotes or 0) + 1

        db.session.commit()

        return {
            'upvotes': post.upvotes,
            'downvotes': post.downvotes
        }


# ===== TAGS =====
@forum_ns.route('/tags')
class TagList(Resource):
    def get(self):
        """لیست تگ‌ها"""
        tags = ForumTag.query.order_by(desc(ForumTag.topics_count)).limit(50).all()
        return [{
            'id': t.id,
            'name': t.name,
            'slug': t.slug,
            'color': t.color,
            'topics_count': t.topics_count
        } for t in tags]


# ===== HELPER FUNCTIONS =====
def format_topic(topic):
    return {
        'id': topic.id,
        'title': topic.title,
        'slug': topic.slug,
        'content': topic.content[:500] if len(topic.content) > 500 else topic.content,
        'author': {
            'id': topic.author.id,
            'name': topic.author.full_name,
            'avatar': topic.author.avatar_url
        },
        'category': {
            'id': topic.category.id,
            'name': topic.category.name,
            'slug': topic.category.slug
        },
        'tags': topic.tags,
        'is_pinned': topic.is_pinned,
        'is_locked': topic.is_locked,
        'is_solved': topic.is_solved,
        'views': topic.views,
        'posts_count': topic.posts_count,
        'upvotes': topic.upvotes,
        'downvotes': topic.downvotes,
        'score': (topic.upvotes or 0) - (topic.downvotes or 0),
        'last_post_at': topic.last_post_at.isoformat() if topic.last_post_at else None,
        'last_poster': {
            'name': topic.last_poster.full_name if topic.last_poster else None
        } if topic.last_poster else None,
        'created_at': topic.created_at.isoformat() if topic.created_at else None
    }


def format_post(post):
    return {
        'id': post.id,
        'content': post.content,
        'author': {
            'id': post.author.id,
            'name': post.author.full_name,
            'avatar': post.author.avatar_url,
            'level': post.author.level or 1
        },
        'is_answer': post.is_answer,
        'upvotes': post.upvotes,
        'downvotes': post.downvotes,
        'is_edited': post.is_edited,
        'created_at': post.created_at.isoformat() if post.created_at else None,
        'edited_at': post.edited_at.isoformat() if post.edited_at else None
    }