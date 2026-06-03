from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .config import config
import logging

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    # Keep third-party loggers quieter
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.routes import register_routes
    register_routes(app)

    return app