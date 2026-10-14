"""Reference adapter protocol tests; simulated results do not prove host events."""
import contextlib
import io
import json
from pathlib import Path
import runpy
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
class ReferenceHookTests(unittest.TestCase):
    def invoke(self, active=False):
        namespace = runpy.run_path(str(ROOT / '.codex/hooks/quality_gate.py'))
        out = io.StringIO()
        event = dict(hook_event_name='Stop', cwd=str(ROOT), stop_hook_active=active)
        with patch('sys.stdin', io.StringIO(json.dumps(event))), patch('subprocess.run', return_value=subprocess.CompletedProcess([],0,'pass','')) as runner, contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(namespace['main'](), 0)
        return json.loads(out.getvalue()), runner

    def test_slow_complete_gate_has_time_to_finish_and_return_protocol(self):
        response, runner = self.invoke()
        config = json.loads((ROOT / '.codex/hooks.json').read_text(encoding='utf-8'))
        deadline = config['hooks']['Stop'][0]['hooks'][0]['timeout']
        self.assertEqual(runner.call_args.kwargs['timeout'], 900)
        self.assertGreater(deadline, 900)
        self.assertTrue(response['continue'])

    def test_string_false_cannot_be_misread_as_reentry(self):
        response, runner = self.invoke('false')
        self.assertEqual(response['decision'], 'block')
        runner.assert_not_called()

    def test_real_reentry_explicitly_says_it_did_not_recheck(self):
        response, runner = self.invoke(True)
        self.assertTrue(response['continue'])
        self.assertIn('未复验', response['systemMessage'])
        runner.assert_not_called()
