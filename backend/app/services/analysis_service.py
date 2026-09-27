"""
Analysis service — orchestrates GitHub fetching and AI analysis for repository analysis.
"""
import logging

from app.services.github_service import GitHubService
from app.services import ai_service

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self):
        self.github = GitHubService()

    def run_repository_analysis(self, repository_url: str, branch: str = None) -> dict:
        owner, repo = GitHubService.parse_repo_url(repository_url)

        # Fetch metadata
        meta = self.github.get_repository(owner, repo)
        effective_branch = branch or meta.get("default_branch", "main")

        # Gather context
        readme = self.github.get_readme(owner, repo, effective_branch)
        file_tree = self.github.get_file_tree(owner, repo, effective_branch)
        config_files = self.github.get_config_files(owner, repo, effective_branch)

        context = {
            "repository_name": meta.get("name", repo),
            "readme": readme,
            "file_tree": file_tree,
            "config_files": config_files,
        }

        result = ai_service.analyze_repository(context)
        return {
            "repository_meta": meta,
            "analysis": result.get("data", {}),
        }

    def run_testing_analysis(self, repository_url: str, branch: str = None) -> dict:
        owner, repo = GitHubService.parse_repo_url(repository_url)
        meta = self.github.get_repository(owner, repo)
        effective_branch = branch or meta.get("default_branch", "main")

        file_tree = self.github.get_file_tree(owner, repo, effective_branch)
        existing_tests = self.github.get_test_files(owner, repo, effective_branch)

        payload = {
            "repository_name": meta.get("name", repo),
            "file_tree": file_tree,
            "existing_tests": existing_tests,
        }

        result = ai_service.analyze_testing(payload)
        return {
            "repository_meta": meta,
            "analysis": result.get("data", {}),
        }

    def run_deployment_check(self, repository_url: str, branch: str = None) -> dict:
        owner, repo = GitHubService.parse_repo_url(repository_url)
        meta = self.github.get_repository(owner, repo)
        effective_branch = branch or meta.get("default_branch", "main")

        file_tree = self.github.get_file_tree(owner, repo, effective_branch)
        config_files = self.github.get_config_files(owner, repo, effective_branch)
        env_files = self.github.get_env_file_names(owner, repo, effective_branch)
        readme = self.github.get_readme(owner, repo, effective_branch)

        payload = {
            "repository_name": meta.get("name", repo),
            "file_tree": file_tree,
            "config_files": config_files,
            "env_files": env_files,
            "readme": readme,
        }

        result = ai_service.analyze_deployment(payload)
        return {
            "repository_meta": meta,
            "analysis": result.get("data", {}),
        }
