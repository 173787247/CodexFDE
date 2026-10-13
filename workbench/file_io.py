"""Read current files through short Windows sharing locks without changing access."""
import os
from pathlib import Path
import time
import secrets
import stat


_WINDOWS = os.name == 'nt'
# Six attempts, at most 1.55 seconds of waiting; permanent denial still fails.
_READ_DELAYS = (.05, .1, .2, .4, .8)


def open_read(path, mode='rb', *, encoding=None, errors=None):
    """Open for reading, retrying only Windows access/sharing denial.

    The retry opens the requested file again: it does not return cached bytes,
    change permissions, or substitute content when the file is unavailable.
    """
    if mode not in {'r', 'rt', 'rb'}:
        raise ValueError('open_read only accepts read modes')
    from .reference_paths import resolve_reference
    target = resolve_reference(path)
    for attempt in range(len(_READ_DELAYS) + 1):
        try:
            return target.open(mode, encoding=encoding, errors=errors)
        except PermissionError as error:
            if (not _WINDOWS or getattr(error, 'winerror', None) not in {None, 5, 32, 33}
                    or attempt == len(_READ_DELAYS)):
                raise
            time.sleep(_READ_DELAYS[attempt])


def read_bytes(path):
    with open_read(path) as source:
        return source.read()


def read_text(path, encoding='utf-8', *, errors=None):
    with open_read(path, 'r', encoding=encoding, errors=errors) as source:
        return source.read()


def atomic_write_text(path, content, encoding='utf-8'):
    """Replace control metadata after a complete write; leave old bytes on failure."""
    target = Path(path)
    temporary = target.with_name(target.name + '.' + secrets.token_hex(8) + '.tmp')
    try:
        temporary.write_text(content, encoding=encoding)
        for attempt in range(len(_READ_DELAYS) + 1):
            try:
                temporary.replace(target)
                return
            except PermissionError as error:
                if (not _WINDOWS or getattr(error, 'winerror', None) not in {None, 5, 32, 33}
                        or attempt == len(_READ_DELAYS)):
                    raise
                time.sleep(_READ_DELAYS[attempt])
    finally:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass


def atomic_write_bytes(path, content, *, before_replace=None):
    """Write and verify complete bytes before replacing the current file."""
    target = Path(path)
    temporary = target.with_name(target.name + '.' + secrets.token_hex(8) + '.tmp')
    replaced, failure = False, None
    try:
        temporary.write_bytes(content)
        if read_bytes(temporary) != content:
            raise OSError('文件未完整写入，原文件保持不变')
        if target.exists():
            temporary.chmod(stat.S_IMODE(target.stat().st_mode))
        for attempt in range(len(_READ_DELAYS) + 1):
            if before_replace is not None:
                before_replace()
            try:
                temporary.replace(target)
                replaced = True
                return
            except PermissionError as error:
                if (not _WINDOWS or getattr(error, 'winerror', None) not in {None, 5, 32, 33}
                        or attempt == len(_READ_DELAYS)):
                    raise
                time.sleep(_READ_DELAYS[attempt])
    except BaseException as error:
        failure = error
        raise
    finally:
        if not replaced:
            try:
                temporary.unlink(missing_ok=True)
            except OSError as cleanup_error:
                if failure is None:
                    raise
                if hasattr(failure, 'add_note'):
                    failure.add_note('临时文件清理失败，保留现场：' + str(cleanup_error))
