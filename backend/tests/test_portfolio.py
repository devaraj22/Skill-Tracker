import json

PUBLISH = {"portfolio_username": "alice-demo", "portfolio_public": True}


def seed(alice, admin):
    alice.patch("/api/v1/students/me", json={**PUBLISH, "bio": "Hi there", "resume_url": "https://example.com/cv.pdf",
                                             "github_url": "https://github.com/alice"})
    alice.post("/api/v1/projects", json={"title": "Public proj", "summary": "visible", "is_public": True})
    alice.post("/api/v1/projects", json={"title": "Secret proj", "summary": "hidden"})
    alice.post("/api/v1/achievements", json={"title": "Shown", "kind": "award", "organization": "O", "achieved_on": "2025-01-01", "is_public": True})
    alice.post("/api/v1/achievements", json={"title": "Private award", "kind": "award", "organization": "O", "achieved_on": "2025-01-01"})
    alice.post("/api/v1/skills", json={"name": "Python", "category": "programming", "level": "advanced", "notes": "internal note", "evidence_url": "https://example.com/e"})
    pending = alice.post("/api/v1/certifications", json={"title": "Pending cert", "issuer": "X", "issue_date": "2025-01-01", "is_public": True}).json()
    ok = alice.post("/api/v1/certifications", json={"title": "Verified cert", "issuer": "X", "issue_date": "2025-01-01", "is_public": True}).json()
    admin.patch(f"/api/v1/admin/certifications/{ok['id']}/review", json={"status": "verified", "notes": "private review note"})
    return pending, ok


def test_unpublished_and_unknown_return_404(alice, anon):
    assert anon.get("/api/v1/portfolio/nobody").status_code == 404
    alice.patch("/api/v1/students/me", json={"portfolio_username": "alice-demo"})
    assert anon.get("/api/v1/portfolio/alice-demo").status_code == 404  # username set but not published


def test_public_portfolio_exposes_only_published_data(alice, admin, anon):
    seed(alice, admin)
    r = anon.get("/api/v1/portfolio/ALICE-demo")
    assert r.status_code == 200
    p = r.json()
    assert p["full_name"] == "Alice Demo" and p["bio"] == "Hi there"
    assert [x["title"] for x in p["projects"]] == ["Public proj"]
    assert [x["title"] for x in p["achievements"]] == ["Shown"]
    assert [x["title"] for x in p["certifications"]] == ["Verified cert"]  # pending one is hidden
    assert p["skills"] == [{"name": "Python", "category": "programming", "level": "advanced"}]
    text = json.dumps(p)
    for secret in ("alice@example.com", "REG-001", "Computer Science", "internal note", "private review note", "Secret proj", "Private award", "Pending cert", "file_key", "password"):
        assert secret not in text


def test_sections_can_be_hidden(alice, admin, anon):
    seed(alice, admin)
    alice.patch("/api/v1/students/me", json={"portfolio_sections": ["projects"]})
    p = anon.get("/api/v1/portfolio/alice-demo").json()
    assert p["skills"] == [] and p["achievements"] == [] and p["certifications"] == [] and p["resume_url"] is None
    assert len(p["projects"]) == 1
    alice.patch("/api/v1/students/me", json={"portfolio_sections": ["projects", "resume"]})
    assert anon.get("/api/v1/portfolio/alice-demo").json()["resume_url"] == "https://example.com/cv.pdf"


def test_unpublishing_and_deactivation_hide_the_portfolio(alice, admin, anon):
    alice.patch("/api/v1/students/me", json=PUBLISH)
    assert anon.get("/api/v1/portfolio/alice-demo").status_code == 200
    alice.patch("/api/v1/students/me", json={"portfolio_public": False})
    assert anon.get("/api/v1/portfolio/alice-demo").status_code == 404
    alice.patch("/api/v1/students/me", json={"portfolio_public": True})
    admin.patch(f"/api/v1/admin/students/{alice.user['id']}/status", json={"is_active": False})
    assert anon.get("/api/v1/portfolio/alice-demo").status_code == 404


def test_edit_after_verification_removes_cert_from_public_view(alice, admin, anon):
    _, ok = seed(alice, admin)
    alice.patch(f"/api/v1/certifications/{ok['id']}", json={"issuer": "Changed"})
    assert anon.get("/api/v1/portfolio/alice-demo").json()["certifications"] == []
