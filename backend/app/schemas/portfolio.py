from pydantic import BaseModel


class PublicSkill(BaseModel):
    name: str
    category: str
    level: str


class PublicProject(BaseModel):
    id: str
    title: str
    summary: str
    description: str | None
    tech_stack: list[str]
    repo_url: str | None
    demo_url: str | None
    cover_image_url: str | None
    status: str
    start_date: str | None
    end_date: str | None


class PublicCertification(BaseModel):
    title: str
    issuer: str
    issue_date: str
    expiry_date: str | None
    credential_url: str | None


class PublicAchievement(BaseModel):
    title: str
    kind: str
    organization: str
    result: str | None
    description: str | None
    achieved_on: str
    evidence_url: str | None


class PublicPortfolio(BaseModel):
    """Only fields listed here can ever reach the public (email, register number etc. are absent by design)."""
    username: str
    full_name: str
    bio: str | None
    avatar_url: str | None
    github_url: str | None
    linkedin_url: str | None
    resume_url: str | None
    sections: list[str]
    skills: list[PublicSkill]
    projects: list[PublicProject]
    certifications: list[PublicCertification]
    achievements: list[PublicAchievement]
