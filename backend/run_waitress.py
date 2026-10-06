"""
MahAI Backend - Production Server
اجرای Flask با Waitress روی پورت 5000
"""
import os
import sys
import logging

# تنظیم logging
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# تغییر مسیر به پوشه backend
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    from waitress import serve

    logging.info("Creating Flask app...")
    app, socketio = create_app()

    logging.info("Starting Waitress server on http://127.0.0.1:5000")
    print("=" * 50)
    print("🚀 MahAI Backend is running...")
    print("📍 http://127.0.0.1:5000")
    print("=" * 50)

    serve(
        app,
        host=os.environ.get('BIND_HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000)),
        threads=8,
        url_scheme=os.environ.get('URL_SCHEME', 'http')
    )

except Exception as e:
    logging.error(f"Failed to start server: {str(e)}")
    print(f"❌ Error: {str(e)}")
    input("Press Enter to exit...")
    sys.exit(1)
