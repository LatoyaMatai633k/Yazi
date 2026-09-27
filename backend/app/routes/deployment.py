import logging
from flask import Blueprint, jsonify, request
from app.models import db, Repository, DeploymentCheck
from app.services.analysis_service import AnalysisService
from app.services.github_service import RepositoryNotFoundError, GitHubAuthError
from app.services.watsonx_service import ConfigurationError, AIServiceError

logger = logging.getLogger(__name__)
deployment_bp = Blueprint("deployment", __name__)


@deployment_bp.route("/api/deployment/check", methods=["POST"])
def deployment_check():
    data = request.get_json(silent=True) or {}
    url = (data.get("repository_url") or "").strip()
    branch = data.get("branch")

    if not url:
        return jsonify({"error": "repository_url is required"}), 400

    try:
        svc = AnalysisService()
        result = svc.run_deployment_check(url, branch)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RepositoryNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except GitHubAuthError as e:
        return jsonify({"error": str(e)}), 401
    except ConfigurationError:
        return jsonify({"error": "The AI service is not configured correctly. Please check the server configuration."}), 503
    except AIServiceError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        logger.error("Deployment check error: %s", e)
        return jsonify({"error": "The AI analysis could not be completed. Please try again."}), 500

    # Persist
    repo = Repository.query.filter_by(repository_url=url).first()
    if repo:
        check = DeploymentCheck(
            repository_id=repo.id,
            results=result.get("analysis"),
            status=result.get("analysis", {}).get("overall_status", "completed"),
        )
        db.session.add(check)
        db.session.commit()
        result["check_id"] = check.id

    return jsonify(result), 200
