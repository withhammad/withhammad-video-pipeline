"""Compatibility entry point: preserve the owner voice without extra speed-up."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("improve-voice.py")),run_name="__main__")
runpy.run_path(str(Path(__file__).with_name("clean-reference.py")),run_name="__main__")
runpy.run_path(str(Path(__file__).with_name("align-reference.py")),run_name="__main__")
