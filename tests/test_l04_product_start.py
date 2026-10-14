"""The personal V0 can obtain an honest start without borrowing a finished executor."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from workbench.external_project import flowerp_root
from workbench.file_io import read_bytes

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'docs/courses/L04/scripts/prepare_product_start.py'
module_spec = importlib.util.spec_from_file_location('l04_start_tool', TOOL)
tool = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(tool)

class L04ProductStartTests(unittest.TestCase):
    def test_actual_csv_probe_is_red_and_original_product_is_unchanged(self):
        source = flowerp_root()
        original = read_bytes(source / 'flowerp/import_export.py')
        with tempfile.TemporaryDirectory() as directory:
            control = Path(directory)
            candidate = control / '.runtime/candidate'
            candidate.mkdir(parents=True)
            shutil.copytree(source / 'flowerp', candidate / 'flowerp', ignore=shutil.ignore_patterns('__pycache__'))
            result = tool.prepare(candidate, control, ROOT)
            self.assertTrue(result['student_start']['start_gap_applied'])
            output = control / '.runtime/probe'
            process = subprocess.run([sys.executable, '-B', '-X', 'utf8', str(ROOT / 'docs/courses/L04/scripts/check_inventory_delivery.py'), '--workspace', str(candidate), '--output', str(output), '--case', 'all', '--file-entry', 'flowerp.inventory_export:export_inventory_file'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', timeout=90)
            self.assertEqual(process.returncode, 1, process.stdout + process.stderr)
            self.assertTrue((output / 'report.json').is_file())
            self.assertNotIn('ModuleNotFoundError', process.stderr)
            self.assertEqual(original, read_bytes(source / 'flowerp/import_export.py'))
            before = read_bytes(candidate / 'flowerp/import_export.py')
            with self.assertRaises(FileExistsError):
                tool.prepare(candidate, control, ROOT)
            self.assertEqual(before, read_bytes(candidate / 'flowerp/import_export.py'))

    def test_outside_runtime_is_rejected_before_mutation(self):
        with tempfile.TemporaryDirectory() as directory:
            control = Path(directory)
            candidate = control / 'original-product'
            candidate.mkdir()
            with self.assertRaisesRegex(ValueError, '.runtime'):
                tool.prepare(candidate, control, ROOT)
            self.assertEqual([], list(candidate.iterdir()))
