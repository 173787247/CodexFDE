"""Acquire teaching resources without importing the completed controller.

Run from the recorded reference checkout. Existing personal files are never
overwritten; unchanged copies are safe to resume. This is resource preparation,
not construction, execution, acceptance or validation of the personal Workbench.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import stat
import sys

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT))
from workbench.file_io import read_bytes, read_text
from workbench.course_mainline import LESSONS, render_lesson_spec

RECEIPT = '.course/learning-resources.json'
SUFFIXES = {'.md', '.py', '.ps1', '.zsh', '.json', '.txt', '.csv', '.drawio', '.svg', '.png', '.jpg', '.jpeg'}
SKIP = {'__pycache__', '.runtime', '.venv', 'archive'}
PERSONAL_FILES = {'docs/courses/L01/WORKBENCH_SPEC.md'}


def checked(path):
    for node in (path, *path.parents):
        if not node.exists():
            continue
        flags = node.lstat()
        if stat.S_ISLNK(flags.st_mode) or getattr(flags, 'st_file_attributes', 0) & 1024:
            raise ValueError('拒绝链接或重解析路径：' + str(node))


def acquire(target, *, source=ROOT):
    target, source = Path(target).absolute(), Path(source).resolve()
    checked(target)
    target = target.resolve(strict=True)
    if target == source or target.is_relative_to(source) or source.is_relative_to(target):
        raise ValueError('资源目标必须是参考仓库之外的个人项目')
    origin = json.loads(read_text(target/'lesson-01-submission/00-isolation.json'))
    if Path(origin['source_root']).resolve() != source:
        raise ValueError('参考来源与 L01 隔离记录不一致')
    plan, origins = {}, {}
    for lesson in range(1, 17):
        folder = source/f'docs/courses/L{lesson:02d}'
        if not (folder/'实践操作手册.md').is_file():
            raise ValueError(f'L{lesson:02d} 实践手册缺失，停止同步')
        for path in sorted(folder.rglob('*')):
            if path.is_file() and not (set(path.relative_to(folder).parts) & SKIP) and path.suffix.lower() in SUFFIXES:
                checked(path)
                name = path.relative_to(source).as_posix()
                if name in PERSONAL_FILES:
                    continue
                plan[name] = read_bytes(path)
                origins[name] = str(path)
    contracts = {'schema_version': '1.0', 'source_root': str(source),
                 'purpose': '课程合同数据；不是个人工作台实现或学习达成证据',
                 'lessons': [dict(item.as_dict(), spec_template=render_lesson_spec(item.number)) for item in LESSONS]}
    plan['.course/course-contracts.json'] = json.dumps(contracts, ensure_ascii=False, indent=2).encode('utf8')
    origins['.course/course-contracts.json'] = str(source/'workbench/course_mainline.py')
    files = {name: {'source': origins[name], 'sha256': hashlib.sha256(raw).hexdigest()} for name,raw in plan.items()}
    payload = {'schema_version': '1.0', 'source_root': str(source), 'target': str(target),
               'boundary': '只同步课程资料和合同数据；不复制 workbench/agent/eval/tests/产品实现；不改学生提交',
               'files': files}
    receipt_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode('utf8')
    plan[RECEIPT] = receipt_bytes
    # Preflight the entire write set before the first mutation.
    additions = []
    for name,raw in plan.items():
        destination = target/name
        checked(destination)
        if not destination.resolve().is_relative_to(target):
            raise ValueError('目标越界：'+name)
        if destination.exists():
            if not destination.is_file() or read_bytes(destination) != raw:
                raise FileExistsError('保留个人已有内容；先比较并确认资源版本：'+name)
        else:
            additions.append(name)
    for name in additions:
        path=target/name
        path.parent.mkdir(parents=True,exist_ok=True)
        with path.open('xb') as stream:
            stream.write(plan[name])
    return {'target': str(target), 'source_root': str(source), 'files': len(files),
            'added': len(additions), 'receipt': str(target/RECEIPT),
            'personal_controller_constructed': False}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', type=Path, required=True)
    args=parser.parse_args()
    if not args.target.is_absolute():
        parser.error('--target 必须是个人项目绝对路径')
    try:
        print(json.dumps(acquire(args.target), ensure_ascii=False, indent=2))
        return 0
    except (OSError, ValueError, KeyError) as error:
        print(f'{type(error).__name__}: {error}',file=sys.stderr)
        return 1


if __name__=='__main__':
    raise SystemExit(main())
