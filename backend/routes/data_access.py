from flask_restx import Namespace, Resource
from models import db, DataAccess

data_ns = Namespace('data', description='Data access operations')

@data_ns.route('/')
class DataAccessList(Resource):
    def get(self):
        accesses = DataAccess.query.filter_by(is_active=True).all()
        return [{
            'id': a.id,
            'title': a.title,
            'description': a.description,
            'access_type': a.access_type,
            'url': a.url,
            'documentation': a.documentation
        } for a in accesses]