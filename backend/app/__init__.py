"""
Flask application factory.
"""
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import get_config
from app.models import db
from flask import Flask
from flask_api_key import APIKeyManager

mgr = APIKeyManager()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    config = get_config()
    app.config.from_object(config)

    mgr.init_app(app)

    # CORS
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})

    # Database
    db.init_app(app)

    # Blueprints
    from app.routes.health import health_bp
    from app.routes.repositories import repos_bp
    from app.routes.analysis import analysis_bp
    from app.routes.debugging import debug_bp
    from app.routes.testing import testing_bp
    from app.routes.deployment import deployment_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(repos_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(debug_bp)
    app.register_blueprint(testing_bp)
    app.register_blueprint(deployment_bp)

    # Create tables on first run
    with app.app_context():
        db.create_all()

    # Generic error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        logger.error("Unhandled server error: %s", e)
        return jsonify({"error": "An unexpected server error occurred."}), 500

    return app
