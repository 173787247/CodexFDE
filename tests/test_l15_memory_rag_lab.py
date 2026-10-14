"""A requested counterexample must actually disable the active-memory filter."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'docs/courses/L15/examples/memory_rag_lab.py'

class MemoryRagLabTests(unittest.TestCase):
    def run_lab(self, *arguments):
        result = subprocess.run([sys.executable, '-B', '-X', 'utf8', str(SCRIPT), *arguments],
                                cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        return result, json.loads(result.stdout)

    def test_normal_evaluation_passes_but_revoked_counterexample_fails(self):
        normal, clean = self.run_lab('--evaluate')
        exposed, leaked = self.run_lab('--evaluate', '--include-revoked')
        self.assertEqual(normal.returncode, 0, normal.stderr)
        self.assertEqual(clean['decision'], 'pass')
        self.assertEqual(exposed.returncode, 1, exposed.stderr)
        self.assertEqual(leaked['decision'], 'fail')
        self.assertTrue(any('MEM-EXPORT-OLD' in row['invalid_leakage'] for row in leaked['cases']))

    def test_query_context_discloses_revoked_status_and_actual_filter(self):
        result, context = self.run_lab('--query', '空库存导出报错', '--include-revoked')
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertEqual(context['filters']['status'], 'all')
        self.assertTrue(any(row['status'] == 'revoked' for row in context['retrieved']))
