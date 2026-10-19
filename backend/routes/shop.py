# -*- coding: utf-8 -*-
"""MahAI Shop - products, categories, articles, orders, checkout,
star ratings (reviews), discount bundles, exclusive bundle coupons,
admin sales overview and review email notifications"""
from datetime import datetime, timedelta
import json, re, secrets
from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from routes.business import _uid, _is_admin, BizCoupon, BizWalletTx
from services.mail_service import notify_new_review

shop_ns = Namespace('shop', description='Frooshgah-e software products va maqalat')


def _light_migrate():
    """مهاجرت سبک برای دیتابیس‌های موجود (SQLite): افزودن ستون‌های تازه اگر نبودند"""
    from sqlalchemy import text
    stmts = [
        "ALTER TABLE biz_coupons ADD COLUMN scope VARCHAR(20) DEFAULT 'all'",
        "ALTER TABLE biz_coupons ADD COLUMN bundle_id INTEGER",
    ]
    for s in stmts:
        try:
            db.session.execute(text(s))
            db.session.commit()
        except Exception:
            db.session.rollback()


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


def _rating_info(pid):
    """(میانگین امتیاز، تعداد نظر) برای یک محصول"""
    rows = ShopReview.query.filter_by(product_id=pid).all()
    n = len(rows)
    if not n:
        return 0, 0
    return round(sum(r.rating for r in rows) / n, 1), n


def _coupon_dict(c):
    """نمای عمومی کوپن (برای نمایش کد روی باندل)"""
    return {'code': c.code, 'percent': c.percent,
            'expires_at': c.expires_at.isoformat() if c.expires_at else None,
            'remaining': max(0, (c.max_uses or 0) - (c.used_count or 0))}


def _bundle_live_coupon(bid):
    """کوپن اختصاصیِ فعالِ یک باندل (برای نمایش عمومی روی باکس باندل)"""
    c = BizCoupon.query.filter_by(scope='bundle', bundle_id=bid, active=True)\
        .order_by(BizCoupon.id.desc()).first()
    return c if (c and c.live()) else None


def _bundle_dict(b):
    items = [ShopProduct.query.get(i) for i in b.id_list()]
    items = [x for x in items if x and x.is_active]
    orig = sum(_final_price(x) for x in items)
    final = int(orig * (100 - (b.discount_percent or 0)) / 100)
    bc = _bundle_live_coupon(b.id)
    return {'id': b.id, 'title': b.title, 'slug': b.slug, 'description': b.description,
            'discount_percent': b.discount_percent, 'is_active': b.is_active,
            'items': [x.to_dict() for x in items],
            'original_total': orig, 'final_total': final, 'save': orig - final,
            'coupon': _coupon_dict(bc) if bc else None}


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
        avg, cnt = _rating_info(self.id)
        return {'id': self.id, 'name': self.name, 'slug': self.slug,
                'short_desc': self.short_desc, 'description': self.description,
                'price': self.price, 'discount_percent': self.discount_percent,
                'final_price': _final_price(self), 'flash_active': _flash_active(self),
                'flash_until': self.flash_until.isoformat() if self.flash_until else None,
                'category': self.category.name if self.category else None,
                'category_id': self.category_id, 'image_url': self.image_url,
                'featured': self.featured, 'sales_count': self.sales_count,
                'rating': avg, 'rating_count': cnt,
                'created_at': self.created_at.isoformat() if self.created_at else None}


class ShopReview(db.Model):
    __tablename__ = 'shop_reviews'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    username = db.Column(db.String(80), default='')
    rating = db.Column(db.Integer, nullable=False, default=5)
    comment = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('product_id', 'user_id', name='uq_shop_review'),)

    def to_dict(self):
        return {'id': self.id, 'product_id': self.product_id, 'username': self.username,
                'rating': self.rating, 'comment': self.comment,
                'created_at': self.created_at.isoformat() if self.created_at else None}


class ShopBundle(db.Model):
    """باندل تخفیفی: خرید چند محصول با هم با تخفیف اضافه"""
    __tablename__ = 'shop_bundles'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(160), unique=True, nullable=False, index=True)
    description = db.Column(db.String(400), default='')
    discount_percent = db.Column(db.Integer, default=0)
    product_ids = db.Column(db.Text, default='[]')  # JSON list of product ids
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def id_list(self):
        try:
            ids = json.loads(self.product_ids or '[]')
            return [int(i) for i in ids if str(i).isdigit()]
        except (ValueError, TypeError):
            return []


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
        if sort == 'rating':
            rows.sort(key=lambda p: (-(p.to_dict()['rating']), -p.to_dict()['rating_count']))
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


@shop_ns.route('/products/<slug>/reviews')
class ProductReviews(Resource):
    """نظرات و امتیاز ستاره‌ای محصول"""
    def get(self, slug):
        p = ShopProduct.query.filter_by(slug=slug, is_active=True).first()
        if not p: return {'message': 'محصول یافت نشد'}, 404
        rows = ShopReview.query.filter_by(product_id=p.id).order_by(ShopReview.created_at.desc()).limit(50).all()
        avg, cnt = _rating_info(p.id)
        dist = {str(i): 0 for i in range(1, 6)}
        for r in rows:
            dist[str(r.rating)] = dist.get(str(r.rating), 0) + 1
        return {'reviews': [r.to_dict() for r in rows],
                'rating': avg, 'count': cnt, 'distribution': dist}, 200

    @jwt_required()
    def post(self, slug):
        p = ShopProduct.query.filter_by(slug=slug, is_active=True).first()
        if not p: return {'message': 'محصول یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        try:
            rating = int(d.get('rating', 0))
        except (TypeError, ValueError):
            rating = 0
        if rating < 1 or rating > 5:
            return {'message': 'امتیاز باید بین ۱ تا ۵ ستاره باشد'}, 400
        uid = _uid()
        u = db.session.get(User, uid)
        uname = (u.full_name or u.username) if u else 'کاربر'
        comment = (d.get('comment') or '').strip()[:1500]
        rev = ShopReview.query.filter_by(product_id=p.id, user_id=uid).first()
        is_new = rev is None
        if rev:
            rev.rating = rating; rev.comment = comment; rev.created_at = datetime.utcnow()
        else:
            rev = ShopReview(product_id=p.id, user_id=uid, username=uname,
                             rating=rating, comment=comment)
            db.session.add(rev)
        db.session.commit()
        avg, cnt = _rating_info(p.id)
        # MahAI round-4: اعلان ایمیلی «نظر جدید» به مدیران (فقط نظر تازه، نه ویرایش؛ fail-safe)
        if is_new:
            try:
                notify_new_review(rev, p)
            except Exception:
                pass
        return {'message': 'نظر شما با موفقیت ثبت شد', 'rating': avg,
                'count': cnt, 'review': rev.to_dict()}, 201


@shop_ns.route('/best-sellers')
class BestSellers(Resource):
    """پرفروش‌ترین محصولات برای نمایش در صفحه اصلی"""
    def get(self):
        rows = ShopProduct.query.filter_by(is_active=True).order_by(
            ShopProduct.sales_count.desc(), ShopProduct.created_at.desc()).limit(8).all()
        return {'products': [p.to_dict() for p in rows]}, 200


@shop_ns.route('/bundles')
class Bundles(Resource):
    """فهرست باندل‌های تخفیفی فعال"""
    def get(self):
        rows = ShopBundle.query.filter_by(is_active=True).all()
        return {'bundles': [_bundle_dict(b) for b in rows]}, 200


@shop_ns.route('/products/<slug>/bundles')
class ProductBundles(Resource):
    """باندل‌هایی که این محصول در آن‌هاست (برای «خرید با هم»)"""
    def get(self, slug):
        p = ShopProduct.query.filter_by(slug=slug, is_active=True).first()
        if not p: return {'message': 'محصول یافت نشد'}, 404
        rows = [b for b in ShopBundle.query.filter_by(is_active=True).all()
                if p.id in b.id_list()]
        return {'bundles': [_bundle_dict(b) for b in rows]}, 200


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
        # ---- تخفیف باندل: اگر همه اقلام یک باندل در سبد باشد، تخفیف اضافه اعمال می‌شود
        bundle_discount = 0
        bundles_applied = []
        cart_ids = {p.id for p, _ in rows}
        for b in ShopBundle.query.filter_by(is_active=True).all():
            ids = b.id_list()
            if not ids or not set(ids).issubset(cart_ids):
                continue
            bsub = 0
            for pid in ids:
                bp = ShopProduct.query.get(pid)
                if bp and bp.is_active:
                    bsub += _final_price(bp)
            bd = int(bsub * (b.discount_percent or 0) / 100)
            if bd > 0:
                bundle_discount += bd
                bundles_applied.append({'title': b.title, 'discount_percent': b.discount_percent, 'discount': bd})
        subtotal_after_bundle = subtotal - bundle_discount
        coupon_code = ''
        coupon_pct = 0
        coupon_scope = 'all'
        code = (d.get('coupon_code') or '').strip().upper()
        if code:
            c = BizCoupon.query.filter_by(code=code).first()
            if c and c.live():
                # MahAI round-4: کوپن اختصاصی باندل — فقط با سبد کامل باندل قابل استفاده است
                if (c.scope or 'all') == 'bundle' and c.bundle_id:
                    b = db.session.get(ShopBundle, c.bundle_id)
                    b_ids = set(b.id_list()) if b else set()
                    if not b or not b.is_active or not b_ids.issubset(cart_ids):
                        return {'message': 'کد «%s» مخصوص باندل «%s» است؛ همه محصولات باندل باید در سبد باشند'
                                % (code, b.title if b else 'موردنظر'), 'need_bundle': True}, 400
                    coupon_scope = 'bundle'
                coupon_pct = c.percent; coupon_code = c.code
        total = int(subtotal_after_bundle * (100 - coupon_pct) / 100)
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
            'bundle_discount': bundle_discount, 'bundles': bundles_applied,
            'coupon_discount': coupon_pct, 'coupon_scope': coupon_scope, 'status': o.status,
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


@shop_ns.route('/admin/reviews')
class AdminReviews(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopReview.query.order_by(ShopReview.created_at.desc()).limit(200).all()
        return {'reviews': [dict(r.to_dict(), product=(ShopProduct.query.get(r.product_id).name
                if ShopProduct.query.get(r.product_id) else '?')) for r in rows]}, 200


@shop_ns.route('/admin/reviews/<int:rid>')
class AdminReviewOne(Resource):
    @jwt_required()
    def put(self, rid):
        """ویرایش نظر/امتیاز توسط مدیر"""
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        r = db.session.get(ShopReview, rid)
        if not r: return {'message': 'یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        try:
            rating = int(d.get('rating', r.rating))
        except (TypeError, ValueError):
            rating = r.rating
        if rating < 1 or rating > 5:
            return {'message': 'امتیاز باید بین ۱ تا ۵ ستاره باشد'}, 400
        r.rating = rating
        if 'comment' in d: r.comment = (d.get('comment') or '')[:1500]
        if 'username' in d and (d.get('username') or '').strip():
            r.username = d['username'].strip()[:80]
        db.session.commit()
        p = ShopProduct.query.get(r.product_id)
        return {'message': 'نظر به‌روزرسانی شد',
                'review': dict(r.to_dict(), product=p.name if p else '?')}, 200

    @jwt_required()
    def delete(self, rid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        r = db.session.get(ShopReview, rid)
        if not r: return {'message': 'یافت نشد'}, 404
        db.session.delete(r); db.session.commit()
        return {'message': 'نظر حذف شد'}, 200


@shop_ns.route('/admin/bundles')
class AdminBundles(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        rows = ShopBundle.query.order_by(ShopBundle.created_at.desc()).limit(100).all()
        return {'bundles': [_bundle_dict(b) for b in rows]}, 200

    @jwt_required()
    def post(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        title = (d.get('title') or '').strip()
        ids = [int(i) for i in (d.get('product_ids') or []) if str(i).isdigit()]
        if len(title) < 3 or len(ids) < 2:
            return {'message': 'عنوان و حداقل ۲ محصول الزامی است'}, 400
        b = ShopBundle(title=title[:200], slug=_uniq_slug(ShopBundle, title),
                       description=(d.get('description') or '')[:400],
                       discount_percent=max(0, min(90, int(d.get('discount_percent', 0)))),
                       product_ids=json.dumps(ids), is_active=bool(d.get('is_active', True)))
        db.session.add(b); db.session.commit()
        return {'message': 'باندل ساخته شد', 'bundle': _bundle_dict(b)}, 201


@shop_ns.route('/admin/bundles/<int:bid>')
class AdminBundleOne(Resource):
    @jwt_required()
    def put(self, bid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        b = db.session.get(ShopBundle, bid)
        if not b: return {'message': 'یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        if 'title' in d and (d['title'] or '').strip(): b.title = d['title'].strip()[:200]
        if 'description' in d: b.description = (d['description'] or '')[:400]
        if 'discount_percent' in d: b.discount_percent = max(0, min(90, int(d['discount_percent'])))
        if 'product_ids' in d:
            ids = [int(i) for i in (d.get('product_ids') or []) if str(i).isdigit()]
            b.product_ids = json.dumps(ids)
        if 'is_active' in d: b.is_active = bool(d['is_active'])
        db.session.commit()
        return {'message': 'به‌روزرسانی شد', 'bundle': _bundle_dict(b)}, 200

    @jwt_required()
    def delete(self, bid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        b = db.session.get(ShopBundle, bid)
        if not b: return {'message': 'یافت نشد'}, 404
        b.is_active = False
        db.session.commit()
        return {'message': 'باندل غیرفعال شد (حذف نرم)'}, 200


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
                                      for i in o.items]} for o in rows]}


# ---------------- ADMIN: نمودار فروش ----------------
@shop_ns.route('/admin/sales-overview')
class AdminSalesOverview(Resource):
    """داده‌های نمودار فروش: درآمد و تعداد سفارش روزانه + KPI + پرفروش‌ها"""
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        try:
            days = max(7, min(60, int(request.args.get('days', 14))))
        except (TypeError, ValueError):
            days = 14
        start = datetime.utcnow() - timedelta(days=days - 1)
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        orders = ShopOrder.query.filter(ShopOrder.created_at >= start,
                                        ShopOrder.status == 'paid').all()

        # تقویم روزها (حتی بدون فروش)
        daily = {}
        for i in range(days):
            day = start + timedelta(days=i)
            daily[day.strftime('%Y-%m-%d')] = {'date': day.strftime('%Y-%m-%d'),
                                               'label': day.strftime('%m/%d'),
                                               'revenue': 0, 'orders': 0, 'items': 0}
        items_sold = 0
        for o in orders:
            k = o.created_at.strftime('%Y-%m-%d')
            if k in daily:
                daily[k]['revenue'] += o.total or 0
                daily[k]['orders'] += 1
                daily[k]['items'] += sum(it.qty for it in o.items)
            items_sold += sum(it.qty for it in o.items)
        series = [daily[k] for k in sorted(daily.keys())]

        revenue = sum(o.total or 0 for o in orders)
        n_orders = len(orders)
        top = ShopProduct.query.filter(ShopProduct.sales_count > 0)\
            .order_by(ShopProduct.sales_count.desc()).limit(5).all()
        return {
            'days': days,
            'kpi': {'revenue': revenue, 'orders': n_orders, 'items_sold': items_sold,
                    'avg_order': int(revenue / n_orders) if n_orders else 0},
            'series': series,
            'top_products': [{'id': p.id, 'name': p.name, 'sales_count': p.sales_count,
                              'final_price': _final_price(p)} for p in top],
        }, 200


# ---------------- ADMIN: کوپن اختصاصی باندل ----------------
@shop_ns.route('/admin/bundles/<int:bid>/coupon')
class AdminBundleCoupon(Resource):
    @jwt_required()
    def get(self, bid):
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        b = db.session.get(ShopBundle, bid)
        if not b: return {'message': 'باندل یافت نشد'}, 404
        rows = BizCoupon.query.filter_by(scope='bundle', bundle_id=bid)\
            .order_by(BizCoupon.id.desc()).limit(10).all()
        return {'coupons': [c.to_dict() for c in rows]}, 200

    @jwt_required()
    def post(self, bid):
        """ساخت/بازتولید کوپن اختصاصی باندل"""
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        b = db.session.get(ShopBundle, bid)
        if not b: return {'message': 'باندل یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        try:
            percent = max(1, min(90, int(d.get('percent', 10))))
            max_uses = max(1, min(100000, int(d.get('max_uses', 100))))
            exp_days = max(0, min(3650, int(d.get('expires_days', 30))))
        except (TypeError, ValueError):
            return {'message': 'مقادیر عددی نامعتبر است'}, 400
        custom = (d.get('code') or '').strip().upper()
        code = custom or ('BND%d-%s' % (bid, secrets.token_hex(2).upper()))
        if not re.fullmatch(r'[A-Z0-9-]{3,40}', code):
            return {'message': 'کد فقط حروف انگلیسی، عدد و خط تیره (حداقل ۳ کاراکتر)'}, 400
        if BizCoupon.query.filter_by(code=code).first():
            return {'message': 'این کد قبلا استفاده شده است'}, 400
        # کوپن قبلی باندل غیرفعال می‌شود تا فقط یک کد اختصاصی فعال بماند
        for old in BizCoupon.query.filter_by(scope='bundle', bundle_id=bid, active=True).all():
            old.active = False
        c = BizCoupon(code=code, percent=percent, max_uses=max_uses,
                      expires_at=(datetime.utcnow() + timedelta(days=exp_days)) if exp_days else None,
                      active=True, scope='bundle', bundle_id=bid)
        db.session.add(c)
        db.session.commit()
        return {'message': 'کوپن اختصاصی باندل ساخته شد', 'coupon': c.to_dict(),
                'bundle': _bundle_dict(b)}, 201

    @jwt_required()
    def delete(self, bid):
        """غیرفعال‌سازی کوپن‌های اختصاصی باندل"""
        if not _is_admin(_uid()): return {'message': 'dastresi mojaz nist'}, 403
        n = 0
        for c in BizCoupon.query.filter_by(scope='bundle', bundle_id=bid, active=True).all():
            c.active = False; n += 1
        db.session.commit()
        return {'message': 'کوپن اختصاصی غیرفعال شد' if n else 'کوپن فعالی وجود نداشت'}, 200
