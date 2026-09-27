"""
Google Gemini AI service.
Handles all communication with the Google Gemini API using the google-genai SDK.
"""
import json
import logging
import os
import re

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class WatsonXService:
    """AI service backed by Google Gemini. Named WatsonXService for drop-in compatibility."""

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model_id = os.environ.get("GEMINI_MODEL_ID", "gemini-2.0-flash")
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not self.api_key:
                raise ConfigurationError(
                    "Gemini service is not configured correctly. "
                    "Missing environment variable: GEMINI_API_KEY"
                )
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _generate(self, prompt: str, max_tokens: int = 2048) -> str:
        client = self._get_client()
        response = client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=0.2,
            ),
        )
        return response.text

    def _parse_json_response(self, raw: str) -> dict:
        """Attempt to extract JSON from model output."""
        raw = raw.strip()
        # Try direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        # Try extracting a JSON block
        match = re.search(r"\{[\s\S]+\}", raw)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        # Return the raw text wrapped in a generic structure
        return {"raw_response": raw, "parse_error": True}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def health_check(self) -> dict:
        try:
            client = self._get_client()
            client.models.generate_content(model=self.model_id, contents="Hello")
            return {"status": "ok", "model_id": self.model_id}
        except ConfigurationError as e:
            return {"status": "misconfigured", "error": str(e)}
        except Exception as e:
            logger.error("Gemini health check failed: %s", e)
            return {"status": "error", "error": str(e)}

    def analyze_repository(self, context: dict) -> dict:
        prompt = self._build_repository_prompt(context)
        try:
            raw = self._generate(prompt, max_tokens=2048)
            result = self._parse_json_response(raw)
            return {"success": True, "data": result}
        except ConfigurationError as e:
            raise
        except Exception as e:
            logger.error("Repository analysis failed: %s", e)
            raise AIServiceError("The AI analysis could not be completed. Please try again.") from e

    def analyze_debug(self, payload: dict) -> dict:
        prompt = self._build_debug_prompt(payload)
        try:
            raw = self._generate(prompt, max_tokens=1500)
            result = self._parse_json_response(raw)
            return {"success": True, "data": result}
        except ConfigurationError as e:
            raise
        except Exception as e:
            logger.error("Debug analysis failed: %s", e)
            raise AIServiceError("The AI analysis could not be completed. Please try again.") from e

    def analyze_testing(self, payload: dict) -> dict:
        prompt = self._build_testing_prompt(payload)
        try:
            raw = self._generate(prompt, max_tokens=2000)
            result = self._parse_json_response(raw)
            return {"success": True, "data": result}
        except ConfigurationError as e:
            raise
        except Exception as e:
            logger.error("Testing analysis failed: %s", e)
            raise AIServiceError("The AI analysis could not be completed. Please try again.") from e

    def analyze_deployment(self, payload: dict) -> dict:
        prompt = self._build_deployment_prompt(payload)
        try:
            raw = self._generate(prompt, max_tokens=1500)
            result = self._parse_json_response(raw)
            return {"success": True, "data": result}
        except ConfigurationError as e:
            raise
        except Exception as e:
            logger.error("Deployment analysis failed: %s", e)
            raise AIServiceError("The AI analysis could not be completed. Please try again.") from e

    # ------------------------------------------------------------------
    # Prompt builders
    # ------------------------------------------------------------------

    def _build_repository_prompt(self, context: dict) -> str:
        repo_name = context.get("repository_name", "unknown")
        readme = context.get("readme", "")
        file_tree = context.get("file_tree", "")
        config_files = context.get("config_files", "")
        entry_points = context.get("entry_points", "")

        return f"""You are a senior software architect analyzing a code repository called "{repo_name}".
Based on the repository information below, produce a structured JSON analysis.

README:
{readme[:3000] if readme else "Not available"}

File Structure:
{file_tree[:2000] if file_tree else "Not available"}

Configuration Files:
{config_files[:2000] if config_files else "Not available"}

Entry Points:
{entry_points[:1000] if entry_points else "Not available"}

Respond ONLY with a valid JSON object in this exact format:
{{
  "project_summary": "One paragraph description of what this project does",
  "technology_stack": ["list", "of", "technologies"],
  "architecture": "Brief architecture description",
  "entry_points": ["list of main entry point files"],
  "important_files": ["list of important files with brief descriptions"],
  "dependencies": ["key dependencies"],
  "api_routes": ["list of API routes if detectable"],
  "database_components": ["database models or tables if detectable"],
  "potential_risks": ["potential technical risks or concerns"],
  "developer_next_steps": ["recommended next steps for a developer new to this codebase"]
}}"""

    def _build_debug_prompt(self, payload: dict) -> str:
        error_message = payload.get("error_message", "")
        stack_trace = payload.get("stack_trace", "")
        affected_file = payload.get("affected_file", "")
        relevant_code = payload.get("relevant_code", "")
        context = payload.get("context", "")

        return f"""You are a senior software engineer helping debug a code issue.

Error Message:
{error_message}

Stack Trace:
{stack_trace[:2000] if stack_trace else "Not provided"}

Affected File:
{affected_file if affected_file else "Not specified"}

Relevant Code:
{relevant_code[:2000] if relevant_code else "Not provided"}

Additional Context:
{context[:500] if context else "None"}

Respond ONLY with a valid JSON object:
{{
  "probable_cause": "Most likely cause of this error",
  "explanation": "Technical explanation of what is happening",
  "relevant_code_location": "Where in the code the issue likely originates",
  "debugging_steps": ["step 1", "step 2", "step 3"],
  "suggested_fix": "Concrete suggestion for how to fix this",
  "potential_side_effects": ["things to watch out for when fixing"],
  "recommended_test": "A test that would catch this regression in the future",
  "confidence": "high|medium|low"
}}"""

    def _build_testing_prompt(self, payload: dict) -> str:
        repo_name = context_name = payload.get("repository_name", "unknown")
        file_tree = payload.get("file_tree", "")
        existing_tests = payload.get("existing_tests", "")
        source_files = payload.get("source_files", "")

        return f"""You are a senior QA engineer analyzing a project called "{repo_name}" to identify testing gaps.

File Structure:
{file_tree[:2000] if file_tree else "Not available"}

Existing Tests:
{existing_tests[:2000] if existing_tests else "None found"}

Source Files Context:
{source_files[:2000] if source_files else "Not available"}

Respond ONLY with a valid JSON object:
{{
  "testing_summary": "Overall assessment of test coverage",
  "existing_test_count": 0,
  "coverage_assessment": "high|medium|low|unknown",
  "untested_areas": ["list of important areas without tests"],
  "suggested_test_cases": [
    {{
      "name": "test name",
      "description": "what to test",
      "type": "unit|integration|e2e",
      "priority": "high|medium|low"
    }}
  ],
  "edge_cases": ["important edge cases to consider"],
  "regression_risks": ["areas at risk of regression"],
  "recommended_testing_tools": ["appropriate testing frameworks for this stack"]
}}"""

    def _build_deployment_prompt(self, payload: dict) -> str:
        repo_name = payload.get("repository_name", "unknown")
        file_tree = payload.get("file_tree", "")
        config_files = payload.get("config_files", "")
        env_files = payload.get("env_files", "")
        readme = payload.get("readme", "")

        return f"""You are a DevOps engineer reviewing project "{repo_name}" for deployment readiness.

File Structure:
{file_tree[:1500] if file_tree else "Not available"}

Configuration Files:
{config_files[:2000] if config_files else "Not available"}

Environment Files (names only, NOT values):
{env_files[:500] if env_files else "Not available"}

README:
{readme[:1000] if readme else "Not available"}

Respond ONLY with a valid JSON object:
{{
  "overall_status": "Ready|Needs Attention|Critical",
  "summary": "Overall deployment readiness summary",
  "checks": [
    {{
      "category": "category name",
      "item": "what was checked",
      "status": "Ready|Needs Attention|Critical",
      "finding": "what was found",
      "recommendation": "what to do"
    }}
  ],
  "missing_env_vars": ["list of likely missing environment variables"],
  "security_concerns": ["security issues to address before deployment"],
  "production_recommendations": ["general production readiness recommendations"]
}}"""


class ConfigurationError(Exception):
    """Raised when the AI service is not configured correctly."""


class AIServiceError(Exception):
    """Raised when AI inference fails."""
