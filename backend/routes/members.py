from flask_restx import Namespace, Resource
from models import db, Member

members_ns = Namespace('members', description='Member operations')

@members_ns.route('/')
class MemberList(Resource):
    def get(self):
        members = Member.query.order_by(Member.join_date.desc()).all()
        return [{
            'id': m.id,
            'name': m.name,
            'position': m.position,
            'department': m.department,
            'bio': m.bio,
            'skills': m.skills.split(',') if m.skills else [],
            'avatar_url': m.avatar_url,
            'linkedin_url': m.linkedin_url,
            'github_url': m.github_url,
            'is_featured': m.is_featured
        } for m in members]