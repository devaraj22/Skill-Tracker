"""Convenience wrapper to run create_admin from the student-skill-tracker root."""
from pathlib import Path
import runpy
import sys

_backend_script = Path(__file__).resolve().parents[1] / "backend" / "scripts" / "create_admin.py"
sys.path.insert(0, str(_backend_script.parents[1]))
runpy.run_path(str(_backend_script), run_name="__main__")
