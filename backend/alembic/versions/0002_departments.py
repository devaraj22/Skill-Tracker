"""departments and staff assignments

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-18 16:00:00.000000

Strategy
--------
* Add four new tables.
* Add a nullable `department_id` FK column to `student_profiles`.
* Leave the existing free-text `department` column in place until records
  are migrated and verified by an administrator.
* Use batch_alter_table for every ALTER TABLE so the migration works on
  both SQLite (development) and PostgreSQL (production).
"""
from alembic import op
import sqlalchemy as sa


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. departments ───────────────────────────────────────────────────────
    op.create_table(
        'departments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column(
            'school_group',
            sa.Enum('soc', 'non_soc', name='schoolgroup',
                    native_enum=False, create_constraint=True, length=32),
            nullable=False,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_departments')),
        sa.UniqueConstraint('code', name=op.f('uq_departments_code')),
    )
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_departments_code'), ['code'], unique=True)
        batch_op.create_index(batch_op.f('ix_departments_school_group'), ['school_group'], unique=False)

    # ── 2. department_staff_assignments ──────────────────────────────────────
    op.create_table(
        'department_staff_assignments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('department_id', sa.Uuid(), nullable=False),
        sa.Column(
            'assignment_role',
            sa.Enum('faculty', 'coordinator', name='staffrole',
                    native_enum=False, create_constraint=True, length=32),
            nullable=False,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'],
                                name=op.f('fk_department_staff_assignments_department_id_departments'),
                                ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_department_staff_assignments_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_department_staff_assignments')),
        sa.UniqueConstraint('user_id', 'department_id', name='uq_staff_dept'),
    )
    with op.batch_alter_table('department_staff_assignments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_department_staff_assignments_department_id'),
                              ['department_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_department_staff_assignments_user_id'),
                              ['user_id'], unique=False)

    # ── 3. department_skill_requirements ─────────────────────────────────────
    op.create_table(
        'department_skill_requirements',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('department_id', sa.Uuid(), nullable=False),
        sa.Column('skill_name', sa.String(length=80), nullable=False),
        sa.Column(
            'category',
            sa.Enum('programming', 'dsa', 'ai_ml', 'web', 'databases', 'cloud',
                    'tools', 'soft_skills', name='skillcategory',
                    native_enum=False, create_constraint=True, length=32),
            nullable=False,
        ),
        sa.Column(
            'target_level',
            sa.Enum('beginner', 'intermediate', 'advanced', 'expert',
                    name='skilllevel', native_enum=False, create_constraint=True, length=32),
            nullable=False,
        ),
        sa.Column('study_year', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.CheckConstraint('weight > 0', name=op.f('ck_department_skill_requirements_weight_positive')),
        sa.CheckConstraint('study_year IS NULL OR (study_year BETWEEN 1 AND 6)',
                           name=op.f('ck_department_skill_requirements_req_year_range')),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'],
                                name=op.f('fk_department_skill_requirements_department_id_departments'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_department_skill_requirements')),
    )
    with op.batch_alter_table('department_skill_requirements', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_department_skill_requirements_category'),
                              ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_department_skill_requirements_department_id'),
                              ['department_id'], unique=False)

    # ── 4. skill_assessments ──────────────────────────────────────────────────
    op.create_table(
        'skill_assessments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('skill_name', sa.String(length=80), nullable=False),
        sa.Column(
            'category',
            sa.Enum('programming', 'dsa', 'ai_ml', 'web', 'databases', 'cloud',
                    'tools', 'soft_skills', name='skillcategory',
                    native_enum=False, create_constraint=True, length=32),
            nullable=False,
        ),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('max_score', sa.Float(), nullable=False),
        sa.Column('assessed_by_id', sa.Uuid(), nullable=True),
        sa.Column('assessed_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('feedback', sa.String(length=2000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.CheckConstraint('max_score > 0', name=op.f('ck_skill_assessments_sa_max_positive')),
        sa.CheckConstraint('score >= 0', name=op.f('ck_skill_assessments_sa_score_nonneg')),
        sa.CheckConstraint('score <= max_score', name=op.f('ck_skill_assessments_sa_score_le_max')),
        sa.ForeignKeyConstraint(['assessed_by_id'], ['users.id'],
                                name=op.f('fk_skill_assessments_assessed_by_id_users'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_skill_assessments_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_skill_assessments')),
        sa.Index('ix_skill_assessments_user_skill', 'user_id', 'skill_name'),
    )
    with op.batch_alter_table('skill_assessments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_skill_assessments_category'), ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_skill_assessments_user_id'), ['user_id'], unique=False)

    # ── 5. Add department_id FK column to student_profiles ───────────────────
    #    batch_alter_table is required for SQLite (which doesn't support
    #    ALTER TABLE ... ADD COLUMN with inline foreign key).
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('department_id', sa.Uuid(), nullable=True)
        )
        batch_op.create_index(
            batch_op.f('ix_student_profiles_department_id'), ['department_id'], unique=False
        )
        batch_op.create_foreign_key(
            op.f('fk_student_profiles_department_id_departments'),
            'departments', ['department_id'], ['id'], ondelete='SET NULL'
        )

    # ── 6. Extend the role enum to include faculty and coordinator ────────────
    #    SQLite stores enums as VARCHAR with a CHECK constraint.  The existing
    #    constraint must be dropped and recreated with the new values.
    #    On PostgreSQL this step would use ALTER TYPE instead, but because the
    #    enum is declared with native_enum=False the values live only in the
    #    CHECK constraint on the column, so we use batch mode here too.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'role',
            type_=sa.Enum('student', 'admin', 'faculty', 'coordinator',
                          name='role', native_enum=False,
                          create_constraint=True, length=32),
            existing_type=sa.Enum('student', 'admin', name='role',
                                  native_enum=False, create_constraint=True, length=32),
            existing_nullable=False,
        )


def downgrade() -> None:
    # Reverse step 6 — shrink role enum back
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'role',
            type_=sa.Enum('student', 'admin', name='role',
                          native_enum=False, create_constraint=True, length=32),
            existing_type=sa.Enum('student', 'admin', 'faculty', 'coordinator',
                                  name='role', native_enum=False,
                                  create_constraint=True, length=32),
            existing_nullable=False,
        )

    # Reverse step 5
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.drop_constraint(
            op.f('fk_student_profiles_department_id_departments'), type_='foreignkey'
        )
        batch_op.drop_index(batch_op.f('ix_student_profiles_department_id'))
        batch_op.drop_column('department_id')

    # Reverse steps 4-1
    with op.batch_alter_table('skill_assessments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_skill_assessments_user_id'))
        batch_op.drop_index(batch_op.f('ix_skill_assessments_category'))
    op.drop_index('ix_skill_assessments_user_skill', table_name='skill_assessments')
    op.drop_table('skill_assessments')

    with op.batch_alter_table('department_skill_requirements', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_department_skill_requirements_department_id'))
        batch_op.drop_index(batch_op.f('ix_department_skill_requirements_category'))
    op.drop_table('department_skill_requirements')

    with op.batch_alter_table('department_staff_assignments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_department_staff_assignments_user_id'))
        batch_op.drop_index(batch_op.f('ix_department_staff_assignments_department_id'))
    op.drop_table('department_staff_assignments')

    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_departments_school_group'))
        batch_op.drop_index(batch_op.f('ix_departments_code'))
    op.drop_table('departments')
