from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    repositories = db.relationship("Repository", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Repository(db.Model):
    __tablename__ = "repositories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    provider = db.Column(db.String(50), nullable=False, default="github")
    repository_url = db.Column(db.String(1024), nullable=False)
    repository_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    default_branch = db.Column(db.String(100), nullable=True, default="main")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    analyses = db.relationship("RepositoryAnalysis", backref="repository", lazy=True, cascade="all, delete-orphan")
    debugging_sessions = db.relationship("DebuggingSession", backref="repository", lazy=True, cascade="all, delete-orphan")
    deployment_checks = db.relationship("DeploymentCheck", backref="repository", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider,
            "repository_url": self.repository_url,
            "repository_name": self.repository_name,
            "description": self.description,
            "default_branch": self.default_branch,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RepositoryAnalysis(db.Model):
    __tablename__ = "repository_analyses"

    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repositories.id"), nullable=False)
    analysis_result = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "repository_id": self.repository_id,
            "analysis_result": self.analysis_result,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DebuggingSession(db.Model):
    __tablename__ = "debugging_sessions"

    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repositories.id"), nullable=True)
    error_input = db.Column(db.Text, nullable=False)
    analysis_result = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "repository_id": self.repository_id,
            "error_input": self.error_input,
            "analysis_result": self.analysis_result,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DeploymentCheck(db.Model):
    __tablename__ = "deployment_checks"

    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repositories.id"), nullable=False)
    results = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "repository_id": self.repository_id,
            "results": self.results,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
