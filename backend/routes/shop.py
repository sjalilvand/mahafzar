# -*- coding: utf-8 -*-
"""MahAI Shop - products, categories, articles, orders, checkout"""
from datetime import datetime, timedelta
import re, secrets
from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from routes.business import _uid, _is_admin, BizCoupon, BizWalletTx

shop_ns = Namespace('shop', description='Frooshgah-e software products va maqalat')


def _slugify(s):
    s = re.sub(r'\s+', '-', (s or 'x').strip())
    return s[:80] or 'item'


def _uniq_slug(model, s):
    base = _slugify(s); slug = base; n = 1
    while model.query.filter_by(slug=slug).first():
        n += 1; slug = base + '-' + str(n)
    return slug


def _final_price(p):
    return int(p.price * (100 - (p.discount_percent or 0)) / 100)


def _flash_active(p):
    return bool(p.flash_until and p.flash_until > datetime.utcnow())


class ShopCategory(db.Model):
    __tablename__ = 'shop_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    products = db.relationship('ShopProduct', backref='category', lazy=True)


class ShopProduct(db.Model):
    __tablename__ = 'shop_products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(140), unique=True, nullable=False, index=True)
    short_desc = db.Column(db.String(300), default='')
    description = db.Column(db.Text, default='')
    price = db.Column(db.Integer, default=0)
    discount_percent = db.Column(db.Integer, default=0)
    flash_until = db.Column(db.DateTime, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('shop_categories.id'), nullable=True)
    image_url = db.Column(db.String(400), default='')
    file_url = db.Column(db.String(400), default='')
    is_active = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)
    sales_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'slug': self.slug,
                'short_desc': self.short_desc, 'description': self.description,
                'price': self.price, 'discount_percent': self.discount_percent,
                'final_price': _final_price(self), 'flash_active': _flash_active(self),
                'flash_until': self.flash_until.isoformat() if self.flash_until else None,
                'category': self.category.name if self.category else None,
                'category_id': self.category_id, 'image_url': self.image_url,
                'featured': self.featured, 'sales_count': self.sales_count,
                'created_at': self.created_at.isoformat() if self.created_at else None}


class ShopArticle(db.Model):
    __tablename__ = 'shop_articles'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(250), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    excerpt = db.Column(db.String(400), default='')
    body = db.Column(db.Text, default='')
    cover_url = db.Column(db.String(400), default='')
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full=False):
        d = {'id': self.id, 'title': self.title, 'slug': self.slug, 'excerpt': self.excerpt,
             'cover_url': self.cover_url,
             'created_at': self.created_at.isoformat() if self.created_at else None}
        if full: d['body'] = self.body
        return d


class ShopOrder(db.Model):
    __tablename__ = 'shop_orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    total = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='pending')
    ref_code = db.Column(db.String(40), default='')
    coupon_code = db.Column(db.String(40), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('ShopOrderItem', backref='order', lazy=True, cascade='all, delete-orphan')


class ShopOrderItem(db.Model):
    __tablename__ = 'shop_order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('shop_orders.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), default='')
    unit_price = db.Column(db.Integer, default=0)
    qty = db.Column(db.Integer, default=1)


# ---------------- PUBLIC ----------------
@shop_ns.route('/categories')
class Categories(Resource):
    def get(self):
        rows = ShopCategory.query.order_by(ShopCategory.name).all()
        return {'categories': [{'id': c.id, 'name': c.name, 'slug': c.slug,
                                'count': ShopProduct.query.filter_by(category_id=c.id, is_active=True).count()}
                               for c in rows]}, 200


@shop_ns.route('/products')
class Products(Resource):
    def get(self):
        q = ShopProduct.query.filter_by(is_active=True)
        s = (request.args.get('q') or '').strip()
        if s:
            like = '%' + s + '%'
            q = q.filter(db.or_(ShopProduct.name.ilike(like), ShopProduct.short_desc.ilike(like)))
        cat = request.args.get('category')
        if cat:
            c = ShopCategory.query.filter_by(slug=cat).first()
            if c: q = q.filter_by(category_id=c.id)
        sort = request.args.get('sort') or 'newest'
        if sort == 'cheap': q = q.order_by(ShopProduct.price.asc())
        elif sort == 'expensive': q = q.order_by(ShopProduct.price.desc())
        elif sort == 'discount': q = q.order_by(ShopProduct.discount_percent.desc())
        elif sort == 'popular': q = q.order_by(ShopProduct.sales_count.desc())
        else: q = q.order_by(ShopProduct.created_at.desc())
        rows = q.limit(60).all()
        rows.sort(key=lambda p: (not _flash_active(p)))
        return {'products': [p.to_dict() for p in rows], 'count': len(rows)}, 200


@shop_ns.route('/products/<slug>')
class ProductDetail(Resource):
    def get(self, slug):
        p = ShopProduct.query.filter_by(slug=slug, is_active=True).first()
        if not p: return {'message': 'محصول یافت نشد'}, 404
        related = []
        if p.category_id:
            related = [x.to_dict() for x in ShopProduct.query.filter(
                ShopProduct.category_id == p.category_id, ShopProduct.id != p.id,
                ShopProduct.is_active == True).limit(4).all()]
        return {'product': p.to_dict(), 'related': related}, 200


@shop_ns.route('/articles')
class Articles(Resource):
    def get(self):
        rows = ShopArticle.query.filter_by(is_published=True).order_by(ShopArticle.created_at.desc()).limit(50).all()
        return {'articles': [a.to_dict() for a in rows]}, 200


@shop_ns.route('/articles/<slug>')
class ArticleDetail(Resource):
    def get(self, slug):
        a = ShopArticle.query.filter_by(slug=slug, is_published=True).first()
        if not a: return {'message': 'مقاله یافت نشد'}, 404
        return {'article': a.to_dict(full=True)}, 200


# ---------------- CHECKOUT / ORDERS ----------------
@shop_ns.route('/checkout')
class Checkout(Resource):
    @jwt_required()
    def post(self):
        d = request.get_json(silent=True) or {}
        raw = d.get('items') or []
        if not raw: return {'message': 'سبد خرید خالی است'}, 400
        rows = []
        for it in raw:
            try: pid = int(it.get('product_id')); qty = max(1, int(it.get('qty', 1)))
            except (TypeError, ValueError): continue
            p = ShopProduct.query.filter_by(id=pid, is_active=True).first()
            if p: rows.append((p, min(qty, 10)))
        if not rows: return {'message': 'محصولات معتبر نیستند'}, 400
        subtotal = sum(_final_price(p) * qty for p, qty in rows)
        coupon_code = ''
        coupon_pct = 0
        code = (d.get('coupon_code') or '').strip().upper()
        if code:
            c = BizCoupon.query.filter_by(code=code).first()
            now = datetime.utcnow()
            if c and c.active and (not c.expires_at or c.expires_at > now) and c.used_count < c.max_uses:
                coupon_pct = c.percent; coupon_code = c.code
        total = int(subtotal * (100 - coupon_pct) / 100)
        uid = _uid()
        balance = sum(t.amount for t in BizWalletTx.query.filter_by(user_id=uid, status='done').all())
        if balance < total:
            return {'message': 'موجودی کیف پول کافی نیست. لطفا ابتدا کیف پول را شارژ کنید',
                    'need': total - balance, 'balance': balance}, 400
        ref = 'ORD' + secrets.token_hex(5).upper()
        o = ShopOrder(user_id=uid, total=total, status='paid', ref_code=ref, coupon_code=coupon_code)
        for p, qty in rows:
            o.items.append(ShopOrderItem(product_id=p.id, title=p.name,
                                         unit_price=_final_price(p), qty=qty))
            p.sales_count = (p.sales_count or 0) + qty
        db.session.add(o)
        db.session.add(BizWalletTx(user_id=uid, amount=-total, kind='purchase',
                                   status='done', note='خرید از فروشگاه', ref_code=ref))
        if coupon_code:
            c = BizCoupon.query.filter_by(code=coupon_code).first()
            if c: c.used_count = (c.used_count or 0) + 1
        db.session.commit()
        return {'message': 'خرید با موفقیت انجام شد', 'order': {
            'ref_code': ref, 'total': total, 'subtotal': subtotal,
            'coupon_discount': coupon_pct, 'status': o.status,
            'items': [{'title': i.title, 'unit_price': i.unit_price, 'qty': i.qty,
                       'file_url': ShopProduct.query.get(i.product_id).file_url if ShopProduct.query.get(i.product_id) else ''}
                      for i in o.items]}}, 201


@shop_ns.route('/orders')
class MyOrders(Resource):
    @jwt_required()
    def get(self):
        uid = _uid()
        rows = ShopOrder.query.filter_by(user_id=uid).order_by(ShopOrder.created_at.desc()).limit(50).all()
        out = []
        for o in rows:
            out.append({'ref_code': o.ref_code, 'total': o.total, 'status': o.status,
                        'created_at': o.created_at.isoformat(),
                        'items': [{'title': i.title, 'unit_price': i.unit_price, 'qty': i.qty,
                                   'file_url': (ShopProduct.query.get(i.product_id).file_url
                                                if o.status == 'paid' and ShopProduct.query.get(i.product_id) else '')}
                                  for i in o.items]})
        return {'orders': out}, 200


# ---------------- ADMIN ----------------
@shop_ns.route('/admin/products')
class AdminProducts(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopProduct.query.order_by(ShopProduct.created_at.desc()).limit(300).all()
        return {'products': [p.to_dict() for p in rows]}, 200

    @jwt_required()
    def post(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        name = (d.get('name') or '').strip()
        if len(name) < 2: return {'message': 'نام محصول الزامی است'}, 400
        p = ShopProduct(name=name[:200], slug=_uniq_slug(ShopProduct, name),
                        short_desc=(d.get('short_desc') or '')[:300],
                        description=(d.get('description') or '')[:8000],
                        price=max(0, int(d.get('price', 0))),
                        discount_percent=max(0, min(90, int(d.get('discount_percent', 0)))),
                        category_id=d.get('category_id') or None,
                        image_url=(d.get('image_url') or '')[:400],
                        file_url=(d.get('file_url') or '')[:400],
                        featured=bool(d.get('featured')))
        if d.get('flash_hours'):
            p.flash_until = datetime.utcnow() + timedelta(hours=min(720, int(d['flash_hours'])))
        db.session.add(p); db.session.commit()
        return {'message': 'محصول ساخته شد', 'product': p.to_dict()}, 201


@shop_ns.route('/admin/products/<int:pid>')
class AdminProductOne(Resource):
    @jwt_required()
    def put(self, pid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        p = db.session.get(ShopProduct, pid)
        if not p: return {'message': 'یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        for k in ('name', 'short_desc', 'description', 'image_url', 'file_url'):
            if k in d: setattr(p, k, d[k])
        if 'price' in d: p.price = max(0, int(d['price']))
        if 'discount_percent' in d: p.discount_percent = max(0, min(90, int(d['discount_percent'])))
        if 'category_id' in d: p.category_id = d['category_id'] or None
        if 'featured' in d: p.featured = bool(d['featured'])
        if 'is_active' in d: p.is_active = bool(d['is_active'])
        if 'flash_hours' in d:
            p.flash_until = (datetime.utcnow() + timedelta(hours=int(d['flash_hours']))) if d['flash_hours'] else None
        db.session.commit()
        return {'message': 'به‌روزرسانی شد', 'product': p.to_dict()}, 200

    @jwt_required()
    def delete(self, pid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        p = db.session.get(ShopProduct, pid)
        if not p: return {'message': 'یافت نشد'}, 404
        p.is_active = False
        db.session.commit()
        return {'message': 'محصول غیرفعال شد (حذف نرم)'}, 200


@shop_ns.route('/admin/categories')
class AdminCategories(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopCategory.query.all()
        return {'categories': [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in rows]}, 200

    @jwt_required()
    def post(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        name = (d.get('name') or '').strip()
        if len(name) < 2: return {'message': 'نام دسته الزامی است'}, 400
        c = ShopCategory(name=name[:120], slug=_uniq_slug(ShopCategory, name))
        db.session.add(c); db.session.commit()
        return {'message': 'دسته ساخته شد', 'category': {'id': c.id, 'name': c.name, 'slug': c.slug}}, 201


@shop_ns.route('/admin/articles')
class AdminArticles(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopArticle.query.order_by(ShopArticle.created_at.desc()).limit(200).all()
        return {'articles': [a.to_dict(full=True) for a in rows]}, 200

    @jwt_required()
    def post(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        title = (d.get('title') or '').strip()
        if len(title) < 3: return {'message': 'عنوان الزامی است'}, 400
        a = ShopArticle(title=title[:250], slug=_uniq_slug(ShopArticle, title),
                        excerpt=(d.get('excerpt') or '')[:400],
                        body=(d.get('body') or '')[:20000],
                        cover_url=(d.get('cover_url') or '')[:400],
                        is_published=bool(d.get('is_published', True)))
        db.session.add(a); db.session.commit()
        return {'message': 'مقاله ساخته شد', 'article': a.to_dict(full=True)}, 201


@shop_ns.route('/admin/articles/<int:aid>')
class AdminArticleOne(Resource):
    @jwt_required()
    def delete(self, aid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        a = db.session.get(ShopArticle, aid)
        if not a: return {'message': 'یافت نشد'}, 404
        a.is_published = False
        db.session.commit()
        return {'message': 'مقاله پیش‌نویس شد'}, 200


@shop_ns.route('/admin/orders')
class AdminOrders(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopOrder.query.order_by(ShopOrder.created_at.desc()).limit(200).all()
        return {'orders': [{'ref_code': o.ref_code, 'user_id': o.user_id, 'total': o.total,
                            'status': o.status, 'coupon': o.coupon_code,
                            'created_at': o.created_at.isoformat(),
                            'items': [{'title': i.title, 'qty': i.qty, 'unit_price': i.unit_price}
                                      for i in o.items]} for o in rows]}, 200
