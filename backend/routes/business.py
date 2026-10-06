# -*- coding: utf-8 -*-
"""MahAI Business Pack v2 - classes renamed Biz* to avoid registry collision"""
from datetime import datetime
import secrets
from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db

biz_ns = Namespace('business', description='Tiket poshtibani, Kif pool, Code takhfif')


def _uid():
    ident = get_jwt_identity()
    try:
        return int(ident)
    except (TypeError, ValueError):
        return ident


def _is_admin(uid):
    try:
        from models import User
        u = db.session.get(User, uid)
        if not u:
            return False
        if getattr(u, 'is_admin', False):
            return True
        if str(getattr(u, 'role', '')).lower() in ('admin', 'superadmin'):
            return True
        return False
    except Exception:
        return False


def _user_email(uid):
    try:
        from models import User
        u = db.session.get(User, uid)
        return ((getattr(u, 'email', None)) or ('#' + str(uid))) if u else ('#' + str(uid))
    except Exception:
        return '#' + str(uid)


class BizTicket(db.Model):
    __tablename__ = 'biz_tickets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    subject = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), default='general')
    status = db.Column(db.String(20), default='open')
    priority = db.Column(db.String(20), default='normal')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = db.relationship('BizTicketMessage', backref='ticket', lazy=True,
                               cascade='all, delete-orphan')

    def to_dict(self):
        return {'id': self.id, 'subject': self.subject, 'category': self.category,
                'status': self.status, 'priority': self.priority,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None}


class BizTicketMessage(db.Model):
    __tablename__ = 'biz_ticket_messages'
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('biz_tickets.id'), nullable=False, index=True)
    sender = db.Column(db.String(20), default='user')
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class BizCoupon(db.Model):
    __tablename__ = 'biz_coupons'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    percent = db.Column(db.Integer, default=10)
    max_uses = db.Column(db.Integer, default=100)
    used_count = db.Column(db.Integer, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    active = db.Column(db.Boolean, default=True)


class BizWalletTx(db.Model):
    __tablename__ = 'biz_wallet_tx'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    amount = db.Column(db.Integer, default=0)
    kind = db.Column(db.String(20), default='deposit')
    note = db.Column(db.String(255), default='')
    ref_code = db.Column(db.String(40), default='')
    status = db.Column(db.String(20), default='done')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


@biz_ns.route('/tickets')
class Tickets(Resource):
    @jwt_required()
    def get(self):
        rows = BizTicket.query.filter_by(user_id=_uid()).order_by(BizTicket.updated_at.desc()).all()
        return {'tickets': [t.to_dict() for t in rows]}, 200

    @jwt_required()
    def post(self):
        d = request.get_json(silent=True) or {}
        subject = (d.get('subject') or '').strip()
        body = (d.get('message') or '').strip()
        if len(subject) < 3 or len(body) < 5:
            return {'message': 'mozoo va matn peygham ra kamel vared konid'}, 400
        t = BizTicket(user_id=_uid(), subject=subject[:200],
                      category=(d.get('category') or 'general')[:50],
                      priority=(d.get('priority') or 'normal')[:20])
        t.messages.append(BizTicketMessage(sender='user', body=body[:5000]))
        db.session.add(t)
        db.session.commit()
        return {'message': 'تیکت شما ثبت شد', 'ticket': t.to_dict()}, 201


@biz_ns.route('/tickets/<int:tid>')
class TicketDetail(Resource):
    @jwt_required()
    def get(self, tid):
        t = db.session.get(BizTicket, tid)
        if not t or (t.user_id != _uid() and not _is_admin(_uid())):
            return {'message': 'تیکت یافت نشد'}, 404
        return {'ticket': t.to_dict(),
                'messages': [{'sender': m.sender, 'body': m.body,
                              'created_at': m.created_at.isoformat()} for m in t.messages]}, 200

    @jwt_required()
    def post(self, tid):
        t = db.session.get(BizTicket, tid)
        if not t or (t.user_id != _uid() and not _is_admin(_uid())):
            return {'message': 'تیکت یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        body = (d.get('message') or '').strip()
        if len(body) < 2:
            return {'message': 'matn pasokh khali ast'}, 400
        sender = 'admin' if _is_admin(_uid()) else 'user'
        t.messages.append(BizTicketMessage(sender=sender, body=body[:5000]))
        t.status = 'answered' if sender == 'admin' else 'open'
        db.session.commit()
        return {'message': 'پاسخ ثبت شد'}, 201


@biz_ns.route('/tickets/<int:tid>/status')
class TicketStatus(Resource):
    @jwt_required()
    def post(self, tid):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        t = db.session.get(BizTicket, tid)
        if not t:
            return {'message': 'تیکت یافت نشد'}, 404
        d = request.get_json(silent=True) or {}
        st = d.get('status')
        if st not in ('open', 'answered', 'closed'):
            return {'message': 'vaziat namotabar'}, 400
        t.status = st
        db.session.commit()
        return {'message': 'وضعیت به‌روزرسانی شد', 'ticket': t.to_dict()}, 200


@biz_ns.route('/admin/tickets')
class AdminTickets(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        rows = BizTicket.query.order_by(BizTicket.updated_at.desc()).limit(200).all()
        return {'tickets': [t.to_dict() for t in rows]}, 200


@biz_ns.route('/coupons/validate')
class CouponValidate(Resource):
    @jwt_required()
    def post(self):
        d = request.get_json(silent=True) or {}
        code = (d.get('code') or '').strip().upper()
        c = BizCoupon.query.filter_by(code=code).first()
        now = datetime.utcnow()
        if (not c) or (not c.active) or (c.expires_at and c.expires_at < now) or (c.used_count >= c.max_uses):
            return {'valid': False, 'message': 'کد تخفیف نامعتبر یا منقضی است'}, 200
        return {'valid': True, 'percent': c.percent,
                'message': 'کد معتبر: %d درصد تخفیف' % c.percent}, 200


@biz_ns.route('/admin/coupons')
class AdminCoupons(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        rows = BizCoupon.query.order_by(BizCoupon.id.desc()).limit(200).all()
        return {'coupons': [{'id': c.id, 'code': c.code, 'percent': c.percent,
                             'used': c.used_count, 'max': c.max_uses, 'active': c.active,
                             'expires_at': c.expires_at.isoformat() if c.expires_at else None}
                            for c in rows]}, 200

    @jwt_required()
    def post(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        code = (d.get('code') or '').strip().upper() or ('MH-' + secrets.token_hex(4).upper())
        if BizCoupon.query.filter_by(code=code).first():
            return {'message': 'in code ghablan sakhte shode'}, 400
        c = BizCoupon(code=code[:40],
                      percent=max(1, min(90, int(d.get('percent', 10)))),
                      max_uses=max(1, int(d.get('max_uses', 100))),
                      expires_at=datetime.fromisoformat(d['expires_at']) if d.get('expires_at') else None)
        db.session.add(c)
        db.session.commit()
        return {'message': 'کد تخفیف ساخته شد', 'code': c.code, 'percent': c.percent}, 201


@biz_ns.route('/wallet')
class Wallet(Resource):
    @jwt_required()
    def get(self):
        uid = _uid()
        txs = BizWalletTx.query.filter_by(user_id=uid)\
            .order_by(BizWalletTx.created_at.desc()).limit(100).all()
        balance = sum(t.amount for t in txs if t.status == 'done')
        return {'balance': balance, 'currency': 'تومان',
                'transactions': [{'id': t.id, 'amount': t.amount, 'kind': t.kind,
                                  'status': t.status, 'note': t.note, 'ref_code': t.ref_code,
                                  'created_at': t.created_at.isoformat()} for t in txs]}, 200


@biz_ns.route('/wallet/deposit')
class WalletDeposit(Resource):
    @jwt_required()
    def post(self):
        d = request.get_json(silent=True) or {}
        try:
            amount = int(d.get('amount', 0))
        except (TypeError, ValueError):
            amount = 0
        if amount < 10000 or amount > 100000000:
            return {'message': 'mablagh bayad 10 hezar ta 100 milion toman bashad'}, 400
        ref = 'MH' + secrets.token_hex(5).upper()
        tx = BizWalletTx(user_id=_uid(), amount=amount, kind='deposit',
                         status='pending', note='شارژ کیف پول', ref_code=ref)
        db.session.add(tx)
        db.session.commit()
        return {'message': 'تراکنش ایجاد شد', 'ref_code': ref, 'amount': amount, 'status': 'pending'}, 201


@biz_ns.route('/wallet/deposit/confirm')
class WalletDepositConfirm(Resource):
    @jwt_required()
    def post(self):
        d = request.get_json(silent=True) or {}
        ref = (d.get('ref_code') or '').strip()
        tx = BizWalletTx.query.filter_by(ref_code=ref, user_id=_uid()).first()
        if not tx:
            return {'message': 'تراکنش یافت نشد'}, 404
        if tx.status == 'done':
            return {'message': 'ghablan taeed shode'}, 200
        tx.status = 'done'
        tx.note = 'شارژ کیف پول (پرداخت تایید شد)'
        db.session.commit()
        return {'message': 'کیف پول شارژ شد', 'ref_code': ref}, 200


# ---------------- ADMIN EXTRA (stats / transactions / password) ----------------
@biz_ns.route('/admin/stats')
class AdminStats(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        from models import User
        open_t = BizTicket.query.filter_by(status='open').count()
        total_t = BizTicket.query.count()
        users = User.query.count()
        deposits = BizWalletTx.query.filter_by(status='done').count()
        volume = db.session.query(db.func.coalesce(db.func.sum(BizWalletTx.amount), 0)).filter_by(status='done').scalar()
        return {'open_tickets': open_t, 'total_tickets': total_t, 'users': users,
                'deposits': deposits, 'volume': int(volume or 0)}, 200


@biz_ns.route('/admin/transactions')
class AdminTransactions(Resource):
    @jwt_required()
    def get(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        rows = BizWalletTx.query.order_by(BizWalletTx.created_at.desc()).limit(300).all()
        return {'transactions': [{'id': t.id, 'user': _user_email(t.user_id),
                                  'amount': t.amount, 'kind': t.kind, 'status': t.status,
                                  'note': t.note, 'ref_code': t.ref_code,
                                  'created_at': t.created_at.isoformat()} for t in rows]}, 200


@biz_ns.route('/admin/password')
class AdminPassword(Resource):
    @jwt_required()
    def post(self):
        if not _is_admin(_uid()):
            return {'message': 'dastresi mojaz nist'}, 403
        d = request.get_json(silent=True) or {}
        cur = d.get('current_password') or ''
        new = d.get('new_password') or ''
        if len(new) < 8:
            return {'message': 'رمز جدید باید حداقل ۸ کاراکتر باشد'}, 400
        from models import User
        from werkzeug.security import check_password_hash, generate_password_hash
        u = db.session.get(User, _uid())
        if not u:
            return {'message': 'کاربر یافت نشد'}, 404
        if not check_password_hash(u.password_hash, cur):
            return {'message': 'رمز فعلی اشتباه است'}, 401
        u.password_hash = generate_password_hash(new)
        db.session.commit()
        return {'message': 'رمز عبور با موفقیت تغییر کرد'}, 200
