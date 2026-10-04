"""Role constants and helpers. Roles always come from the database, never from the client."""
from app.models.enums import Role

ADMIN_ROLES = {Role.admin}
