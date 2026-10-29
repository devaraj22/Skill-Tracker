def test_activity_heatmap_and_badges(alice):
    # 1. Fetch heatmap
    res = alice.get("/api/v1/gamification/heatmap")
    assert res.status_code == 200
    heatmap = res.json()
    assert "daily_counts" in heatmap
    assert "current_streak" in heatmap
    assert "longest_streak" in heatmap
    assert "total_activities" in heatmap

    # 2. Fetch badges
    res_b = alice.get("/api/v1/gamification/badges")
    assert res_b.status_code == 200
    badges_data = res_b.json()
    assert "unlocked_count" in badges_data
    assert "total_count" in badges_data
    assert badges_data["total_count"] == 10
    assert any(b["id"] == "first_step" for b in badges_data["badges"])

    # 3. Fetch gamification summary
    res_s = alice.get("/api/v1/gamification/summary")
    assert res_s.status_code == 200
    summary = res_s.json()
    assert "heatmap" in summary
    assert "badges" in summary


def test_roadmap_roles_and_plan(alice):
    # 1. List career roles
    res = alice.get("/api/v1/roadmap/roles")
    assert res.status_code == 200
    roles = res.json()
    assert len(roles) >= 4
    role_ids = [r["id"] for r in roles]
    assert "fullstack_web" in role_ids
    assert "data_science_ai" in role_ids

    # 2. Get roadmap plan for Full-Stack Web
    res_p = alice.get("/api/v1/roadmap/plan?role_id=fullstack_web")
    assert res_p.status_code == 200
    plan = res_p.json()
    assert plan["role_id"] == "fullstack_web"
    assert "match_percentage" in plan
    assert "readiness_level" in plan
    assert len(plan["milestones"]) > 0
    first_m = plan["milestones"][0]
    assert "resources" in first_m
    assert len(first_m["resources"]) > 0

    # 3. Enroll in a milestone as a Learning Goal
    enroll_res = alice.post(
        "/api/v1/roadmap/enroll",
        json={
            "role_id": "fullstack_web",
            "milestone_id": first_m["id"],
            "title": first_m["title"],
            "category": first_m["category"],
            "priority": "high",
        },
    )
    assert enroll_res.status_code == 200
    goal = enroll_res.json()
    assert goal["title"] == first_m["title"]

    # Re-checking the plan should show it enrolled
    res_p2 = alice.get("/api/v1/roadmap/plan?role_id=fullstack_web")
    assert res_p2.status_code == 200
    plan2 = res_p2.json()
    assert any(m["is_enrolled"] is True for m in plan2["milestones"])
