"""
GitHub service — fetches repository metadata and structure via the GitHub REST API.
"""
import logging
import os
import re
from typing import Optional
import requests

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.environ.get("GITHUB_TOKEN")
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        })
        if self.token:
            self.session.headers["Authorization"] = f"Bearer {self.token}"

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    def parse_repo_url(url: str) -> tuple[str, str]:
        """Extract owner/repo from a GitHub URL or owner/repo string."""
        url = url.strip().rstrip("/")
        # Full URL
        match = re.match(
            r"https?://(?:www\.)?github\.com/([^/]+)/([^/]+?)(?:\.git)?$",
            url,
            re.IGNORECASE,
        )
        if match:
            return match.group(1), match.group(2)
        # owner/repo shorthand
        match = re.match(r"^([^/]+)/([^/]+)$", url)
        if match:
            return match.group(1), match.group(2)
        raise ValueError(
            f"Invalid GitHub repository URL or identifier: {url}. "
            "Expected format: https://github.com/owner/repo or owner/repo"
        )

    # ------------------------------------------------------------------
    # Metadata
    # ------------------------------------------------------------------

    def get_repository(self, owner: str, repo: str) -> dict:
        resp = self._get(f"/repos/{owner}/{repo}")
        return {
            "name": resp.get("full_name"),
            "description": resp.get("description"),
            "default_branch": resp.get("default_branch", "main"),
            "language": resp.get("language"),
            "stars": resp.get("stargazers_count", 0),
            "forks": resp.get("forks_count", 0),
            "open_issues": resp.get("open_issues_count", 0),
            "url": resp.get("html_url"),
            "private": resp.get("private", False),
        }

    # ------------------------------------------------------------------
    # File tree
    # ------------------------------------------------------------------

    def get_file_tree(self, owner: str, repo: str, branch: str = "main", max_files: int = 300) -> str:
        """Return a human-readable file tree string (limited depth)."""
        try:
            resp = self._get(f"/repos/{owner}/{repo}/git/trees/{branch}?recursive=1")
        except Exception:
            # Try HEAD branch fallback
            repo_meta = self.get_repository(owner, repo)
            branch = repo_meta.get("default_branch", "main")
            resp = self._get(f"/repos/{owner}/{repo}/git/trees/{branch}?recursive=1")

        tree = resp.get("tree", [])
        lines = []
        for item in tree[:max_files]:
            if item.get("type") in ("blob", "tree"):
                path = item.get("path", "")
                lines.append(path)
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # File content helpers
    # ------------------------------------------------------------------

    def get_file_content(self, owner: str, repo: str, path: str, branch: str = "main") -> Optional[str]:
        import base64
        try:
            resp = self._get(f"/repos/{owner}/{repo}/contents/{path}?ref={branch}")
            content = resp.get("content", "")
            encoding = resp.get("encoding", "base64")
            if encoding == "base64":
                return base64.b64decode(content).decode("utf-8", errors="replace")
            return content
        except Exception:
            return None

    def get_readme(self, owner: str, repo: str, branch: str = "main") -> str:
        """Retrieve README content."""
        for name in ("README.md", "README.rst", "README.txt", "README"):
            content = self.get_file_content(owner, repo, name, branch)
            if content:
                return content
        return ""

    def get_config_files(self, owner: str, repo: str, branch: str = "main") -> str:
        """Retrieve combined content of common configuration files."""
        config_names = [
            "package.json", "requirements.txt", "pyproject.toml",
            "Pipfile", "Cargo.toml", "go.mod", "pom.xml", "build.gradle",
            "docker-compose.yml", "Dockerfile", ".env.example",
            "vite.config.js", "vite.config.ts", "webpack.config.js",
            "tsconfig.json", ".eslintrc.json", "setup.py", "setup.cfg",
        ]
        collected = []
        for name in config_names:
            content = self.get_file_content(owner, repo, name, branch)
            if content:
                collected.append(f"=== {name} ===\n{content[:800]}")
            if len("\n\n".join(collected)) > 4000:
                break
        return "\n\n".join(collected)

    def get_env_file_names(self, owner: str, repo: str, branch: str = "main") -> str:
        """Return names of any env-related files (never their contents)."""
        file_tree = self.get_file_tree(owner, repo, branch)
        env_patterns = [".env", ".env.example", ".env.sample", ".env.local", ".env.production"]
        found = []
        for line in file_tree.splitlines():
            if any(line.endswith(p) or line == p.lstrip(".") for p in env_patterns):
                found.append(line)
        return "\n".join(found)

    def get_test_files(self, owner: str, repo: str, branch: str = "main") -> str:
        """Identify test files from the file tree."""
        file_tree = self.get_file_tree(owner, repo, branch)
        test_lines = [
            line for line in file_tree.splitlines()
            if any(kw in line.lower() for kw in ("test", "spec", "__tests__", "tests/", "/tests"))
        ]
        return "\n".join(test_lines[:100])

    # ------------------------------------------------------------------
    # HTTP helper
    # ------------------------------------------------------------------

    def _get(self, path: str) -> dict:
        url = f"{GITHUB_API}{path}"
        resp = self.session.get(url, timeout=15)
        if resp.status_code == 404:
            raise RepositoryNotFoundError(
                "We could not connect to this repository. "
                "Please check the repository URL and try again."
            )
        if resp.status_code == 401:
            raise GitHubAuthError(
                "GitHub authentication failed. "
                "Please check your GITHUB_TOKEN configuration."
            )
        if resp.status_code == 403:
            raise GitHubAuthError(
                "GitHub API rate limit exceeded or access denied. "
                "Please provide a valid GITHUB_TOKEN."
            )
        resp.raise_for_status()
        return resp.json()


class RepositoryNotFoundError(Exception):
    pass


class GitHubAuthError(Exception):
    pass
