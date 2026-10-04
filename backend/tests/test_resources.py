"""CRUD, ownership and validation for the student-owned resources."""
from datetime import date, timedelta

import pytest

RESOURCES = {
    "skills": ({"name": "Python", "category": "programming", "level": "beginner"}, {"level": "advanced"}, "level", "advanced"),
    "projects": ({"title": "Tracker", "summary": "A tracker"}, {"title": "Tracker v2"}, "title", "Tracker v2"),
    "achievements": ({"title": "Hack Day", "kind": "hackathon", "organization": "Org", "achieved_on": "2025-01-10"}, {"result": "Finalist"}, "result", "Finalist"),
    "goals": ({"title": "Learn SQL", "category": "databases"}, {"priority": "high"}, "priority", "high"),
    "certifications": ({"title": "Cloud Basics", "issuer": "Acme", "issue_date": "2025-01-01"}, {"issuer": "Acme Inc"}, "issuer", "Acme Inc"),
    "placement/assessments": ({"category": "aptitude", "title": "Mock 1", "score": 20, "max_score": 40, "assessed_on": "2025-02-01"}, {"score": 30}, "score", 30),
}


@pytest.mark.parametrize("name", RESOURCES)
def test_crud_and_ownership(name, alice, bob):
    create, patch, field, expected = RESOURCES[name]
    base = f"/api/v1/{name}"
    r = alice.post(base, json=create)
    assert r.status_code == 201, r.text
    item_id = r.json()["id"]

    assert alice.get(base).json()["total"] == 1
    r = alice.patch(f"{base}/{item_id}", json=patch)
    assert r.status_code == 200 and r.json()[field] == expected

    # Another student cannot see, change or delete it, and gets 404 (no hint that the id exists).
    assert bob.get(base).json()["total"] == 0
    assert bob.patch(f"{base}/{item_id}", json=patch).status_code == 404
    assert bob.delete(f"{base}/{item_id}").status_code == 404

    assert alice.delete(f"{base}/{item_id}").status_code == 204
    assert alice.get(base).json()["total"] == 0
    assert alice.delete(f"{base}/{item_id}").status_code == 404


@pytest.mark.parametrize("name", RESOURCES)
def test_resources_require_login(name, anon):
    assert anon.get(f"/api/v1/{name}").status_code == 401


def test_get_single_skill_and_project_are_owner_only(alice, bob):
    s = alice.post("/api/v1/skills", json=RESOURCES["skills"][0]).json()["id"]
    p = alice.post("/api/v1/projects", json=RESOURCES["projects"][0]).json()["id"]
    assert alice.get(f"/api/v1/skills/{s}").status_code == 200
    assert bob.get(f"/api/v1/skills/{s}").status_code == 404
    assert bob.get(f"/api/v1/projects/{p}").status_code == 404


def test_skill_search_filter_sort_and_duplicates(alice):
    for n, c, l in [("Python", "programming", "expert"), ("React", "web", "beginner"), ("Postgres", "databases", "advanced")]:
        alice.post("/api/v1/skills", json={"name": n, "category": c, "level": l})
    assert alice.post("/api/v1/skills", json={"name": "python", "category": "programming", "level": "beginner"}).status_code == 409
    assert [s["name"] for s in alice.get("/api/v1/skills?q=post").json()["items"]] == ["Postgres"]
    assert [s["name"] for s in alice.get("/api/v1/skills?category=web").json()["items"]] == ["React"]
    by_level = [s["level"] for s in alice.get("/api/v1/skills?sort=level&order=desc").json()["items"]]
    assert by_level == ["expert", "advanced", "beginner"]
    assert alice.get("/api/v1/skills?sort=password_hash").status_code == 422
    page = alice.get("/api/v1/skills?page_size=2&page=2").json()
    assert page["total"] == 3 and len(page["items"]) == 1


def test_search_treats_wildcards_literally(alice):
    alice.post("/api/v1/skills", json={"name": "C++", "category": "programming", "level": "beginner"})
    assert alice.get("/api/v1/skills?q=%25").json()["total"] == 0


@pytest.mark.parametrize("bad", ["javascript:alert(1)", "ftp://example.com", "not a url", "http://"])
def test_unsafe_urls_rejected(bad, alice):
    r = alice.post("/api/v1/skills", json={"name": "X", "category": "tools", "level": "beginner", "evidence_url": bad})
    assert r.status_code == 422


def test_invalid_enum_and_unknown_fields_rejected(alice):
    assert alice.post("/api/v1/skills", json={"name": "X", "category": "magic", "level": "beginner"}).status_code == 422
    assert alice.post("/api/v1/skills", json={"name": "X", "category": "tools", "level": "beginner", "user_id": "x"}).status_code == 422


def test_project_validation_and_reordering(alice, bob):
    a = alice.post("/api/v1/projects", json={"title": "A", "summary": "s"}).json()
    b = alice.post("/api/v1/projects", json={"title": "B", "summary": "s", "tech_stack": ["Go", "go", " Rust "]}).json()
    assert b["tech_stack"] == ["Go", "Rust"]
    bad = alice.post("/api/v1/projects", json={"title": "C", "summary": "s", "start_date": "2025-05-01", "end_date": "2025-04-01"})
    assert bad.status_code == 422
    assert alice.patch(f"/api/v1/projects/{a['id']}", json={"start_date": "2025-05-01", "end_date": "2025-04-01"}).status_code == 422
    r = alice.post("/api/v1/projects/reorder", json={"ids": [b["id"], a["id"]]})
    assert [p["title"] for p in r.json()] == ["B", "A"]
    assert [p["title"] for p in alice.get("/api/v1/projects").json()["items"]] == ["B", "A"]
    foreign = bob.post("/api/v1/projects", json={"title": "Bobs", "summary": "s"}).json()["id"]
    assert alice.post("/api/v1/projects/reorder", json={"ids": [foreign]}).status_code == 422


def test_goal_status_rules_and_overdue(alice):
    g = alice.post("/api/v1/goals", json={"title": "G", "category": "dsa", "progress": 40}).json()
    assert g["status"] == "in_progress"
    done = alice.patch(f"/api/v1/goals/{g['id']}", json={"progress": 100}).json()
    assert done["status"] == "completed"
    reopened = alice.patch(f"/api/v1/goals/{g['id']}", json={"progress": 60}).json()
    assert reopened["status"] == "in_progress"
    completed = alice.patch(f"/api/v1/goals/{g['id']}", json={"status": "completed"}).json()
    assert completed["progress"] == 100
    assert alice.patch(f"/api/v1/goals/{g['id']}", json={"progress": 101}).status_code == 422
    assert alice.patch(f"/api/v1/goals/{g['id']}", json={"progress": -1}).status_code == 422

    past = (date.today() - timedelta(days=3)).isoformat()
    late = alice.post("/api/v1/goals", json={"title": "Late", "category": "web", "target_date": past}).json()
    assert late["is_overdue"] is True
    assert [x["title"] for x in alice.get("/api/v1/goals?overdue=true").json()["items"]] == ["Late"]
    assert alice.get("/api/v1/goals?status=completed").json()["total"] == 1


def test_placement_score_validation(alice):
    url = "/api/v1/placement/assessments"
    ok = {"category": "aptitude", "title": "T", "score": 10, "max_score": 20, "assessed_on": "2025-01-01"}
    assert alice.post(url, json={**ok, "score": 21}).status_code == 422
    assert alice.post(url, json={**ok, "score": -1}).status_code == 422
    assert alice.post(url, json={**ok, "max_score": 0}).status_code == 422
    created = alice.post(url, json=ok).json()
    assert created["percent"] == 50.0
    assert alice.patch(f"{url}/{created['id']}", json={"score": 25}).status_code == 422  # exceeds stored max
    assert alice.patch(f"{url}/{created['id']}", json={"max_score": 5}).status_code == 422  # below stored score


def test_placement_summary_formula_uses_latest_per_category_and_ignores_missing(alice):
    url = "/api/v1/placement/assessments"
    alice.post(url, json={"category": "aptitude", "title": "old", "score": 10, "max_score": 100, "assessed_on": "2025-01-01"})
    alice.post(url, json={"category": "aptitude", "title": "new", "score": 80, "max_score": 100, "assessed_on": "2025-03-01"})
    alice.post(url, json={"category": "coding_dsa", "title": "dsa", "score": 20, "max_score": 40, "assessed_on": "2025-02-01"})
    s = alice.get("/api/v1/placement/summary").json()
    assert s["overall_percent"] == 65.0  # mean(80, 50); other 4 categories excluded, not zero
    assert s["categories_with_data"] == 2 and len(s["missing_categories"]) == 4
    assert any("Record your first" in step for step in s["next_steps"])
    assert "not a prediction" in s["formula"]


def test_profile_update_rules(alice, bob):
    r = alice.patch("/api/v1/students/me", json={"bio": "Hello", "github_url": "https://github.com/alice"})
    assert r.status_code == 200 and r.json()["bio"] == "Hello"
    assert alice.patch("/api/v1/students/me", json={"github_url": "https://evil.example.com/x"}).status_code == 422
    assert alice.patch("/api/v1/students/me", json={"full_name": None}).status_code == 422
    assert alice.patch("/api/v1/students/me", json={"register_number": "NEW-1"}).status_code == 403  # admin-only once set
    assert alice.patch("/api/v1/students/me", json={"email": "x@example.com"}).status_code == 422
    assert alice.patch("/api/v1/students/me", json={"portfolio_username": "alice-demo"}).status_code == 200
    assert bob.patch("/api/v1/students/me", json={"portfolio_username": "alice-demo"}).status_code == 409
    assert bob.patch("/api/v1/students/me", json={"portfolio_public": True}).status_code == 422  # needs a username
    assert alice.patch("/api/v1/students/me", json={"portfolio_username": "Bad Name!"}).status_code == 422
