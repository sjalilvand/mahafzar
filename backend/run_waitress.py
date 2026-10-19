"""
MahAI Backend - Production Server
اجرای Flask با Waitress روی پورت 5000

اگر وابستگی‌ای در venv جا افتاده باشد، یک بار خودکار با pip نصب
و دوباره تلاش می‌کند — دیگر نیازی به نصب دستی نیست.
"""
import os
import sys
import logging
import subprocess

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

REQUIREMENTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'requirements.txt')


def _ensure_dependencies():
    """اگر ایمپورت ماژول‌ها شکست خورد، یک بار requirements.txt را نصب می‌کند."""
    try:
        import requests  # noqa: F401
        import numpy  # noqa: F401
        import sklearn  # noqa: F401
        import flask_migrate  # noqa: F401
        from app import create_app  # noqa: F401
        from waitress import serve  # noqa: F401
        return True
    except ModuleNotFoundError as e:
        missing = getattr(e, 'name', 'unknown')
        print(f"📦 Missing module: {missing}")
        print("📦 Auto-installing requirements (one time, please wait) ...")
        logging.info(f"Auto-installing requirements due to missing module: {missing}")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check',
                '-r', REQUIREMENTS
            ])
            return True
        except Exception as pe:
            print(f"❌ Auto-install failed: {pe}")
            print(f"   راه حل دستی: {sys.executable} -m pip install -r requirements.txt")
            logging.error(f"Auto-install failed: {pe}")
            return False


try:
    if not _ensure_dependencies():
        print("❌ Error: dependencies could not be installed automatically.")
        input("Press Enter to exit...")
        sys.exit(1)

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
