"""
AI Service abstraction layer.
All AI calls go through this interface so the underlying provider can be swapped.
"""
from app.services.watsonx_service import WatsonXService

_provider = None


def _get_provider():
    global _provider
    if _provider is None:
        _provider = WatsonXService()
    return _provider


def analyze_repository(context: dict) -> dict:
    return _get_provider().analyze_repository(context)


def analyze_debug(payload: dict) -> dict:
    return _get_provider().analyze_debug(payload)


def analyze_testing(payload: dict) -> dict:
    return _get_provider().analyze_testing(payload)


def analyze_deployment(payload: dict) -> dict:
    return _get_provider().analyze_deployment(payload)


def health_check() -> dict:
    return _get_provider().health_check()
