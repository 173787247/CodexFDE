"""Create an explicit ledger-defect teaching copy. Never overwrite a directory."""
import argparse
import hashlib
import json
import os
from pathlib import Path
def copy_product_source(destination, source_root=None):
    """Teaching preparation must also run before personal helper modules exist."""
    value=source_root or os.environ.get('FLOWERP_PROJECT_ROOT')
    if not value:
        raise ValueError('先设置 FLOWERP_PROJECT_ROOT 为本人的独立客户仓库')
    source=Path(value).absolute()
    destination=Path(destination).resolve()
    for node in (source,*source.parents):
        if node.exists() and (node.is_symlink() or getattr(node.lstat(),'st_file_attributes',0)&1024):
            raise ValueError('客户来源不能包含链接或重解析路径')
    source=source.resolve(strict=True)
    package=source/'flowerp'
    if not package.is_dir() or destination==source or destination==package or source.is_relative_to(destination):
        raise ValueError('独立客户来源或隔离目标不正确')
    files={}
    for path in sorted(package.rglob('*')):
        relative=path.relative_to(source)
        if set(relative.parts)&{'__pycache__','.venv','.runtime','.git','node_modules'}:
            continue
        if path.is_symlink() or getattr(path.lstat(),'st_file_attributes',0)&1024:
            raise ValueError('客户源码不能包含链接或重解析路径')
        if not path.is_file() or path.suffix.lower() not in {'.py','.sql','.json','.toml','.md','.txt'}:
            continue
        if path.name.lower().startswith(('.env','auth.','credentials.','secrets.')):
            continue
        raw=path.read_bytes()
        target=destination/relative
        target.parent.mkdir(parents=True,exist_ok=True)
        with target.open('xb') as stream:stream.write(raw)
        files[relative.as_posix()]={'source':str(path),'sha256':hashlib.sha256(raw).hexdigest()}
    marker=destination/'.course/experiment-source.json'
    marker.parent.mkdir(parents=True,exist_ok=True)
    with marker.open('x',encoding='utf8') as stream:
        json.dump(dict(schema='course.experiment-source/v1',product_root=str(source),
            controller_root=str(Path(__file__).resolve().parents[4]),files=files,
            purpose='teaching product-only copy; no completed controller imported'),stream,ensure_ascii=False,indent=2)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--source',type=Path,help='独立客户源码；省略时使用 FLOWERP_PROJECT_ROOT')
    args=parser.parse_args()
    target=args.output.resolve()
    if target.exists(): parser.error('output already exists; choose a new empty location')
    target.mkdir(parents=True)
    try:
        copy_product_source(target,args.source)
    except (OSError,ValueError) as error:
        parser.error(str(error))
    source=target/'flowerp/service.py'
    text=source.read_text(encoding='utf-8')
    needle='            if exists:\n                row = conn.execute('
    if text.count(needle)!=1: parser.error('source shape changed; inspect before preparing this fixture')
    replacement='''            if exists:
                # Explicit teaching defect: replay writes another ledger row.
                conn.execute(
                    "INSERT INTO inventory_events(event_key,sku,quantity,reserved_delta,event_type,reference) VALUES(?,?,?,?,?,?)",
                    (event_key + ":duplicate:" + uuid.uuid4().hex, sku, quantity, 0, "receive", reference),
                )
                row = conn.execute('''
    source.write_text(text.replace(needle,replacement),encoding='utf-8')
    (target/'FIXTURE.md').write_text('L05 explicit teaching defect: a replay appends an extra inventory event while returning unchanged stock. This copy is not the course-submit baseline or a production incident. Only local temporary databases are used by the external check.\n',encoding='utf-8')
    print(target)

if __name__=='__main__': main()
