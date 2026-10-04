import os

from app.core.config import get_settings

PDF = b"%PDF-1.4\n% fake but valid-looking test document\n"
CERT = {"title": "Cloud Basics", "issuer": "Acme Academy", "issue_date": "2025-01-01"}


def make_cert(client, **extra):
    r = client.post("/api/v1/certifications", json={**CERT, **extra})
    assert r.status_code == 201, r.text
    return r.json()


def upload(client, cert_id, name="my certificate.pdf", content=PDF, mime="application/pdf"):
    return client.post(f"/api/v1/certifications/{cert_id}/file", files={"file": (name, content, mime)})


def test_new_certificate_is_pending_and_cannot_self_verify(alice):
    c = make_cert(alice)
    assert c["status"] == "pending" and c["reviewed_at"] is None
    r = alice.patch(f"/api/v1/certifications/{c['id']}", json={"status": "verified"})
    assert r.status_code == 422  # unknown field


def test_upload_uses_server_generated_name_and_hides_paths(alice):
    c = make_cert(alice)
    r = upload(alice, c["id"], name="../../etc/passwd resume.pdf")
    assert r.status_code == 200 and r.json()["has_file"] is True
    assert "path" not in r.text and "file_key" not in r.text and "passwd" not in r.text
    stored = os.listdir(get_settings().upload_dir)
    assert stored and all(len(f) == 36 and f.endswith(".pdf") for f in stored)  # 32 hex + ".pdf"


def test_upload_rejects_bad_type_content_mime_and_size(alice, monkeypatch):
    c = make_cert(alice)
    before = set(os.listdir(get_settings().upload_dir))
    assert upload(alice, c["id"], "evil.exe", b"MZ\x90", "application/octet-stream").status_code == 422
    assert upload(alice, c["id"], "fake.pdf", b"MZ not a pdf", "application/pdf").status_code == 422  # magic bytes
    assert upload(alice, c["id"], "cert.pdf", PDF, "image/png").status_code == 422  # mime/extension mismatch
    assert upload(alice, c["id"], "empty.pdf", b"", "application/pdf").status_code == 422
    monkeypatch.setattr(get_settings(), "max_upload_bytes", 20)
    assert upload(alice, c["id"], "big.pdf", PDF + b"x" * 100, "application/pdf").status_code == 413
    # Every rejected upload must be cleaned up from disk.
    assert set(os.listdir(get_settings().upload_dir)) == before
    assert alice.get("/api/v1/certifications").json()["items"][0]["has_file"] is False


def test_file_download_is_authorised(alice, bob, admin, anon):
    c = make_cert(alice)
    upload(alice, c["id"])
    own = alice.get(f"/api/v1/certifications/{c['id']}/file")
    assert own.status_code == 200 and own.content == PDF
    assert "attachment" in own.headers["content-disposition"] and own.headers["x-content-type-options"] == "nosniff"
    assert bob.get(f"/api/v1/certifications/{c['id']}/file").status_code == 404
    assert anon.get(f"/api/v1/certifications/{c['id']}/file").status_code == 401
    assert admin.get(f"/api/v1/admin/certifications/{c['id']}/file").status_code == 200
    assert bob.get(f"/api/v1/admin/certifications/{c['id']}/file").status_code == 403


def test_students_cannot_review_but_admins_can(alice, admin):
    c = make_cert(alice)
    assert alice.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "verified"}).status_code == 403
    r = admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "verified", "notes": "Checked issuer site"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "verified" and body["reviewer_name"] == "admin@example.com"
    assert body["reviewed_at"] and body["review_notes"] == "Checked issuer site" and body["student_name"] == "Alice Demo"
    assert admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "pending"}).status_code == 422


def test_review_queue_filters_and_search(alice, bob, admin):
    a = make_cert(alice, title="Python Basics")
    make_cert(bob, title="Networking")
    admin.patch(f"/api/v1/admin/certifications/{a['id']}/review", json={"status": "rejected"})
    q = admin.get("/api/v1/admin/certifications?status=pending").json()
    assert q["total"] == 1 and q["items"][0]["student_name"] == "Bob Demo"
    assert admin.get("/api/v1/admin/certifications?q=python").json()["total"] == 1
    assert admin.get("/api/v1/admin/certifications?q=bob").json()["total"] == 1
    assert alice.get("/api/v1/certifications?status=rejected").json()["total"] == 1


def test_editing_key_details_or_evidence_resets_review(alice, admin):
    c = make_cert(alice)
    admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "verified"})
    assert alice.patch(f"/api/v1/certifications/{c['id']}", json={"is_public": True}).json()["status"] == "verified"
    r = alice.patch(f"/api/v1/certifications/{c['id']}", json={"title": "Changed title"}).json()
    assert r["status"] == "pending" and r["reviewed_at"] is None

    admin.patch(f"/api/v1/admin/certifications/{c['id']}/review", json={"status": "verified"})
    assert upload(alice, c["id"]).json()["status"] == "pending"


def test_certificate_date_validation(alice):
    r = alice.post("/api/v1/certifications", json={**CERT, "expiry_date": "2024-01-01"})
    assert r.status_code == 422


def test_deleting_certificate_removes_file(alice):
    c = make_cert(alice)
    upload(alice, c["id"])
    before = set(os.listdir(get_settings().upload_dir))
    assert alice.delete(f"/api/v1/certifications/{c['id']}").status_code == 204
    assert len(set(os.listdir(get_settings().upload_dir))) == len(before) - 1
