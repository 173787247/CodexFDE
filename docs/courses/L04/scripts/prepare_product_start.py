"""Prepare an explicitly labelled L04 teaching gap in an existing candidate only."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


def prepare(workspace, control_root, reference_root):
    workspace, control, reference = (Path(value).resolve() for value in (workspace, control_root, reference_root))
    if not workspace.is_dir() or not workspace.is_relative_to(control / '.runtime'):
        raise ValueError('只能准备个人工作台 .runtime 内已有的隔离候选')
    product = os.environ.get('FLOWERP_PROJECT_ROOT')
    if workspace == reference or (product and workspace.is_relative_to(Path(product).resolve())):
        raise ValueError('不能剥离参考仓库或客户原源码')
    source = reference / 'workbench/lesson_constructibility.py'
    if not source.is_file() or source.is_symlink():
        raise ValueError('参考起点准备器缺失或为链接，先核对来源')
    for relative in ('flowerp/service.py', 'flowerp/import_export.py'):
        target = workspace / relative
        if not target.is_file() or target.is_symlink() or not target.resolve().is_relative_to(workspace):
            raise ValueError('候选业务源码缺失或为链接：' + relative)
    marker = workspace / '.course/l04-preparation.json'
    if marker.exists():
        raise FileExistsError('起点已经准备；续做应核对原记录，不能重新制造缺口')
    module_name = '_l04_course_start_preparer'
    spec = importlib.util.spec_from_file_location(module_name, source)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    try:
        spec.loader.exec_module(module)
        result = module.apply_student_start(workspace, 4)
    finally:
        sys.modules.pop(module_name, None)
    if not result['start_gap_applied']:
        raise ValueError('L04 起点适配失败，保留候选与原诊断，不启动执行：' + json.dumps(result, ensure_ascii=False))
    payload = {'schema': 'course.l04-product-start/v1', 'workspace': str(workspace),
               'reference_root': str(reference), 'preparer_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
               'student_start': result, 'boundary': '教师提供的隔离教学起点；不是学生修复、生产事故或人审接受'}
    marker.parent.mkdir(parents=True, exist_ok=True)
    with marker.open('x', encoding='utf-8') as stream:
        json.dump(payload, stream, ensure_ascii=False, indent=2)
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('workspace', 'control-root', 'reference-root'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    try:
        result = prepare(args.workspace, args.control_root, args.reference_root)
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
