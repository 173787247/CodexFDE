"""Deterministic timing policy; actual subprocess shutdown has separate tests."""
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from eval.workbench_contracts import LocalDeliveryFixture


class ContractFixtureWaitTests(unittest.TestCase):
    def fixture(self, *, duration, progress_interval=None):
        clock = SimpleNamespace(now=0)
        work = {'revision': 1, 'active_task_id': 'fixture-task'}
        task = {'version': 1, 'events': []}
        class Worker:
            def is_alive(self):
                return clock.now < duration
            def join(self, timeout):
                before = clock.now
                clock.now += timeout
                if progress_interval and int(before / progress_interval) != int(clock.now / progress_interval):
                    # Appended Git/Eval milestones count even if task status and
                    # version stay unchanged during candidate preparation.
                    task['events'].append({'detail': 'persisted fixture progress'})
        fixture = LocalDeliveryFixture.__new__(LocalDeliveryFixture)
        fixture.service = SimpleNamespace(workers={'item': Worker()}, _load=lambda _: work)
        fixture.tasks = SimpleNamespace(get=lambda _: task)
        fixture.state = lambda _: {'stage': 'review'}
        return fixture, clock

    def test_persisted_progress_allows_multiple_bounded_phases(self):
        fixture, clock = self.fixture(duration=1, progress_interval=.25)
        with patch('eval.workbench_contracts.time.monotonic', side_effect=lambda: clock.now):
            result = fixture.wait({'id': 'item'}, idle_timeout=.5, total_timeout=2)
        self.assertEqual('review', result['stage'])
        self.assertGreaterEqual(clock.now, 1)

    def test_stalled_work_still_fails_at_idle_deadline(self):
        fixture, clock = self.fixture(duration=2)
        with patch('eval.workbench_contracts.time.monotonic', side_effect=lambda: clock.now):
            with self.assertRaisesRegex(AssertionError, 'bounded progress deadline'):
                fixture.wait({'id': 'item'}, idle_timeout=.5, total_timeout=2)
        self.assertEqual(.5, clock.now)

    def test_continuous_progress_cannot_extend_total_deadline(self):
        fixture, clock = self.fixture(duration=3, progress_interval=.25)
        with patch('eval.workbench_contracts.time.monotonic', side_effect=lambda: clock.now):
            with self.assertRaisesRegex(AssertionError, 'bounded progress deadline'):
                fixture.wait({'id': 'item'}, idle_timeout=.5, total_timeout=1)
        self.assertEqual(1, clock.now)


if __name__ == '__main__':
    unittest.main()
