"""Fault injection in isolated local projects; never model or customer evidence."""
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

from workbench.daily_delivery import manifest, prepare_daily
from workbench.delivery_runtime import DeliveryRuntime
from workbench.execution import CodexExecutionRunner
from workbench.initiative import InitiativeStore
from workbench.initiative_workflow import InitiativeWorkflow
from workbench.task_store import TaskStore


class InitiativeReliabilityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root, self.runtime = self.base / 'project', self.base / 'runtime'
        self.root.mkdir()
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.tasks = TaskStore(self.runtime / 'workbench.db')
        self.items = InitiativeStore(self.tasks.path)
        self.item = self.items.create({'title': 'local fixture', 'raw_signal': 'local fixture',
            'source': 'automated fixture', 'project_id': 'FIXTURE'}, 'owner')
        self.workflow = InitiativeWorkflow(self.root, self.runtime, self.items, self.tasks, enabled=True)
        self.addCleanup(self.workflow.learning_generation.close)

    def candidate(self):
        workspace = self.base / 'candidate'
        workspace.mkdir()
        subprocess.run(['git', 'init', '-q', str(workspace)], check=True)
        for name in ('a.txt', 'b.txt'):
            (self.root / name).write_bytes(b'original-' + name.encode())
            (workspace / name).write_bytes(b'candidate-' + name.encode())
        task = self.tasks.create('local fixture', actor='owner')
        for status in ('spec_ready', 'executing', 'evaluating'):
            self.tasks.transition(task['id'], status, 'fixture')
        self.tasks.transition(task['id'], 'review', 'fixture', result={
            'summary': {'decision': 'pass', 'total': 1, 'passed': 1, 'blocking_failed': 0},
            'results': [{'name': 'fixture', 'level': 'blocking', 'passed': True}]})
        data = self.workflow._load(self.item['id'])
        data.update(stage='review', active_task_id=task['id'], reviewer='reviewer', workspace=str(workspace),
                    candidate_manifest=manifest(workspace, self.runtime),
                    origin_manifest=manifest(self.root, self.runtime), iterations=[{'task_id': task['id']}])
        self.workflow._save(data)
        self.workflow._iteration_scope = lambda task: ['a.txt', 'b.txt']
        return workspace, task, data

    def receipt(self):
        return json.loads(next((self.runtime / 'initiative-integration').rglob('receipt.json')).read_text(encoding='utf-8'))

    def test_partial_write_never_truncates_source_and_rolls_back_prior_file(self):
        self.candidate()
        original_write = Path.write_bytes

        def disk_failure(path, content):
            if path.parent == self.root and path.name.startswith('b.txt'):
                original_write(path, content[:4])
                raise OSError('partial disk write fixture')
            return original_write(path, content)

        with patch.object(Path, 'write_bytes', disk_failure):
            with self.assertRaisesRegex(OSError, 'partial disk'):
                self.workflow._apply_integration(self.item['id'], 'reviewer')
        for name in ('a.txt', 'b.txt'):
            self.assertEqual(b'original-' + name.encode(), (self.root / name).read_bytes())
        self.assertEqual('rolled_back', self.receipt()['state'])
        self.assertEqual([], self.receipt()['conflicts'])
        self.assertEqual([], list(self.root.glob('*.tmp')))

    def test_failed_restore_is_reported_without_hiding_original_error(self):
        self.candidate()
        original_write = Path.write_bytes

        def disk_failure(path, content):
            if path.parent == self.root and path.name.startswith('b.txt'):
                raise OSError('candidate write failed')
            if path.parent == self.root and path.name.startswith('a.txt') and content.startswith(b'original'):
                raise OSError('restore write failed')
            return original_write(path, content)

        with patch.object(Path, 'write_bytes', disk_failure):
            with self.assertRaisesRegex(OSError, 'candidate write failed'):
                self.workflow._apply_integration(self.item['id'], 'reviewer')
        receipt = self.receipt()
        self.assertEqual('rollback_conflict', receipt['state'])
        self.assertIn('a.txt', receipt['conflicts'])
        self.assertIn('restore write failed', receipt['rollback_errors']['a.txt'])
        self.assertEqual(b'candidate-a.txt', (self.root / 'a.txt').read_bytes())
        self.assertEqual(b'original-b.txt', (self.root / 'b.txt').read_bytes())

    def test_acceptance_final_save_failure_rolls_back_review_and_can_retry(self):
        _, task, data = self.candidate()
        before = self.tasks.get(task['id'])
        with patch.object(self.workflow, '_save', side_effect=sqlite3.OperationalError('final save failed')):
            with self.assertRaises(sqlite3.OperationalError):
                self.workflow.accept(self.item['id'], 'reviewer', data['revision'], 'fixture acceptance')
        self.assertEqual(before, self.tasks.get(task['id']))
        self.assertEqual('review', self.workflow._load(self.item['id'])['stage'])
        self.workflow.accept(self.item['id'], 'reviewer', data['revision'], 'fixture acceptance')
        self.assertEqual('completed', self.tasks.get(task['id'])['status'])
        self.assertEqual('accepted', self.workflow._load(self.item['id'])['stage'])

    def test_learning_finish_failure_keeps_committed_task_and_initiative_consistent(self):
        _, task, data = self.candidate()
        with patch.object(self.workflow.learning, 'finish', side_effect=OSError('learning storage failed')):
            with self.assertRaisesRegex(OSError, 'learning storage failed'):
                self.workflow.accept(self.item['id'], 'reviewer', data['revision'], 'fixture acceptance')
        self.assertEqual('completed', self.tasks.get(task['id'])['status'])
        self.assertEqual('accepted', self.workflow._load(self.item['id'])['stage'])

    def test_wrong_reviewer_and_changed_candidate_still_block_acceptance(self):
        workspace, task, data = self.candidate()
        with self.assertRaisesRegex(ValueError, '验收负责人'):
            self.workflow.accept(self.item['id'], 'owner', data['revision'], 'fixture')
        (workspace / 'a.txt').write_text('external change')
        with self.assertRaisesRegex(ValueError, '候选源码'):
            self.workflow.accept(self.item['id'], 'reviewer', data['revision'], 'fixture')
        self.assertEqual('review', self.tasks.get(task['id'])['status'])

    def test_old_discussion_cancel_revision_cannot_stop_new_work(self):
        data = self.workflow._load(self.item['id'])
        data['stage'] = 'researching'
        self.workflow._save(data)
        event = self.workflow.cancel_events[self.item['id']] = threading.Event()
        with self.assertRaisesRegex(ValueError, '进展已变化'):
            self.workflow.cancel(self.item['id'], 'owner', 0)
        self.assertFalse(event.is_set())
        self.assertEqual('researching', self.workflow._load(self.item['id'])['stage'])

    def active_runtime(self):
        (self.root / 'value.txt').write_text('original')
        runtime = DeliveryRuntime(self.root, self.runtime, self.tasks, None, self.items, self.workflow)
        self.addCleanup(runtime.close)
        self.workflow.delivery_runtime = runtime
        plan = prepare_daily(self.root, self.runtime, 'owner', 'fixture execution', 'fixture check', ['workbench'])
        plan.update(plan_id='identity-fixture', expires_at=time.time() + 900)
        runtime.freeze_profile(self.item['id'], plan)
        data = self.workflow._load(self.item['id'])
        data.update(stage='executing', plan=plan)
        self.workflow._save(data)
        runtime._begin(self.item['id'], plan)
        return runtime, data, runtime._load(self.item['id'])

    def test_bound_cancel_survives_progress_without_stopping_another_run(self):
        runtime, work, run = self.active_runtime()
        current = self.workflow._load(self.item['id'])
        current['progress'] = ['background progress fixture']
        self.workflow._save(current)
        result = self.workflow.cancel(self.item['id'], 'owner', work['revision'],
            run_id=run['run_id'], session_id=run['session_id'], control_revision=run['control_revision'])
        self.assertEqual('cancelling', result['stage'])
        self.assertTrue(runtime.events[self.item['id']].is_set())
        self.assertTrue(self.workflow.cancel_events[self.item['id']].is_set())

    def test_wrong_or_incomplete_run_identity_cannot_cancel_current_execution(self):
        runtime, work, run = self.active_runtime()
        binding = {'run_id': run['run_id'], 'session_id': run['session_id'], 'control_revision': run['control_revision']}
        for replacement in ({'run_id': 'previous-run'}, {'session_id': None}, {'control_revision': -1}):
            with self.subTest(replacement=replacement), self.assertRaisesRegex(ValueError, '身份已变化'):
                self.workflow.cancel(self.item['id'], 'owner', work['revision'], **(binding | replacement))
            self.assertFalse(runtime.events[self.item['id']].is_set())
            self.assertEqual('executing', self.workflow._load(self.item['id'])['stage'])

    def test_workflow_cancel_ends_current_owned_runtime_process(self):
        (self.root / 'value.txt').write_text('original')
        runtime = DeliveryRuntime(self.root, self.runtime, self.tasks, None, self.items, self.workflow)
        self.addCleanup(runtime.close)
        self.workflow.delivery_runtime = runtime
        plan = prepare_daily(self.root, self.runtime, 'owner', 'fixture execution', 'fixture check', ['workbench'])
        plan.update(plan_id='cancel-fixture', expires_at=time.time() + 900)
        runtime.freeze_profile(self.item['id'], plan)
        data = self.workflow._load(self.item['id'])
        data.update(stage='executing', plan=plan)
        ready = threading.Event()
        process_codes = []
        marker = self.root / 'should-not-write'

        def local_process(*args, **kwargs):
            runner = CodexExecutionRunner(self.root, self.runtime)
            script = "import time;from pathlib import Path;print('ready',flush=True);time.sleep(20);Path(" + repr(str(marker)) + ").write_text('unexpected')"
            completed = runner._run_codex_streaming([sys.executable, '-u', '-c', script], '', 25,
                                                  lambda line: ready.set(), time.monotonic())
            process_codes.append(completed.returncode)
            raise RuntimeError('local process stopped')

        with patch('workbench.delivery_runtime.submit_daily', local_process):
            self.workflow._launch(data, lambda item: runtime.submit_daily(self.root, self.runtime, self.tasks, plan, lambda task: None))
            worker = self.workflow.workers[self.item['id']]
            try:
                self.assertTrue(ready.wait(10), 'owned local process did not become ready')
                current = self.workflow._load(self.item['id'])
                self.workflow.cancel(self.item['id'], 'owner', current['revision'])
                worker.join(5)
                self.assertFalse(worker.is_alive(), 'workflow cancellation did not stop owned process')
                self.assertEqual([130], process_codes)
                self.assertFalse(marker.exists())
                self.assertEqual('cancelled', runtime._load(self.item['id'])['state'])
                self.assertEqual('cancelled', self.workflow._load(self.item['id'])['stage'])
            finally:
                runtime.events[self.item['id']].set()
                self.workflow.cancel_events[self.item['id']].set()
                worker.join(5)
                self.assertFalse(worker.is_alive(), 'fixture cleanup failed')


if __name__ == '__main__':
    unittest.main()
