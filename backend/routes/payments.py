from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, PaymentPlan, Payment, UserSubscription, PaymentDiscount, Wallet, WalletTransaction
from datetime import datetime, timedelta
import json

# نکته: ماژول requests عمداً lazy ایمپورت می‌شود (داخل توابع) تا اگر در venv
# نصب نبود، فقط درگاه پرداخت خطا بدهد و کل بک‌اند بالا نیاید.

payments_ns = Namespace('payments', description='Payment operations')

# ZarinPal Configuration
ZARINPAL_MERCHANT = "00000000-0000-0000-0000-000000000000"  # sandbox
ZARINPAL_API = "https://sandbox.zarinpal.com/pg/v4/payment/"
ZARINPAL_START_PAY = "https://sandbox.zarinpal.com/pg/StartPay/"
ZARINPAL_VERIFY = "https://api.zarinpal.com/pg/v4/payment/verify.json"

# Callback URL
CALLBACK_URL = "https://mahai.ir/api/payments/verify/zarinpal"


@payments_ns.route('/plans')
class PaymentPlans(Resource):
    def get(self):
        """لیست پلن‌های اشتراک"""
        plans = PaymentPlan.query.filter_by(is_active=True) \
            .order_by(PaymentPlan.order).all()

        return [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'price': p.price,
            'price_formatted': f"{p.price:,} تومان",
            'duration_days': p.duration_days,
            'features': json.loads(p.features) if p.features else [],
            'is_popular': p.is_popular,
            'monthly_price': round(p.price / (p.duration_days / 30)) if p.duration_days else p.price
        } for p in plans]


@payments_ns.route('/subscribe/<int:plan_id>')
class Subscribe(Resource):
    @jwt_required()
    def post(self, plan_id):
        """شروع فرآیند پرداخت"""
        user_id = get_jwt_identity()
        plan = PaymentPlan.query.get_or_404(plan_id)

        # بررسی تخفیف
        discount_code = request.get_json().get('discount_code') if request.is_json else None
        final_amount = plan.price

        discount = None
        if discount_code:
            discount = validate_discount(discount_code, plan.price)
            if discount:
                final_amount = discount['final_amount']
            else:
                return {'message': 'کد تخفیف نامعتبر است'}, 400

        # ایجاد تراکنش
        payment = Payment(
            user_id=user_id,
            plan_id=plan_id,
            amount=final_amount,
            status='pending',
            payment_method='zarinpal',
            description=f'خرید اشتراک {plan.name}'
        )
        db.session.add(payment)
        db.session.commit()

        # ارسال به زرین‌پال
        result = send_to_zarinpal(payment.id, final_amount, user_id)

        if result.get('success'):
            payment.authority = result['authority']
            db.session.commit()

            return {
                'payment_url': f"{ZARINPAL_START_PAY}{result['authority']}",
                'authority': result['authority'],
                'payment_id': payment.id,
                'amount': final_amount,
                'discount_applied': discount is not None
            }
        else:
            payment.status = 'failed'
            db.session.commit()
            return {'message': 'خطا در اتصال به درگاه پرداخت'}, 500


@payments_ns.route('/verify/zarinpal')
class ZarinpalVerify(Resource):
    def get(self):
        """تایید پرداخت زرین‌پال"""
        authority = request.args.get('Authority')
        status = request.args.get('Status')

        if status != 'OK':
            return {'message': 'پرداخت لغو شد', 'status': 'cancelled'}, 400

        payment = Payment.query.filter_by(authority=authority).first()
        if not payment:
            return {'message': 'تراکنش یافت نشد'}, 404

        # Verify with ZarinPal
        result = verify_zarinpal(authority, payment.amount)

        if result.get('success'):
            payment.status = 'completed'
            payment.reference_id = result['ref_id']
            payment.transaction_id = result['transaction_id']
            payment.paid_at = datetime.utcnow()

            # فعال‌سازی اشتراک
            activate_subscription(payment.user_id, payment.plan_id)

            db.session.commit()

            return {
                'message': 'پرداخت موفق',
                'ref_id': result['ref_id'],
                'status': 'success'
            }
        else:
            payment.status = 'failed'
            db.session.commit()
            return {'message': 'پرداخت ناموفق', 'status': 'failed'}, 400


@payments_ns.route('/my-subscription')
class MySubscription(Resource):
    @jwt_required()
    def get(self):
        """وضعیت اشتراک کاربر"""
        user_id = get_jwt_identity()
        sub = UserSubscription.query.filter_by(user_id=user_id).first()

        if not sub or not sub.is_active:
            return {
                'has_subscription': False,
                'is_active': False
            }

        is_expired = sub.expires_at and sub.expires_at < datetime.utcnow()

        return {
            'has_subscription': True,
            'is_active': sub.is_active and not is_expired,
            'plan': {
                'id': sub.plan.id,
                'name': sub.plan.name,
                'features': json.loads(sub.plan.features) if sub.plan.features else []
            } if sub.plan else None,
            'started_at': sub.started_at.isoformat() if sub.started_at else None,
            'expires_at': sub.expires_at.isoformat() if sub.expires_at else None,
            'days_left': (sub.expires_at - datetime.utcnow()).days if sub.expires_at and not is_expired else 0,
            'auto_renew': sub.auto_renew
        }


@payments_ns.route('/discounts/validate')
class ValidateDiscount(Resource):
    def post(self):
        """اعتبارسنجی کد تخفیف"""
        data = request.get_json()
        code = data.get('code', '').upper().strip()
        amount = data.get('amount', 0)

        result = validate_discount(code, amount)

        if result:
            return {
                'valid': True,
                'discount_amount': result['discount_amount'],
                'final_amount': result['final_amount'],
                'discount_type': result['discount_type'],
                'description': result['description']
            }

        return {'valid': False, 'message': 'کد تخفیف نامعتبر است'}


@payments_ns.route('/wallet')
class WalletResource(Resource):
    @jwt_required()
    def get(self):
        """کیف پول کاربر"""
        user_id = get_jwt_identity()
        wallet = Wallet.query.filter_by(user_id=user_id).first()

        if not wallet:
            wallet = Wallet(user_id=user_id, balance=0)
            db.session.add(wallet)
            db.session.commit()

        return {
            'balance': wallet.balance,
            'balance_formatted': f"{wallet.balance:,} تومان",
            'transactions': [{
                'id': t.id,
                'amount': t.amount,
                'type': t.transaction_type,
                'description': t.description,
                'created_at': t.created_at.isoformat() if t.created_at else None
            } for t in wallet.transactions[-20:]]
        }


@payments_ns.route('/wallet/deposit')
class WalletDeposit(Resource):
    @jwt_required()
    def post(self):
        """شارژ کیف پول"""
        user_id = get_jwt_identity()
        data = request.get_json()
        amount = data.get('amount', 0)

        if amount < 10000:
            return {'message': 'حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است'}, 400

        # ایجاد پرداخت
        payment = Payment(
            user_id=user_id,
            amount=amount,
            status='pending',
            payment_method='zarinpal',
            description='شارژ کیف پول'
        )
        db.session.add(payment)
        db.session.commit()

        result = send_to_zarinpal(payment.id, amount, user_id)

        if result.get('success'):
            payment.authority = result['authority']
            db.session.commit()
            return {'payment_url': f"{ZARINPAL_START_PAY}{result['authority']}"}

        return {'message': 'خطا در اتصال به درگاه'}, 500


# ===== HELPER FUNCTIONS =====

def send_to_zarinpal(payment_id, amount, user_id):
    """ارسال درخواست به زرین‌پال"""
    try:
        import requests  # lazy import
        data = {
            "merchant_id": ZARINPAL_MERCHANT,
            "amount": amount,
            "callback_url": CALLBACK_URL,
            "description": f"پرداخت #{payment_id}",
            "metadata": {
                "payment_id": payment_id,
                "user_id": user_id
            }
        }

        response = requests.post(
            ZARINPAL_API + "request.json",
            json=data,
            timeout=30
        )

        result = response.json()

        if result.get('data', {}).get('code') == 100:
            return {
                'success': True,
                'authority': result['data']['authority'],
                'fee': result['data']['fee']
            }

        return {'success': False, 'error': result.get('errors', 'Unknown error')}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def verify_zarinpal(authority, amount):
    """تایید پرداخت زرین‌پال"""
    try:
        import requests  # lazy import
        data = {
            "merchant_id": ZARINPAL_MERCHANT,
            "amount": amount,
            "authority": authority
        }

        response = requests.post(
            ZARINPAL_API + "verify.json",
            json=data,
            timeout=30
        )

        result = response.json()

        if result.get('data', {}).get('code') == 100:
            return {
                'success': True,
                'ref_id': result['data']['ref_id'],
                'transaction_id': result['data'].get('card_pan', ''),
                'fee': result['data']['fee']
            }

        return {'success': False}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def validate_discount(code, amount):
    """اعتبارسنجی کد تخفیف"""
    discount = PaymentDiscount.query.filter_by(
        code=code.upper(),
        is_active=True
    ).first()

    if not discount:
        return None

    # بررسی تاریخ
    now = datetime.utcnow()
    if discount.valid_from and now < discount.valid_from:
        return None
    if discount.valid_until and now > discount.valid_until:
        return None

    # بررسی تعداد استفاده
    if discount.max_uses and discount.used_count >= discount.max_uses:
        return None

    # بررسی حداقل مبلغ
    if amount < discount.min_amount:
        return None

    # محاسبه تخفیف
    if discount.discount_type == 'percentage':
        discount_amount = int(amount * discount.discount_value / 100)
    else:
        discount_amount = discount.discount_value

    final_amount = max(0, amount - discount_amount)

    return {
        'discount_amount': discount_amount,
        'final_amount': final_amount,
        'discount_type': discount.discount_type,
        'description': discount.description
    }


def activate_subscription(user_id, plan_id):
    """فعال‌سازی اشتراک"""
    plan = PaymentPlan.query.get(plan_id)
    if not plan:
        return

    sub = UserSubscription.query.filter_by(user_id=user_id).first()

    now = datetime.utcnow()
    expires = now + timedelta(days=plan.duration_days)

    if sub:
        # تمدید اشتراک
        if sub.expires_at and sub.expires_at > now:
            expires = sub.expires_at + timedelta(days=plan.duration_days)

        sub.plan_id = plan_id
        sub.is_active = True
        sub.expires_at = expires
        sub.updated_at = now
    else:
        sub = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            started_at=now,
            expires_at=expires
        )
        db.session.add(sub)

    db.session.commit()