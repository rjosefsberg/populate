import os
import logging
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .config import config

db = SQLAlchemy()
migrate = Migrate()

FRONTEND_BUILD = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')


def create_app(config_name="default"):
    app = Flask(__name__, static_folder=FRONTEND_BUILD, static_url_path='')
    app.config.from_object(config[config_name])

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    if app.config.get("SECRET_KEY") == "dev-secret-change-me":
        app.logger.warning(
            "SECRET_KEY is set to the insecure default — set a strong SECRET_KEY in .env"
        )

    db.init_app(app)
    migrate.init_app(app, db)
    # CORS only needed when React dev server (port 3000) talks to Flask (port 5000)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    from app.auth import register_auth_routes
    register_auth_routes(app)

    from app.routes import register_routes
    register_routes(app)

    # Serve React build for all non-API routes (must be registered last)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path.startswith('api/'):
            # Let Flask 404 handle unknown API paths naturally
            from flask import abort
            abort(404)
        full_path = os.path.join(FRONTEND_BUILD, path)
        if path and os.path.exists(full_path):
            return send_from_directory(FRONTEND_BUILD, path)
        return send_from_directory(FRONTEND_BUILD, 'index.html')

    return app
