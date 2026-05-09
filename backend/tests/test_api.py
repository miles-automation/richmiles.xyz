from __future__ import annotations

import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from backend import main as backend_main


class PortfolioApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client_context = TestClient(backend_main.app)
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)

    def test_profile_endpoint_returns_structured_profile(self) -> None:
        response = self.client.get("/api/v1/profile")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Rich Miles")
        self.assertEqual(data["location"], "Laramie, Wyoming")
        self.assertEqual(len(data["contact_links"]), 3)

    def test_experience_endpoint_returns_items(self) -> None:
        response = self.client.get("/api/v1/experience")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["items"]), 5)
        self.assertEqual(data["items"][0]["company"], "Sturdy AI")

    def test_projects_endpoint_uses_fallback_when_api_key_missing(self) -> None:
        with patch.dict(os.environ, {"SPARK_SWARM_API_KEY": ""}, clear=False):
            response = self.client.get("/api/v1/projects")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["source"], "fallback")
        self.assertIn("not configured", data["warning"])
        self.assertGreaterEqual(len(data["projects"]), 4)

    def test_projects_endpoint_returns_live_projects_when_upstream_available(self) -> None:
        upstream_response = httpx.Response(
            200,
            json={
                "sparks": [
                    {
                        "slug": "spark-swarm",
                        "name": "Spark Swarm",
                        "description": "Live control plane",
                        "domain": "sparkswarm.com",
                        "stage": "building",
                        "health": "healthy",
                        "last_deploy_at": "2026-03-13T12:00:00",
                        "category": "infrastructure",
                    },
                    {
                        "slug": "human-index",
                        "name": "Human Index",
                        "description": "Semantic memory",
                        "domain": "humanindex.io",
                        "stage": "live",
                        "health": "healthy",
                        "last_deploy_at": None,
                        "category": "productivity",
                    },
                    {
                        "slug": "idea-only",
                        "name": "Idea Only",
                        "description": "Should be filtered out",
                        "domain": None,
                        "stage": "idea",
                        "health": "unknown",
                        "last_deploy_at": None,
                        "category": None,
                    },
                ]
            },
            request=httpx.Request("GET", "https://sparkswarm.com/api/v1/sparks"),
        )
        mock_client = AsyncMock()
        mock_client.get.return_value = upstream_response

        with (
            patch.dict(os.environ, {"SPARK_SWARM_API_KEY": "test-key"}, clear=False),
            patch.object(backend_main, "_http_client", mock_client),
            patch.object(backend_main.settings, "spark_swarm_api_key", "test-key"),
        ):
            response = self.client.get("/api/v1/projects")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["source"], "live")
        self.assertIsNone(data["warning"])
        self.assertEqual([project["id"] for project in data["projects"]], ["spark-swarm", "human-index"])
        self.assertEqual(data["projects"][0]["icon"], "/img/spark-swarm.svg")
        self.assertEqual(data["projects"][1]["icon"], "/img/human-index.svg")


if __name__ == "__main__":
    unittest.main()
