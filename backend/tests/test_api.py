from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from backend import main as backend_main


class PortfolioApiTests(unittest.TestCase):
    def setUp(self) -> None:
        backend_main._lead_rate_buckets.clear()
        self.client_context = TestClient(backend_main.app, client=("203.0.113.10", 50000))
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

    def test_security_headers_include_hsts(self) -> None:
        response = self.client.get("/healthz")

        self.assertEqual(response.headers["Strict-Transport-Security"], "max-age=31536000; includeSubDomains")

    def test_experience_endpoint_returns_items(self) -> None:
        response = self.client.get("/api/v1/experience")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["items"]), 5)
        self.assertEqual(data["items"][0]["company"], "Sturdy AI")

    def test_projects_endpoint_uses_fallback_when_api_key_missing(self) -> None:
        with (
            patch.dict(os.environ, {"SPARK_SWARM_API_KEY": ""}, clear=False),
            patch.object(backend_main.settings, "spark_swarm_api_key", None),
        ):
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

    def test_spa_catch_all_keeps_traversal_attempts_inside_static_root(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            static_root = Path(temp_dir)
            (static_root / "index.html").write_text("SPA shell", encoding="utf-8")

            with patch.object(backend_main, "STATIC_DIR", static_root):
                encoded_response = self.client.get("/..%2f..%2f..%2fetc%2fpasswd")
                raw_response = self.client.get("/../../../etc/passwd")

        self.assertEqual(encoded_response.status_code, 200)
        self.assertEqual(encoded_response.text, "SPA shell")
        self.assertEqual(raw_response.status_code, 200)
        self.assertEqual(raw_response.text, "SPA shell")

    def test_interactive_api_docs_are_disabled_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            static_root = Path(temp_dir)
            (static_root / "index.html").write_text("SPA shell", encoding="utf-8")

            with patch.object(backend_main, "STATIC_DIR", static_root):
                docs_response = self.client.get("/docs")
                openapi_response = self.client.get("/openapi.json")

        self.assertEqual(docs_response.status_code, 404)
        self.assertEqual(openapi_response.status_code, 404)

    def test_lead_endpoint_forwards_success_and_honeypot_unchanged(self) -> None:
        upstream_response = httpx.Response(
            202,
            json={"status": "accepted", "message": "Thanks"},
        )
        mock_client = AsyncMock()
        mock_client.post.return_value = upstream_response
        payload = {
            "name": "Rich Miles",
            "email": "rich@example.com",
            "company": "Acme",
            "message": "I need a portal.",
            "website": "https://spam.example/",
        }

        with (
            patch.object(backend_main, "_http_client", mock_client),
            patch.object(backend_main.settings, "spark_swarm_api_url", "https://sparkswarm.com/api/v1"),
        ):
            response = self.client.post(
                "/api/v1/lead",
                json=payload,
                headers={"X-Forwarded-For": "198.51.100.7, 10.0.0.8"},
            )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json(), {"status": "accepted", "message": "Thanks"})
        mock_client.post.assert_awaited_once_with(
            "https://sparkswarm.com/api/v1/public/sparks/richmiles-xyz/leads",
            json={
                "email": "rich@example.com",
                "name": "Rich Miles",
                "company": "Acme",
                "message": "I need a portal.",
                "source_url": "https://richmiles.xyz/#services",
                "website": "https://spam.example/",
            },
            # Only the entry Caddy appended (the right-most inbound one) is trustworthy;
            # forwarding the caller-supplied prefix would let upstream key on spoofed values.
            headers={"X-Forwarded-For": "10.0.0.8"},
        )

    def test_lead_endpoint_rejects_invalid_payload(self) -> None:
        response = self.client.post(
            "/api/v1/lead",
            json={"name": "", "email": "not-an-email", "company": "x" * 201},
        )

        self.assertEqual(response.status_code, 422)

    def test_lead_endpoint_rejects_oversized_request_body(self) -> None:
        body = b'{"name":"Rich","email":"rich@example.com","message":"' + b"x" * 70_000 + b'"}'

        response = self.client.post(
            "/api/v1/lead",
            content=body,
            headers={"content-type": "application/json"},
        )

        self.assertEqual(response.status_code, 413)

    def test_lead_endpoint_checks_actual_body_when_content_length_is_underreported(self) -> None:
        body = b'{"name":"Rich","email":"rich@example.com","message":"' + b"x" * 70_000 + b'"}'

        response = self.client.post(
            "/api/v1/lead",
            content=body,
            headers={"content-type": "application/json", "content-length": "1"},
        )

        self.assertEqual(response.status_code, 413)

    def test_lead_endpoint_rejects_oversized_website(self) -> None:
        response = self.client.post(
            "/api/v1/lead",
            json={"name": "Rich", "email": "rich@example.com", "website": "x" * 201},
        )

        self.assertEqual(response.status_code, 422)

    def test_lead_endpoint_maps_upstream_rate_limit(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(429, json={"error": "slow down"})

        with patch.object(backend_main, "_http_client", mock_client):
            response = self.client.post(
                "/api/v1/lead",
                json={"name": "Rich", "email": "rich@example.com"},
            )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json(), {"detail": "Too many submissions, please try again later."})

    def test_lead_endpoint_enforces_local_rate_limit_per_client(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(202, json={"status": "accepted"})

        with patch.object(backend_main, "_http_client", mock_client):
            responses = [
                self.client.post(
                    "/api/v1/lead",
                    json={"name": "Rich", "email": "rich@example.com"},
                )
                for _ in range(backend_main.LEAD_RATE_LIMIT_MAX_REQUESTS + 1)
            ]

        self.assertEqual([response.status_code for response in responses], [202] * 5 + [429])
        self.assertEqual(mock_client.post.await_count, backend_main.LEAD_RATE_LIMIT_MAX_REQUESTS)
        self.assertEqual(responses[-1].json(), {"detail": "Too many submissions, please try again later."})

    def test_lead_rate_limit_is_per_visitor_behind_the_proxy(self) -> None:
        # Caddy appends the peer address, so every visitor shares one request.client.host.
        # Keying on that would make the per-IP limit a global one and 429 real prospects.
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(202, json={"status": "accepted"})

        with patch.object(backend_main, "_http_client", mock_client):
            exhausted = [
                self.client.post(
                    "/api/v1/lead",
                    json={"name": "Rich", "email": "rich@example.com"},
                    headers={"X-Forwarded-For": "198.51.100.7"},
                )
                for _ in range(backend_main.LEAD_RATE_LIMIT_MAX_REQUESTS + 1)
            ]
            other_visitor = self.client.post(
                "/api/v1/lead",
                json={"name": "Rich", "email": "rich@example.com"},
                headers={"X-Forwarded-For": "198.51.100.8"},
            )

        self.assertEqual(exhausted[-1].status_code, 429)
        self.assertEqual(other_visitor.status_code, 202)

    def test_lead_rate_limit_ignores_spoofed_forwarded_entries(self) -> None:
        # Only the right-most entry is Caddy's; anything left of it is caller-supplied,
        # so rotating it must not hand the caller a fresh bucket each request.
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(202, json={"status": "accepted"})

        with patch.object(backend_main, "_http_client", mock_client):
            responses = [
                self.client.post(
                    "/api/v1/lead",
                    json={"name": "Rich", "email": "rich@example.com"},
                    headers={"X-Forwarded-For": f"10.0.0.{i}, 198.51.100.9"},
                )
                for i in range(backend_main.LEAD_RATE_LIMIT_MAX_REQUESTS + 1)
            ]

        self.assertEqual(responses[-1].status_code, 429)

    def test_lead_forwards_the_real_client_ip_upstream(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(202, json={"status": "accepted"})

        with patch.object(backend_main, "_http_client", mock_client):
            self.client.post(
                "/api/v1/lead",
                json={"name": "Rich", "email": "rich@example.com"},
                headers={"X-Forwarded-For": "10.0.0.1, 198.51.100.11"},
            )

        sent = mock_client.post.await_args.kwargs["headers"]["X-Forwarded-For"]
        self.assertEqual(sent, "198.51.100.11")

    def test_lead_endpoint_maps_upstream_failure_to_503(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.return_value = httpx.Response(500, json={"internal": "secret"})

        with patch.object(backend_main, "_http_client", mock_client):
            response = self.client.post(
                "/api/v1/lead",
                json={"name": "Rich", "email": "rich@example.com"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": backend_main.LEAD_FAILURE_DETAIL})
        self.assertNotIn("secret", response.text)


if __name__ == "__main__":
    unittest.main()
