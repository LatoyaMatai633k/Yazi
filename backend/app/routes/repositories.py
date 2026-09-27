import logging
from flask import Blueprint, jsonify, request
from app.models import db, Repository
from app.services.github_service import GitHubService, RepositoryNotFoundError, GitHubAuthError

logger = logging.getLogger(__name__)
repos_bp = Blueprint("repositories", __name__)


@repos_bp.route("/api/repositories", methods=["GET"])
def list_repositories():
    repos = Repository.query.order_by(Repository.created_at.desc()).all()
    return jsonify([r.to_dict() for r in repos])


@repos_bp.route("/api/repositories", methods=["POST"])
def connect_repository():
    data = request.get_json(silent=True) or {}
    url = (data.get("repository_url") or "").strip()
    if not url:
        return jsonify({"error": "repository_url is required"}), 400

    try:
        gh = GitHubService()
        owner, repo_name = GitHubService.parse_repo_url(url)
        meta = gh.get_repository(owner, repo_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RepositoryNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except GitHubAuthError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        logger.error("GitHub connection failed: %s", e)
        return jsonify({"error": "We could not connect to this repository. Please check the repository URL and try again."}), 500

    # Upsert repository
    existing = Repository.query.filter_by(repository_url=url).first()
    if existing:
        existing.description = meta.get("description")
        existing.default_branch = meta.get("default_branch", "main")
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    repo = Repository(
        provider="github",
        repository_url=url,
        repository_name=meta.get("name", repo_name),
        description=meta.get("description"),
        default_branch=meta.get("default_branch", "main"),
    )
    db.session.add(repo)
    db.session.commit()
    return jsonify(repo.to_dict()), 201


@repos_bp.route("/api/repositories/<int:repo_id>", methods=["GET"])
def get_repository(repo_id):
    repo = db.get_or_404(Repository, repo_id)
    return jsonify(repo.to_dict())


@repos_bp.route("/api/repositories/<int:repo_id>", methods=["DELETE"])
def delete_repository(repo_id):
    repo = db.get_or_404(Repository, repo_id)
    db.session.delete(repo)
    db.session.commit()
    return jsonify({"message": "Repository removed"}), 200
