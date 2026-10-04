import csv
import io

from tests.conftest import log_in, sign_up


def test_analytics_on_empty_database(admin):
    a = admin.get("/api/v1/admin/analytics").json()
    assert a["students"] == {"active": 0, "inactive": 0, "total": 0}
    assert a["learning"]["average_progress"] is None and a["placement"] == []


def test_analytics_are_derived_from_records(alice, bob, admin):
    alice.post("/api/v1/skills", json={"name": "Py", "category": "programming", "level": "beginner"})
    bob.post("/api/v1/skills", json={"name": "Go", "category": "programming", "level": "beginner"})
    bob.post("/api/v1/skills", json={"name": "React", "category": "web", "level": "beginner"})
    alice.post("/api/v1/goals", json={"title": "A", "category": "web", "progress": 50})
    alice.post("/api/v1/goals", json={"title": "B", "category": "web", "progress": 100})
    alice.post("/api/v1/placement/assessments", json={"category": "aptitude", "title": "t", "score": 25, "max_score": 50, "assessed_on": "2025-01-01"})
    c = alice.post("/api/v1/certifications", json={"title": "C", "issuer": "I", "issue_date": "2025-01-01"}).json()
    admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "verified"})
    bob.post("/api/v1/certifications", json={"title": "D", "issuer": "I", "issue_date": "2025-01-01"})
    admin.patch(f"/api/v1/admin/students/{bob.user['id']}/status", json={"is_active": False})

    a = admin.get("/api/v1/admin/analytics").json()
    assert a["students"] == {"active": 1, "inactive": 1, "total": 2}
    assert {d["department"]: d["count"] for d in a["by_department"]} == {"Computer Science": 1, "Electronics": 1}
    assert {y["year"]: y["count"] for y in a["by_year"]} == {3: 1, 2: 1}
    assert {s["category"]: s["count"] for s in a["skill_distribution"]} == {"programming": 2, "web": 1}
    assert a["certifications"] == {"verified": 1, "pending": 1}
    assert a["learning"]["total_goals"] == 2 and a["learning"]["average_progress"] == 75.0
    assert a["placement"][0]["average_percent"] == 50.0 and a["placement"][0]["students"] == 1


def test_student_directory_search_filter_paginate(alice, bob, admin):
    r = admin.get("/api/v1/admin/students").json()
    assert r["total"] == 2 and "password_hash" not in str(r)
    assert admin.get("/api/v1/admin/students?q=reg-002").json()["items"][0]["full_name"] == "Bob Demo"
    assert admin.get("/api/v1/admin/students?department=Electronics").json()["total"] == 1
    assert admin.get("/api/v1/admin/students?year=3").json()["total"] == 1
    assert len(admin.get("/api/v1/admin/students?page_size=1").json()["items"]) == 1
    assert admin.get("/api/v1/admin/students?q=%25").json()["total"] == 0


def test_student_detail_and_academic_update(alice, bob, admin):
    alice.post("/api/v1/skills", json={"name": "Py", "category": "programming", "level": "beginner"})
    d = admin.get(f"/api/v1/admin/students/{alice.user['id']}").json()
    assert d["counts"]["skills"] == 1 and d["skills"][0]["name"] == "Py" and "categories" in d["placement"]
    assert admin.get("/api/v1/admin/students/00000000-0000-0000-0000-000000000000").status_code == 404
    assert alice.get(f"/api/v1/admin/students/{bob.user['id']}").status_code == 403

    r = admin.patch(f"/api/v1/admin/students/{alice.user['id']}", json={"register_number": "NEW-9", "year_of_study": 4})
    assert r.status_code == 200 and r.json()["register_number"] == "NEW-9" and r.json()["year_of_study"] == 4
    assert admin.patch(f"/api/v1/admin/students/{alice.user['id']}", json={"register_number": "REG-002"}).status_code == 409


def test_admin_cannot_be_managed_as_student(admin, db):
    assert admin.patch(f"/api/v1/admin/students/{admin.user['id']}/status", json={"is_active": False}).status_code == 404


def test_audit_log_records_admin_actions_only(alice, admin):
    c = alice.post("/api/v1/certifications", json={"title": "C", "issuer": "I", "issue_date": "2025-01-01"}).json()
    admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "rejected"})
    admin.patch(f"/api/v1/admin/students/{alice.user['id']}/status", json={"is_active": False})
    logs = admin.get("/api/v1/admin/activity-logs").json()
    actions = [i["action"] for i in logs["items"]]
    assert "certificate.rejected" in actions and "student.deactivated" in actions
    assert all(i["actor_email"] == "admin@example.com" for i in logs["items"])  # student actions are not audit entries
    assert admin.get("/api/v1/admin/activity-logs?action=student.deactivated").json()["total"] == 1
    assert alice.get("/api/v1/admin/activity-logs").status_code in (401, 403)


def test_csv_export_authorisation_and_content(alice, bob, admin, anon):
    alice.post("/api/v1/skills", json={"name": "Py", "category": "programming", "level": "beginner"})
    assert anon.get("/api/v1/admin/reports/students.csv").status_code == 401
    assert alice.get("/api/v1/admin/reports/students.csv").status_code == 403
    r = admin.get("/api/v1/admin/reports/students.csv")
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    rows = list(csv.reader(io.StringIO(r.text)))
    assert rows[0][0] == "Full name" and len(rows) == 3
    assert "example.com" not in r.text  # emails are not exported
    alice_row = next(x for x in rows if x[0] == "Alice Demo")
    assert alice_row[5] == "1"  # skills count


def test_csv_neutralises_formula_injection(new_client, admin):
    evil = new_client()
    sign_up(evil, "evil@example.com", '=HYPERLINK("http://evil.test","click")', department="+cmd|' /C calc'!A0")
    cells = [c for row in csv.reader(io.StringIO(admin.get("/api/v1/admin/reports/students.csv").text)) for c in row]
    assert not any(c.startswith(("=", "+", "-", "@")) for c in cells)
    assert any(c.startswith("'=HYPERLINK") for c in cells) and any(c.startswith("'+cmd") for c in cells)


def test_student_dashboard_empty_and_populated(alice, admin):
    d = alice.get("/api/v1/dashboard").json()
    assert d["skills_count"] == 0 and d["goals"]["average_progress"] is None and d["placement"]["overall_percent"] is None
    assert d["full_name"] == "Alice Demo" and d["profile_completion"] == 40  # 4 of 10 fields filled at signup

    alice.post("/api/v1/skills", json={"name": "Py", "category": "programming", "level": "beginner"})
    alice.post("/api/v1/projects", json={"title": "P", "summary": "s"})
    a = alice.post("/api/v1/certifications", json={"title": "A", "issuer": "I", "issue_date": "2025-01-01"}).json()
    alice.post("/api/v1/certifications", json={"title": "B", "issuer": "I", "issue_date": "2025-01-01"})
    admin.patch(f"/api/v1/admin/certifications/{a['id']}/review", json={"status": "verified"})
    alice.post("/api/v1/goals", json={"title": "G", "category": "web", "progress": 30, "target_date": "2099-01-01"})
    d = alice.get("/api/v1/dashboard").json()
    assert (d["skills_count"], d["projects_count"]) == (1, 1)
    assert (d["certificates_submitted"], d["certificates_verified"]) == (2, 1)  # verified is a subset, not added on top
    assert d["goals"]["in_progress"] == 1 and d["upcoming_deadlines"][0]["title"] == "G"
    assert d["skill_distribution"] == [{"category": "programming", "count": 1}]
    kinds = {a["action"] for a in d["recent_activity"]}
    assert {"skill.created", "project.created"} <= kinds
    assert all(set(a) == {"action", "entity_type", "summary", "created_at"} for a in d["recent_activity"])  # no admin identity leaked


def test_dashboards_are_per_user(alice, bob):
    alice.post("/api/v1/skills", json={"name": "Py", "category": "programming", "level": "beginner"})
    assert bob.get("/api/v1/dashboard").json()["skills_count"] == 0
