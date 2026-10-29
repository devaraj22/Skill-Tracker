"""Tests for Departments, Requirements, Assessments, and Skill Gap Analysis."""


def test_department_crud_permissions(admin, alice, anon):
    # Student cannot create department
    res = alice.post(
        "/api/v1/departments",
        json={"code": "CSE", "name": "Computer Science and Engineering", "school_group": "soc"},
    )
    assert res.status_code == 403

    # Admin creates department
    res = admin.post(
        "/api/v1/departments",
        json={"code": "CSE", "name": "Computer Science and Engineering", "school_group": "soc"},
    )
    assert res.status_code == 201
    dept = res.json()
    assert dept["code"] == "CSE"
    assert dept["school_group"] == "soc"
    assert dept["is_active"] is True
    dept_id = dept["id"]

    # Duplicate code fails
    res_dup = admin.post(
        "/api/v1/departments",
        json={"code": "CSE", "name": "Another CS", "school_group": "soc"},
    )
    assert res_dup.status_code == 409

    # List departments (student, admin, and anon can read active ones)
    res_list = alice.get("/api/v1/departments")
    assert res_list.status_code == 200
    depts = res_list.json()
    assert len(depts) == 1
    assert depts[0]["id"] == dept_id

    res_anon = anon.get("/api/v1/departments")
    assert res_anon.status_code == 200
    assert len(res_anon.json()) == 1

    # Update department
    res_update = admin.patch(
        f"/api/v1/departments/{dept_id}",
        json={"name": "School of Computing"},
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "School of Computing"



def test_department_skill_requirements(admin, alice):
    # Create dept
    dept = admin.post(
        "/api/v1/departments",
        json={"code": "ECE", "name": "Electronics & Communication", "school_group": "non_soc"},
    ).json()
    dept_id = dept["id"]

    # Student cannot add requirement
    res_forbidden = alice.post(
        f"/api/v1/departments/{dept_id}/requirements",
        json={
            "skill_name": "Verilog",
            "category": "tools",
            "target_level": "intermediate",
            "weight": 2.0,
            "is_required": True,
        },
    )
    assert res_forbidden.status_code == 403

    # Admin adds requirement
    res_add = admin.post(
        f"/api/v1/departments/{dept_id}/requirements",
        json={
            "skill_name": "Verilog",
            "category": "tools",
            "target_level": "intermediate",
            "weight": 2.0,
            "is_required": True,
            "study_year": 2,
        },
    )
    assert res_add.status_code == 201
    req = res_add.json()
    assert req["skill_name"] == "Verilog"
    assert req["target_level"] == "intermediate"

    # List requirements
    res_reqs = alice.get(f"/api/v1/departments/{dept_id}/requirements")
    assert res_reqs.status_code == 200
    assert len(res_reqs.json()) == 1


def test_skill_gap_analysis_and_assessments(admin, alice):
    # 1. Check skill gap before department is assigned
    res_gap_empty = alice.get("/api/v1/students/me/skill-gaps")
    assert res_gap_empty.status_code == 200
    gap_data = res_gap_empty.json()
    assert gap_data["department_id"] is None
    assert len(gap_data["gaps"]) == 0

    # 2. Create department and requirement
    dept = admin.post(
        "/api/v1/departments",
        json={"code": "MECH", "name": "Mechanical Engineering", "school_group": "non_soc"},
    ).json()
    dept_id = dept["id"]

    admin.post(
        f"/api/v1/departments/{dept_id}/requirements",
        json={
            "skill_name": "AutoCAD",
            "category": "tools",
            "target_level": "advanced",
            "weight": 3.0,
            "is_required": True,
        },
    )

    # 3. Assign alice to this department
    admin.patch(
        f"/api/v1/admin/students/{alice.user['id']}",
        json={"department_id": dept_id},
    )

    # 4. Check skill gap report now
    res_gap = alice.get("/api/v1/students/me/skill-gaps")
    assert res_gap.status_code == 200
    rep = res_gap.json()
    assert rep["department_id"] == dept_id
    assert rep["department_name"] == "Mechanical Engineering"
    assert len(rep["gaps"]) == 1
    item = rep["gaps"][0]
    assert item["skill_name"] == "AutoCAD"
    assert item["target_level"] == "advanced"
    assert item["status"] == "not_assessed"

    # 5. Student submits self-reported skill (intermediate)
    alice.post(
        "/api/v1/skills",
        json={"name": "AutoCAD", "category": "tools", "level": "intermediate"},
    )

    res_gap_self = alice.get("/api/v1/students/me/skill-gaps")
    item_self = res_gap_self.json()["gaps"][0]
    assert item_self["achieved_level"] == "intermediate"
    assert item_self["evidence_type"] == "self_reported"
    assert item_self["status"] == "partial"
    assert item_self["gap_size"] == 1  # advanced (3) - intermediate (2)

    # 6. Student submits assessment with high score (90/100 -> expert >= 87.5%)
    res_assess = alice.post(
        "/api/v1/skill-assessments",
        json={
            "skill_name": "AutoCAD",
            "category": "tools",
            "score": 90,
            "max_score": 100,
            "feedback": "Outstanding performance in CAD assessment",
        },
    )
    assert res_assess.status_code == 201

    # Check assessments endpoint
    res_my_assess = alice.get("/api/v1/skill-assessments/me")
    assert res_my_assess.status_code == 200
    assert len(res_my_assess.json()["items"]) == 1

    # 7. Check gap report again — assessment evidence takes precedence over self-reported
    res_gap_assessed = alice.get("/api/v1/students/me/skill-gaps")
    item_assessed = res_gap_assessed.json()["gaps"][0]
    assert item_assessed["evidence_type"] == "assessed"
    assert item_assessed["achieved_level"] == "expert"
    assert item_assessed["status"] == "met"
    assert item_assessed["gap_size"] == 0
