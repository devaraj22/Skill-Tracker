"""Builds the PUBLIC portfolio from explicit allow-listed fields (never serialises the private model)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Achievement, Certification, Project, Skill, StudentProfile
from app.models.enums import CertStatus


def build_public_portfolio(db: Session, username: str) -> dict | None:
    profile = db.scalar(select(StudentProfile).where(StudentProfile.portfolio_username == username.lower()))
    if profile is None or not profile.portfolio_public or not profile.user.is_active:
        return None
    sections = set(profile.portfolio_sections or [])
    uid = profile.user_id
    out = {
        "username": profile.portfolio_username, "full_name": profile.full_name, "bio": profile.bio,
        "avatar_url": profile.avatar_url, "github_url": profile.github_url, "linkedin_url": profile.linkedin_url,
        "resume_url": profile.resume_url if "resume" in sections else None,
        "sections": sorted(sections), "skills": [], "projects": [], "certifications": [], "achievements": [],
    }
    if "skills" in sections:
        q = select(Skill).where(Skill.user_id == uid, Skill.is_public.is_(True)).order_by(Skill.category, Skill.name)
        for s in db.scalars(q):
            out["skills"].append({"name": s.name, "category": s.category.value, "level": s.level.value})
    if "projects" in sections:
        q = select(Project).where(Project.user_id == uid, Project.is_public.is_(True)).order_by(Project.position, Project.created_at.desc())
        for p in db.scalars(q):
            out["projects"].append({
                "id": str(p.id), "title": p.title, "summary": p.summary, "description": p.description,
                "tech_stack": p.tech_stack, "repo_url": p.repo_url, "demo_url": p.demo_url,
                "cover_image_url": p.cover_image_url, "status": p.status.value,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
            })
    if "certifications" in sections:  # only admin-verified AND student-published
        q = select(Certification).where(
            Certification.user_id == uid, Certification.status == CertStatus.verified, Certification.is_public.is_(True)
        ).order_by(Certification.issue_date.desc())
        for c in db.scalars(q):
            out["certifications"].append({
                "title": c.title, "issuer": c.issuer, "issue_date": c.issue_date.isoformat(),
                "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None, "credential_url": c.credential_url,
            })
    if "achievements" in sections:
        q = select(Achievement).where(Achievement.user_id == uid, Achievement.is_public.is_(True)).order_by(Achievement.achieved_on.desc())
        for a in db.scalars(q):
            out["achievements"].append({
                "title": a.title, "kind": a.kind.value, "organization": a.organization, "result": a.result,
                "description": a.description, "achieved_on": a.achieved_on.isoformat(), "evidence_url": a.evidence_url,
            })
    return out
