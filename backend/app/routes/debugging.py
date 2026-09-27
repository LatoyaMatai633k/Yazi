import logging
from flask import Blueprint, jsonify, request
from app.models import db, Repository, DebuggingSession
from app.services import ai_service
from app.services.watsonx_service import ConfigurationError, AIServiceError

logger = logging.getLogger(__name__)
debug_bp = Blueprint("debugging", __name__)


@debug_bp.route("/api/debug", methods=["POST"])
def debug_analysis():
    data = request.get_json(silent=True) or {}
    error_message = (data.get("error_message") or "").strip()

    if not error_message:
        return jsonify({"error": "error_message is required"}), 400

    payload = {
        "error_message": error_message,
        "stack_trace": (data.get("stack_trace") or "")[:3000],
        "affected_file": (data.get("affected_file") or "")[:255],
        "relevant_code": (data.get("relevant_code") or "")[:3000],
        "context": (data.get("context") or "")[:500],
    }

    try:
        result = ai_service.analyze_debug(payload)
    except ConfigurationError:
        return jsonify({"error": "The AI service is not configured correctly. Please check the server configuration."}), 503
    except AIServiceError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        logger.error("Debug analysis error: %s", e)
        return jsonify({"error": "The AI analysis could not be completed. Please try again."}), 500

    # Persist session
    repo_id = data.get("repository_id")
    if repo_id:
        repo = Repository.query.get(repo_id)
        if repo:
            session = DebuggingSession(
                repository_id=repo.id,
                error_input=error_message,
                analysis_result=result.get("data"),
                status="completed",
            )
            db.session.add(session)
            db.session.commit()
            result["session_id"] = session.id

    return jsonify(result), 200


@debug_bp.route("/api/debug/sessions", methods=["GET"])
def list_sessions():
    sessions = DebuggingSession.query.order_by(DebuggingSession.created_at.desc()).limit(20).all()
    return jsonify([s.to_dict() for s in sessions])
