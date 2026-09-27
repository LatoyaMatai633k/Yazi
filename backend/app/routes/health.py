from flask import Blueprint, jsonify
from app.services import ai_service
from flask import jsonify
from flask_api_key import api_key_required

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health():
    ai_status = ai_service.health_check()
    return jsonify({
        "status": "ok",
        "service": "Yazi Dev API",
        "ai": ai_status,
    })

