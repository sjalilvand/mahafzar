from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from models import db, User
from datetime import timedelta

auth_ns = Namespace('auth', description='Authentication operations')

signup_model = auth_ns.model('SignUp', {
    'username': fields.String(required=True, min_length=3, max_length=80),
    'email': fields.String(required=True),
    'password': fields.String(required=True, min_length=6),
    'full_name': fields.String(required=True)
})

login_model = auth_ns.model('Login', {
    'username': fields.String(required=True),
    'password': fields.String(required=True)
})


@auth_ns.route('/signup')
class SignUp(Resource):
    @auth_ns.expect(signup_model)
    def post(self):
        data = request.get_json()

        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return {'message': 'نام کاربری قبلاً ثبت شده است'}, 400

        if User.query.filter_by(email=data['email']).first():
            return {'message': 'ایمیل قبلاً ثبت شده است'}, 400

        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=(data.get('full_name') or data.get('name') or data.get('username') or '')
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        # Create token
        access_token = create_access_token(
            identity=str(user.id),  # تبدیل به string
            expires_delta=timedelta(days=30),
            additional_claims={
                'username': user.username,
                'role': user.role
            }
        )

        return {
            'message': 'ثبت‌نام با موفقیت انجام شد',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role
            }
        }, 201


@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        data = request.get_json()

        # Find user
        user = User.query.filter_by(username=data['username']).first()

        if not user or not user.check_password(data['password']):
            return {'message': 'نام کاربری یا رمز عبور اشتباه است'}, 401

        # Create token
        access_token = create_access_token(
            identity=str(user.id),  # تبدیل به string
            expires_delta=timedelta(days=30),
            additional_claims={
                'username': user.username,
                'role': user.role
            }
        )

        return {
            'message': 'ورود موفقیت‌آمیز',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role
            }
        }, 200


@auth_ns.route('/profile')
class Profile(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get user ID from token
            user_id = get_jwt_identity()

            # پیدا کردن کاربر
            user = User.query.get(int(user_id))

            if not user:
                return {'message': 'کاربر یافت نشد'}, 404

            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'bio': user.bio,
                'avatar_url': user.avatar_url
            }, 200

        except Exception as e:
            return {'message': f'خطا در دریافت اطلاعات کاربر: {str(e)}'}, 500
