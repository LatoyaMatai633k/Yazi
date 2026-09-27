import logging
from flask import Blueprint, jsonify, request
from app.models import db, Repository, RepositoryAnalysis
from app.services.analysis_service import AnalysisService
from app.services.github_service import RepositoryNotFoundError, GitHubAuthError
from app.services.watsonx_service import ConfigurationError, AIServiceError

logger = logging.getLogger(__name__)
analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/api/repositories/analyze", methods=["POST"])
def analyze_repository():
    data = request.get_json(silent=True) or {}
    url = (data.get("repository_url") or "").strip()
    branch = data.get("branch")

    if not url:
        return jsonify({"error": "repository_url is required"}), 400

    try:
        svc = AnalysisService()
        result = svc.run_repository_analysis(url, branch)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RepositoryNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except GitHubAuthError as e:
        return jsonify({"error": str(e)}), 401
    except ConfigurationError as e:
        return jsonify({"error": "The AI service is not configured correctly. Please check the server configuration."}), 503
    except AIServiceError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        logger.error("Repository analysis error: %s", e)
        return jsonify({"error": "The AI analysis could not be completed. Please try again."}), 500

    # Persist analysis
    repo = Repository.query.filter_by(repository_url=url).first()
    if repo:
        analysis_record = RepositoryAnalysis(
            repository_id=repo.id,
            analysis_result=result.get("analysis"),
            status="completed",
        )
        db.session.add(analysis_record)
        db.session.commit()
        result["analysis_id"] = analysis_record.id

    return jsonify(result), 200


@analysis_bp.route("/api/repositories/<int:repo_id>/analyses", methods=["GET"])
def get_analyses(repo_id):
    db.get_or_404(Repository, repo_id)
    analyses = RepositoryAnalysis.query.filter_by(repository_id=repo_id).order_by(
        RepositoryAnalysis.created_at.desc()
    ).limit(10).all()
    return jsonify([a.to_dict() for a in analyses])
