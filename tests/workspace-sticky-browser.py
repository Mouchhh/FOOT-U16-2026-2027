"""Compatibility entry point: the responsive dock replaces the former top menu."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('workspace-responsive-navigation-browser.py')), run_name='__main__')
