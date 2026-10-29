import os
import sys
import time
import threading
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
SCREENSHOTS_DIR = Path(__file__).resolve().parent.parent / "docs" / "screenshots"

sys.path.insert(0, str(BACKEND_DIR))
os.chdir(str(BACKEND_DIR))

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.main import app

if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = FRONTEND_DIST / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))
    return FileResponse(str(FRONTEND_DIST / "index.html"))

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def run_playwright():
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    from playwright.sync_api import sync_playwright

    print("Launching Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        base_url = "http://127.0.0.1:8000"

        # 1. Landing Page
        print("Capturing 01-landing-page.png...")
        page.goto(f"{base_url}/", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "01-landing-page.png"))

        # 2. Login Page
        print("Capturing 02-login-page.png...")
        page.goto(f"{base_url}/login", wait_until="networkidle")
        page.wait_for_timeout(500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "02-login-page.png"))

        # 3. Log in as Student
        print("Logging in as demo student...")
        page.fill('input[type="email"]', "demo.student1@example.com")
        page.fill('input[type="password"]', "DevPassword123")
        page.click('button[type="submit"]')
        page.wait_for_timeout(2500)

        # 4. Student Dashboard
        print("Capturing 03-student-dashboard.png...")
        page.goto(f"{base_url}/dashboard", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "03-student-dashboard.png"))

        # 5. Skills Management
        print("Capturing 04-skills-management.png...")
        page.goto(f"{base_url}/skills", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "04-skills-management.png"))

        # 6. Skill Gap Analysis
        print("Capturing 05-skill-gap-analysis.png...")
        page.goto(f"{base_url}/skill-gap", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "05-skill-gap-analysis.png"))

        # 7. Learning Roadmap
        print("Capturing 06-learning-roadmap.png...")
        page.goto(f"{base_url}/roadmap", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "06-learning-roadmap.png"))

        # 8. Certifications
        print("Capturing 07-certifications.png...")
        page.goto(f"{base_url}/certifications", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "07-certifications.png"))

        # 9. Projects Showcase
        print("Capturing 08-projects-showcase.png...")
        page.goto(f"{base_url}/projects", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "08-projects-showcase.png"))

        # 10. Achievements
        print("Capturing 09-achievements-badges.png...")
        page.goto(f"{base_url}/achievements", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "09-achievements-badges.png"))

        # 11. Learning Goals
        print("Capturing 10-learning-goals.png...")
        page.goto(f"{base_url}/goals", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "10-learning-goals.png"))

        # 12. Placement Readiness
        print("Capturing 11-placement-readiness.png...")
        page.goto(f"{base_url}/placement", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "11-placement-readiness.png"))

        # 13. Public Portfolio
        print("Capturing 12-public-portfolio.png...")
        page.goto(f"{base_url}/portfolio/demo-student-one", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "12-public-portfolio.png"))

        # 14. Log out & log in as Admin
        print("Logging out student...")
        context.clear_cookies()
        page.goto(f"{base_url}/login", wait_until="networkidle")
        page.wait_for_timeout(1000)
        print("Logging in as Admin...")
        page.fill('input[type="email"]', "admin@college.edu")
        page.fill('input[type="password"]', "Admin123456")
        page.click('button[type="submit"]')
        page.wait_for_timeout(2500)

        # 15. Admin Overview
        print("Capturing 13-admin-overview.png...")
        page.goto(f"{base_url}/admin", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=str(SCREENSHOTS_DIR / "13-admin-overview.png"))

        # 16. Admin Certifications Review
        print("Capturing 14-admin-certifications.png...")
        page.goto(f"{base_url}/admin/certifications", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "14-admin-certifications.png"))

        # 17. Admin Students Management
        print("Capturing 15-admin-students.png...")
        page.goto(f"{base_url}/admin/students", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "15-admin-students.png"))

        # 18. Admin Departments
        print("Capturing 16-admin-departments.png...")
        page.goto(f"{base_url}/admin/departments", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "16-admin-departments.png"))

        # 19. Admin Activity Logs
        print("Capturing 17-admin-activity-logs.png...")
        page.goto(f"{base_url}/admin/activity", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SCREENSHOTS_DIR / "17-admin-activity-logs.png"))

        browser.close()
        print("All screenshots captured successfully!")

if __name__ == "__main__":
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    time.sleep(2)
    run_playwright()
    print("Done!")
    sys.exit(0)
