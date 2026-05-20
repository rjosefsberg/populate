from app import create_app, db
from app.models import Entity
from sqlalchemy import text

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            print("✓ Database connected successfully")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")

    app.run()