from flask_restx import Namespace, Resource
from models import db, Mission

missions_ns = Namespace('missions', description='Mission operations')


@missions_ns.route('/')
class MissionList(Resource):
    def get(self):
        missions = Mission.query.filter_by(is_active=True) \
            .order_by(Mission.order).all()

        return [{
            'id': m.id,
            'title': m.title,
            'content': m.content,
            'icon': m.icon,
            'mission_type': m.mission_type
        } for m in missions]