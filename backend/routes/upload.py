import os
import uuid
from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
from models import db, User

upload_ns = Namespace('upload', description='File upload operations')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_avatar(file, user_id, folder='avatars'):
    """ذخیره و resize آواتار"""
    upload_dir = os.path.join('uploads', folder)
    os.makedirs(upload_dir, exist_ok=True)

    # ایجاد نام فایل یکتا
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    # باز کردن و resize تصویر
    img = Image.open(file)

    # تبدیل به RGB اگر PNG با کانال آلفا باشد
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # resize به 300x300
    img.thumbnail((300, 300), Image.Resampling.LANCZOS)

    # ذخیره با کیفیت مناسب
    img.save(filepath, 'JPEG', quality=85, optimize=True)

    return f'/uploads/{folder}/{filename}'


def save_cover(file, user_id):
    """ذخیره و resize کاور پروفایل"""
    upload_dir = os.path.join('uploads', 'covers')
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"cover_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    img = Image.open(file)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # resize به 1200x400
    img = img.resize((1200, 400), Image.Resampling.LANCZOS)
    img.save(filepath, 'JPEG', quality=85, optimize=True)

    return f'/uploads/covers/{filename}'


@upload_ns.route('/avatar')
class AvatarUpload(Resource):
    @jwt_required()
    def post(self):
        """آپلود آواتار"""
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return {'message': 'فایلی انتخاب نشده'}, 400

        file = request.files['file']

        if file.filename == '':
            return {'message': 'فایلی انتخاب نشده'}, 400

        if not allowed_file(file.filename):
            return {'message': 'فرمت فایل مجاز نیست. فرمت‌های مجاز: PNG, JPG, JPEG, GIF, WebP'}, 400

        # بررسی سایز
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)

        if size > MAX_FILE_SIZE:
            return {'message': 'حجم فایل نباید بیشتر از ۵ مگابایت باشد'}, 400

        try:
            # ذخیره فایل
            avatar_path = save_avatar(file, user_id)

            # بروزرسانی کاربر
            user = User.query.get(int(user_id))
            if user:
                # حذف آواتار قبلی
                if user.avatar_url and os.path.exists(user.avatar_url.lstrip('/')):
                    try:
                        os.remove(user.avatar_url.lstrip('/'))
                    except:
                        pass

                user.avatar_url = avatar_path
                db.session.commit()

            return {
                'message': 'آواتار با موفقیت آپلود شد',
                'avatar_url': avatar_path
            }, 200

        except Exception as e:
            return {'message': f'خطا در آپلود: {str(e)}'}, 500


@upload_ns.route('/cover')
class CoverUpload(Resource):
    @jwt_required()
    def post(self):
        """آپلود کاور پروفایل"""
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return {'message': 'فایلی انتخاب نشده'}, 400

        file = request.files['file']

        if file.filename == '':
            return {'message': 'فایلی انتخاب نشده'}, 400

        if not allowed_file(file.filename):
            return {'message': 'فرمت فایل مجاز نیست'}, 400

        try:
            cover_path = save_cover(file, user_id)

            user = User.query.get(int(user_id))
            if user:
                if user.cover_url and os.path.exists(user.cover_url.lstrip('/')):
                    try:
                        os.remove(user.cover_url.lstrip('/'))
                    except:
                        pass

                user.cover_url = cover_path
                db.session.commit()

            return {
                'message': 'کاور با موفقیت آپلود شد',
                'cover_url': cover_path
            }, 200

        except Exception as e:
            return {'message': f'خطا در آپلود: {str(e)}'}, 500