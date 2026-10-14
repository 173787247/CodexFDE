"""Resource acquisition must preserve personally built code and evidence."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from workbench.file_io import read_bytes, read_text

PATH=Path(__file__).resolve().parents[1]/'docs/courses/L00/tools/sync_learning_resources.py'
spec=importlib.util.spec_from_file_location('learning_resource_acquisition',PATH)
resource=importlib.util.module_from_spec(spec)
spec.loader.exec_module(resource)


class LearningResourceTests(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup)
        base=Path(tmp.name);self.source=base/'reference';self.target=base/'personal'
        self.source.mkdir();self.target.mkdir()
        (self.target/'lesson-01-submission').mkdir()
        (self.target/'lesson-01-submission/00-isolation.json').write_text(json.dumps({'source_root':str(self.source)}),'utf8')
        for number in range(1,17):
            directory=self.source/f'docs/courses/L{number:02d}'
            directory.mkdir(parents=True)
            (directory/'实践操作手册.md').write_text(f'L{number:02d} teaching resource','utf8')
        for root,text in [(self.source,'completed teacher implementation'),(self.target,'personally constructed implementation')]:
            (root/'workbench').mkdir();(root/'workbench/workflow.py').write_text(text,'utf8')
        (self.source/'docs/courses/L01/WORKBENCH_SPEC.md').write_text('teacher answer','utf8')
        own=self.target/'docs/courses/L01';own.mkdir(parents=True)
        (own/'WORKBENCH_SPEC.md').write_text('personal signed contract fixture','utf8')

    def test_resources_resume_without_importing_answers_or_overwriting_personal_work(self):
        first=resource.acquire(self.target,source=self.source)
        self.assertGreater(first['added'],16)
        self.assertFalse(first['personal_controller_constructed'])
        self.assertEqual('personally constructed implementation',read_text(self.target/'workbench/workflow.py'))
        self.assertEqual('personal signed contract fixture',read_text(self.target/'docs/courses/L01/WORKBENCH_SPEC.md'))
        self.assertEqual(16,len(json.loads(read_text(self.target/'.course/course-contracts.json'))['lessons']))
        self.assertEqual(0,resource.acquire(self.target,source=self.source)['added'])

    def test_conflict_is_detected_before_any_new_resources_are_written(self):
        personal=self.target/'docs/courses/L01/实践操作手册.md'
        personal.write_text('personal edits','utf8')
        with self.assertRaises(FileExistsError): resource.acquire(self.target,source=self.source)
        self.assertEqual('personal edits',read_text(personal))
        self.assertFalse((self.target/'docs/courses/L02').exists())
        self.assertFalse((self.target/'.course').exists())

    def test_other_reference_is_rejected_without_a_write(self):
        (self.target/'lesson-01-submission/00-isolation.json').write_text(json.dumps({'source_root':str(self.source/'other')}),'utf8')
        with self.assertRaisesRegex(ValueError,'不一致'): resource.acquire(self.target,source=self.source)
        self.assertFalse((self.target/'.course').exists())


if __name__=='__main__': unittest.main()
