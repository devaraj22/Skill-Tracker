from datetime import date, timedelta
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import LearningGoal, Skill
from app.models.enums import GoalStatus, SkillCategory, SkillLevel
from app.schemas.roadmap import (
    EnrollRoadmapGoalIn, RoadmapMilestone, RoadmapPlanOut, RoadmapResource, RoleOverview,
)
from app.services.activity import log_activity

_LEVEL_ORDER = {
    SkillLevel.beginner: 1,
    SkillLevel.intermediate: 2,
    SkillLevel.advanced: 3,
    SkillLevel.expert: 4,
}

CAREER_ROLES = [
    {
        "id": "fullstack_web",
        "title": "Full-Stack Web Developer",
        "description": "Architect modern frontend interfaces, resilient backend APIs, relational databases, and automated deployments.",
        "icon": "Layout",
        "estimated_duration": "4–6 Months",
        "milestones": [
            {
                "id": "fsw_html_css",
                "title": "HTML5, Semantic UI & Responsive CSS",
                "category": SkillCategory.web,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Master semantic HTML, CSS Grid/Flexbox, responsive media queries, accessibility (ARIA), and CSS variables.",
                "keywords": ["html", "css", "web", "tailwind"],
                "resources": [
                    RoadmapResource(title="MDN Web Docs: Learn Web Development", url="https://developer.mozilla.org/en-US/docs/Learn", type="docs"),
                    RoadmapResource(title="freeCodeCamp: Responsive Web Design", url="https://www.freecodecamp.org/learn/2022/responsive-web-design/", type="course"),
                ],
            },
            {
                "id": "fsw_js_ts",
                "title": "Modern JavaScript & TypeScript",
                "category": SkillCategory.programming,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "ES6+ syntax, asynchronous programming, promises/async-await, typing, interfaces, and DOM manipulation.",
                "keywords": ["javascript", "typescript", "js", "ts"],
                "resources": [
                    RoadmapResource(title="JavaScript.info: The Modern Tutorial", url="https://javascript.info/", type="guide"),
                    RoadmapResource(title="Official TypeScript Handbook", url="https://www.typescriptlang.org/docs/handbook/intro.html", type="docs"),
                ],
            },
            {
                "id": "fsw_react",
                "title": "React & Component Architecture",
                "category": SkillCategory.web,
                "target_level": SkillLevel.advanced,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "Functional components, custom hooks, TanStack Query, routing, state management, and memoization.",
                "keywords": ["react", "frontend", "nextjs", "vue"],
                "resources": [
                    RoadmapResource(title="React Official Documentation", url="https://react.dev/learn", type="docs"),
                    RoadmapResource(title="Full Stack Open (University of Helsinki)", url="https://fullstackopen.com/en/", type="course"),
                ],
            },
            {
                "id": "fsw_backend_api",
                "title": "REST APIs & Backend Architecture (Python / Node)",
                "category": SkillCategory.programming,
                "target_level": SkillLevel.advanced,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "FastAPI / Express framework, routing, request validation, authentication tokens, and middleware design.",
                "keywords": ["python", "fastapi", "node", "express", "backend"],
                "resources": [
                    RoadmapResource(title="FastAPI Official Tutorial", url="https://fastapi.tiangolo.com/tutorial/", type="docs"),
                    RoadmapResource(title="Roadmap.sh Backend Developer", url="https://roadmap.sh/backend", type="roadmap"),
                ],
            },
            {
                "id": "fsw_databases",
                "title": "Relational Databases & SQL Schema Design",
                "category": SkillCategory.databases,
                "target_level": SkillLevel.intermediate,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "PostgreSQL / SQLite schemas, normalization, indexes, foreign keys, and SQLAlchemy / ORM migrations.",
                "keywords": ["sql", "postgresql", "sqlite", "database", "mysql"],
                "resources": [
                    RoadmapResource(title="PostgreSQL Official Tutorial", url="https://www.postgresqltutorial.com/", type="tutorial"),
                    RoadmapResource(title="Use The Index, Luke (SQL Indexing)", url="https://use-the-index-luke.com/", type="guide"),
                ],
            },
            {
                "id": "fsw_devops",
                "title": "Docker, CI/CD & Cloud Deployment",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.intermediate,
                "phase": 3,
                "phase_name": "Phase 3: Production & Performance",
                "description": "Containerizing web services with Docker, GitHub Actions test automation, and production reverse proxying.",
                "keywords": ["docker", "git", "ci/cd", "devops", "linux"],
                "resources": [
                    RoadmapResource(title="Docker for Beginners Curriculum", url="https://docker-curriculum.com/", type="tutorial"),
                    RoadmapResource(title="Roadmap.sh Full Stack Guide", url="https://roadmap.sh/full-stack", type="roadmap"),
                ],
            },
        ],
    },
    {
        "id": "data_science_ai",
        "title": "Data Scientist & AI / ML Engineer",
        "description": "Extract predictive insights, engineer statistical features, and train production-ready machine learning models.",
        "icon": "Brain",
        "estimated_duration": "5–7 Months",
        "milestones": [
            {
                "id": "ds_python_data",
                "title": "Data Wrangling & Analysis with NumPy & Pandas",
                "category": SkillCategory.programming,
                "target_level": SkillLevel.advanced,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Vectorized computations, DataFrame indexing, handling missing data, grouping, and statistical aggregations.",
                "keywords": ["python", "pandas", "numpy", "data analysis"],
                "resources": [
                    RoadmapResource(title="Pandas Official Getting Started", url="https://pandas.pydata.org/docs/getting_started/index.html", type="docs"),
                    RoadmapResource(title="Kaggle Pandas & Python Micro-Courses", url="https://www.kaggle.com/learn", type="course"),
                ],
            },
            {
                "id": "ds_math_stats",
                "title": "Probability, Linear Algebra & Applied Statistics",
                "category": SkillCategory.dsa,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Probability distributions, hypothesis testing, matrix operations, eigenvalues, and gradient descent intuition.",
                "keywords": ["math", "statistics", "linear algebra", "probability"],
                "resources": [
                    RoadmapResource(title="3Blue1Brown: Essence of Linear Algebra", url="https://www.3blue1brown.com/topics/linear-algebra", type="tutorial"),
                    RoadmapResource(title="Khan Academy: Probability and Statistics", url="https://www.khanacademy.org/math/statistics-probability", type="course"),
                ],
            },
            {
                "id": "ds_classical_ml",
                "title": "Supervised & Unsupervised Machine Learning",
                "category": SkillCategory.programming,
                "target_level": SkillLevel.intermediate,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "Regression, decision trees, random forests, clustering, cross-validation, and Scikit-Learn pipelines.",
                "keywords": ["machine learning", "ml", "scikit-learn", "ai"],
                "resources": [
                    RoadmapResource(title="Scikit-Learn User Guide & Tutorials", url="https://scikit-learn.org/stable/user_guide.html", type="docs"),
                    RoadmapResource(title="Google Machine Learning Crash Course", url="https://developers.google.com/machine-learning/crash-course", type="course"),
                ],
            },
            {
                "id": "ds_deep_learning",
                "title": "Deep Learning & Neural Networks (PyTorch / TF)",
                "category": SkillCategory.programming,
                "target_level": SkillLevel.advanced,
                "phase": 3,
                "phase_name": "Phase 3: Production & Performance",
                "description": "Tensors, backpropagation, CNNs for computer vision, Transformers for NLP, and fine-tuning models.",
                "keywords": ["pytorch", "deep learning", "tensorflow", "neural networks"],
                "resources": [
                    RoadmapResource(title="PyTorch Official Beginner Tutorials", url="https://pytorch.org/tutorials/beginner/basics/intro.html", type="docs"),
                    RoadmapResource(title="Fast.ai Practical Deep Learning for Coders", url="https://course.fast.ai/", type="course"),
                ],
            },
            {
                "id": "ds_deployment",
                "title": "Model Serving & MLOps Pipelines",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.intermediate,
                "phase": 3,
                "phase_name": "Phase 3: Production & Performance",
                "description": "Exposing models via FastAPI endpoints, containerization, HuggingFace model hubs, and inference latency tuning.",
                "keywords": ["mlops", "fastapi", "docker", "huggingface"],
                "resources": [
                    RoadmapResource(title="Made With ML (Complete MLOps Guide)", url="https://madewithml.com/", type="guide"),
                    RoadmapResource(title="Roadmap.sh AI and Data Scientist", url="https://roadmap.sh/ai-data-scientist", type="roadmap"),
                ],
            },
        ],
    },
    {
        "id": "cloud_devops",
        "title": "Cloud & DevOps Engineer",
        "description": "Automate system operations, configure robust cloud infrastructure, and maintain continuous delivery pipelines.",
        "icon": "Cloud",
        "estimated_duration": "4–6 Months",
        "milestones": [
            {
                "id": "cdo_linux_shell",
                "title": "Linux Administration & Bash Scripting",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Process management, file permissions, cron jobs, network utilities (curl, dig), and bash automation.",
                "keywords": ["linux", "bash", "shell", "unix"],
                "resources": [
                    RoadmapResource(title="Linux Journey: Learn Linux Step-by-Step", url="https://linuxjourney.com/", type="guide"),
                    RoadmapResource(title="OverTheWire: Bandit Wargame (Hands-on)", url="https://overthewire.org/wargames/bandit/", type="practice"),
                ],
            },
            {
                "id": "cdo_docker",
                "title": "Containerization with Docker & Compose",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.advanced,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "Writing clean Dockerfiles, multi-stage builds, volume mounts, bridge networking, and compose setups.",
                "keywords": ["docker", "container", "docker compose"],
                "resources": [
                    RoadmapResource(title="Docker Docs: Get Started", url="https://docs.docker.com/get-started/", type="docs"),
                    RoadmapResource(title="Play with Docker (Free Sandbox)", url="https://labs.play-with-docker.com/", type="practice"),
                ],
            },
            {
                "id": "cdo_cicd",
                "title": "CI/CD Automation with GitHub Actions",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.intermediate,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "Automated linting, test suites, building container artifacts, and release pipelines on Git events.",
                "keywords": ["github actions", "ci/cd", "git"],
                "resources": [
                    RoadmapResource(title="GitHub Actions Quickstart & Docs", url="https://docs.github.com/en/actions/quickstart", type="docs"),
                ],
            },
            {
                "id": "cdo_kubernetes",
                "title": "Kubernetes Orchestration & Helm",
                "category": SkillCategory.tools,
                "target_level": SkillLevel.intermediate,
                "phase": 3,
                "phase_name": "Phase 3: Production & Performance",
                "description": "Deployments, Services, ConfigMaps, Ingress, PersistentVolumes, and basic Helm charts.",
                "keywords": ["kubernetes", "k8s", "helm"],
                "resources": [
                    RoadmapResource(title="Kubernetes Basics (Official Interactive Tutorial)", url="https://kubernetes.io/docs/tutorials/kubernetes-basics/", type="tutorial"),
                    RoadmapResource(title="Roadmap.sh DevOps Guide", url="https://roadmap.sh/devops", type="roadmap"),
                ],
            },
        ],
    },
    {
        "id": "dsa_placement",
        "title": "DSA & Core Placement Mastery",
        "description": "Crack technical coding rounds and problem solving for Tier-1 software engineering roles.",
        "icon": "Binary",
        "estimated_duration": "3–5 Months",
        "milestones": [
            {
                "id": "dsa_arrays_strings",
                "title": "Arrays, Two Pointers & Sliding Window",
                "category": SkillCategory.dsa,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Time/space complexity analysis, prefix sums, binary search variants, two pointers, and sliding window patterns.",
                "keywords": ["dsa", "arrays", "strings", "algorithms"],
                "resources": [
                    RoadmapResource(title="NeetCode 150 Core Practice Roadmap", url="https://neetcode.io/roadmap", type="roadmap"),
                    RoadmapResource(title="LeetCode Problem Set (Top Interview 150)", url="https://leetcode.com/problemset/all/", type="practice"),
                ],
            },
            {
                "id": "dsa_linked_lists_stacks",
                "title": "Linked Lists, Stacks, Queues & HashMaps",
                "category": SkillCategory.dsa,
                "target_level": SkillLevel.intermediate,
                "phase": 1,
                "phase_name": "Phase 1: Foundations",
                "description": "Pointer manipulation, monotonic stacks, collision resolution, LRU Cache implementation.",
                "keywords": ["dsa", "stack", "queue", "hashmap", "data structures"],
                "resources": [
                    RoadmapResource(title="GeeksforGeeks DSA Self-Paced Guides", url="https://www.geeksforgeeks.org/data-structures/", type="guide"),
                ],
            },
            {
                "id": "dsa_trees_graphs",
                "title": "Trees, BSTs & Graph Algorithms (BFS/DFS/Dijkstra)",
                "category": SkillCategory.dsa,
                "target_level": SkillLevel.advanced,
                "phase": 2,
                "phase_name": "Phase 2: Core Engineering",
                "description": "Tree traversals, lowest common ancestor, graph representations, topological sort, and shortest path algorithms.",
                "keywords": ["trees", "graphs", "bfs", "dfs", "dsa"],
                "resources": [
                    RoadmapResource(title="William Fiset: Graph Theory Playlist", url="https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P", type="tutorial"),
                    RoadmapResource(title="CSES Problem Set (Graph Algorithms)", url="https://cses.fi/problemset/", type="practice"),
                ],
            },
            {
                "id": "dsa_dp_greedy",
                "title": "Dynamic Programming & Greedy Techniques",
                "category": SkillCategory.dsa,
                "target_level": SkillLevel.advanced,
                "phase": 3,
                "phase_name": "Phase 3: Production & Performance",
                "description": "Overlapping subproblems, state definitions, memoization vs tabulation, knapsack, and grid paths.",
                "keywords": ["dynamic programming", "dp", "greedy", "dsa"],
                "resources": [
                    RoadmapResource(title="MIT OpenCourseWare: Introduction to Algorithms", url="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", type="course"),
                    RoadmapResource(title="Errichto: Dynamic Programming for Beginners", url="https://www.youtube.com/watch?v=FAQxdm0bTaw", type="tutorial"),
                ],
            },
        ],
    },
]


def list_career_roles() -> list[RoleOverview]:
    return [
        RoleOverview(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            icon=r["icon"],
            estimated_duration=r["estimated_duration"],
            milestones_count=len(r["milestones"]),
        )
        for r in CAREER_ROLES
    ]


def generate_roadmap_plan(db: Session, user_id: uuid.UUID, role_id: str) -> RoadmapPlanOut:
    role = next((r for r in CAREER_ROLES if r["id"] == role_id), None)
    if role is None:
        role = CAREER_ROLES[0]

    student_skills = db.scalars(select(Skill).where(Skill.user_id == user_id)).all()
    active_goals = db.scalars(select(LearningGoal).where(LearningGoal.user_id == user_id)).all()

    # Map student skills by lowercase name for quick fuzzy matching
    skill_map = {s.name.lower().strip(): s for s in student_skills}
    goal_titles = {g.title.lower().strip(): g for g in active_goals}

    milestones_out: list[RoadmapMilestone] = []
    mastered_count = 0
    in_progress_count = 0
    gap_count = 0

    for m in role["milestones"]:
        target_score = _LEVEL_ORDER[m["target_level"]]
        matched_skill: Skill | None = None

        # Look for matching student skill by keyword or category
        for kw in m["keywords"]:
            for s_name, skill_obj in skill_map.items():
                if kw in s_name or s_name in kw:
                    matched_skill = skill_obj
                    break
            if matched_skill:
                break

        # Check if student already enrolled a goal with matching title
        matching_goal = None
        for g_title, g_obj in goal_titles.items():
            if m["title"].lower() in g_title or g_title in m["title"].lower():
                matching_goal = g_obj
                break

        current_level = matched_skill.level if matched_skill else None
        current_score = _LEVEL_ORDER[current_level] if current_level else 0

        if current_score >= target_score:
            status = "mastered"
            mastered_count += 1
        elif current_score > 0 or matching_goal is not None:
            status = "in_progress"
            in_progress_count += 1
        else:
            status = "gap"
            gap_count += 1

        milestones_out.append(
            RoadmapMilestone(
                id=m["id"],
                title=m["title"],
                category=m["category"],
                target_level=m["target_level"],
                phase=m["phase"],
                phase_name=m["phase_name"],
                description=m["description"],
                status=status,
                current_level=current_level,
                resources=m["resources"],
                is_enrolled=matching_goal is not None,
                enrolled_goal_id=str(matching_goal.id) if matching_goal else None,
            )
        )

    total_m = len(milestones_out)
    if total_m > 0:
        match_percentage = int(((mastered_count * 1.0 + in_progress_count * 0.5) / total_m) * 100)
    else:
        match_percentage = 0

    if match_percentage >= 75:
        readiness_level = "Industry Ready"
    elif match_percentage >= 40:
        readiness_level = "Developing"
    else:
        readiness_level = "Beginner"

    return RoadmapPlanOut(
        role_id=role["id"],
        role_title=role["title"],
        role_description=role["description"],
        icon=role["icon"],
        match_percentage=match_percentage,
        readiness_level=readiness_level,
        mastered_count=mastered_count,
        in_progress_count=in_progress_count,
        gap_count=gap_count,
        milestones=milestones_out,
    )


def enroll_roadmap_milestone_as_goal(
    db: Session, user_id: uuid.UUID, payload: EnrollRoadmapGoalIn
) -> LearningGoal:
    # Check if a goal with this title already exists
    existing = db.scalar(
        select(LearningGoal).where(
            LearningGoal.user_id == user_id,
            LearningGoal.title == payload.title,
        )
    )
    if existing:
        return existing

    target_date = payload.target_date or (date.today() + timedelta(days=45))

    new_goal = LearningGoal(
        user_id=user_id,
        title=payload.title,
        category=payload.category,
        priority=payload.priority,
        target_date=target_date,
        progress=0,
        status=GoalStatus.not_started,
    )
    db.add(new_goal)
    db.flush()

    log_activity(
        db,
        actor_id=user_id,
        subject_user_id=user_id,
        action="goal.created",
        entity_type="goal",
        entity_id=new_goal.id,
        summary=f"Enrolled from Roadmap: {payload.title}",
    )
    db.commit()
    db.refresh(new_goal)
    return new_goal
