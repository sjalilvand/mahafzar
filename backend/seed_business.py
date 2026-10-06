# -*- coding: utf-8 -*-
from app import create_app
app, socketio = create_app()
with app.app_context():
    from routes.business import BizCoupon
    from models import db
    if not BizCoupon.query.filter_by(code='WELCOME20').first():
        db.session.add(BizCoupon(code='WELCOME20', percent=20, max_uses=500, active=True))
        db.session.commit()
        print('[OK] demo coupon WELCOME20 (20%) created')
    else:
        print('[SKIP] WELCOME20 exists')
