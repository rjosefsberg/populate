import hashlib
import hmac
from functools import wraps
from flask import current_app, jsonify, request, session


def _check_credentials(username: str, password: str) -> bool:
    stored = current_app.config.get("APP_PASSWORD")
    if stored:
        return hmac.compare_digest(
            hashlib.sha256(password.encode()).digest(),
            hashlib.sha256(stored.encode()).digest(),
        )
    # Default fallback when no APP_PASSWORD is configured
    return username == "admin" and password == "admin"


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("authenticated"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


def register_auth_routes(app):
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json()
        if not data or not data.get("password"):
            return jsonify({"error": "Password required"}), 400
        username = (data.get("username") or "").strip()
        if not _check_credentials(username, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401
        session.permanent = False
        session["authenticated"] = True
        return jsonify({"ok": True})

    @app.route("/api/auth/logout", methods=["POST"])
    def logout():
        session.clear()
        return jsonify({"ok": True})

    @app.route("/api/auth/me", methods=["GET"])
    def me():
        return jsonify({"authenticated": bool(session.get("authenticated"))})
