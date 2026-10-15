"""Run a record package's verify script confined to the package (used by record_score.py; stdlib only).

    python3 confine.py PKG_ROOT SCRIPT          (record_score.py also puts a copy of this file on the child PYTHONPATH as
                                                 sitecustomize.py, which confines every Python child the script starts)

A PEP 578 audit hook, installed before the script's first line runs, refuses (PermissionError, plus one CONFINE-VIOLATION
line on the inherited stderr fd) every Python-level file open / directory listing outside
  - the package copy (read and write; symlinks are resolved first, so a link pointing out is refused),
  - the interpreter's own library dirs (stdlib, site-/dist-packages: imports), the pinned v1 archive /opt/mosaic/dbn_v1,
    the harness lib dir (read only), /dev/null, /dev/urandom, /proc/self,
and every process spawn (os.system, os.exec*, os.posix_spawn, os.spawn*, subprocess of anything but this interpreter) and
socket connect/bind. The one allowed child is this same interpreter (e.g. `subprocess.run([sys.executable,
"second_line.py"])`) started with the inherited confinement environment and without -I / -E / -S: its sitecustomize
re-installs the hook, so the child is confined the same way. os.fork stays allowed (multiprocessing's default "fork" start
method on Linux, <= 2 cores); the spawn / forkserver start methods are refused. ctypes may load only libraries under the
interpreter's own dirs and resolve only Py* symbols (foreign C calls would bypass the hook). Opens done inside C extensions
are not audited - this confines honest mistakes and the outside-read class, it is not a security sandbox (the harness still
runs under the no-network sandbox).
"""
from __future__ import annotations

import os
import re
import runpy
import shutil
import sys
import sysconfig
import threading

VIOLATION = "CONFINE-VIOLATION"
ENV_PKG = "MOSAIC2_CONFINE_PKG"
ENV_SITE = "MOSAIC2_CONFINE_SITE"
ENV_LIB = "MOSAIC2_CONFINE_LIB"
READ_ONLY_EXTRA = ("/opt/mosaic/dbn_v1", "/dev/null", "/dev/urandom", "/dev/random", "/proc/self")
SPAWN_EVENTS = {"os.system", "os.exec", "os.spawn", "os.startfile", "pty.spawn",
                "socket.connect", "socket.bind", "socket.sendto", "socket.sendmsg"}
PATH_EVENTS = {"open", "os.listdir", "os.scandir", "os.chdir", "os.mkdir", "os.remove", "os.rename", "os.rmdir",
               "os.symlink", "os.link", "os.truncate", "os.chmod", "shutil.copyfile", "shutil.rmtree"}
UNSAFE_FLAG = re.compile(r"^-[A-Za-z]*[IES]")
CONFINED = False


def _under(p: str, root: str) -> bool:
    return p == root or p.startswith(root.rstrip("/") + "/")


def lib_roots() -> list:
    roots = set()
    for key in ("stdlib", "platstdlib", "purelib", "platlib"):
        v = sysconfig.get_paths().get(key)
        if v:
            roots.add(os.path.realpath(v))
    if getattr(sys, "pycache_prefix", None):
        roots.add(os.path.realpath(sys.pycache_prefix))
    for p in sys.path:  # the import roots at start-up (stdlib, site dirs, .pth entries), read only
        if p and os.path.isabs(p):
            roots.add(os.path.realpath(p))
    return sorted(roots)


def install(pkg: str) -> None:
    global CONFINED
    if CONFINED:
        return
    CONFINED = True
    pkg = os.path.realpath(pkg)
    libs = [r for r in lib_roots() if not _under(pkg, r)]
    ro = [os.path.realpath(r) if os.path.exists(r) else r for r in READ_ONLY_EXTRA]
    ro += [os.path.dirname(os.path.realpath(__file__))] + [os.path.realpath(os.environ[k]) for k in (ENV_SITE, ENV_LIB) if os.environ.get(k)]
    me = os.path.realpath(sys.executable)
    err_fd = os.dup(2)
    child_ok = threading.local()

    def refuse(what: str) -> None:
        try:
            os.write(err_fd, f"\n{VIOLATION}: {what}\n".encode("utf-8", "replace"))
        except OSError:
            pass
        raise PermissionError(f"{VIOLATION}: {what}")

    def check_path(event: str, raw, write: bool) -> None:
        if isinstance(raw, int) or raw is None:
            return
        try:
            raw = os.fsdecode(raw)
        except TypeError:
            return
        p = os.path.realpath(os.path.join(os.getcwd(), raw) if not os.path.isabs(raw) else raw)
        if _under(p, pkg):
            return
        if write:
            refuse(f"{event} for writing outside the package: {p}")
        if any(_under(p, r) for r in libs) or any(_under(p, r) for r in ro):
            return
        refuse(f"{event} outside the package: {p}")

    def confined_python_child(args) -> str:
        """'' when subprocess.Popen(args) starts this interpreter with the confinement env intact, else the reason."""
        executable, argv, cwd, env = (list(args) + [None] * 4)[:4]
        argv = [os.fsdecode(a) for a in argv] if isinstance(argv, (list, tuple)) else [os.fsdecode(argv)] if argv else []
        exe = os.fsdecode(executable) if executable else (argv[0] if argv else "")
        exe = exe if os.path.isabs(exe) else (shutil.which(exe) or exe)
        if os.path.realpath(exe) != me:
            return f"{exe!r} is not this interpreter"
        for a in argv[1:]:
            if not a.startswith("-") or a in ("-c", "-m"):
                break
            if UNSAFE_FLAG.match(a):
                return f"interpreter flag {a} would skip the confinement"
        if env is not None and any(env.get(k) != os.environ.get(k) for k in (ENV_PKG, ENV_SITE, ENV_LIB, "PYTHONPATH")):
            return "env drops the confinement variables"
        if not os.environ.get(ENV_PKG):
            return "no confinement environment to inherit"
        if cwd is not None:
            check_path("subprocess cwd", cwd, False)
        return ""

    def hook(event: str, args) -> None:
        if event == "subprocess.Popen":
            why = confined_python_child(args)
            if why:
                refuse(f"subprocess.Popen is not allowed in a verify script ({why}; only a confined child of this interpreter is)")
            child_ok.allow = True
            return
        if event == "os.posix_spawn" and getattr(child_ok, "allow", False):
            child_ok.allow = False
            return
        if event in SPAWN_EVENTS or event == "os.posix_spawn":
            refuse(f"{event} is not allowed in a verify script")
        if event == "ctypes.dlopen" and args and args[0] is not None:
            name = os.fsdecode(args[0]) if isinstance(args[0], (str, bytes)) else str(args[0])
            if not (os.path.isabs(name) and any(_under(os.path.realpath(name), r) for r in libs)):
                refuse(f"ctypes.dlopen({name!r}) is not allowed in a verify script")
        if event in ("ctypes.dlsym", "ctypes.dlsym/handle") and len(args) > 1:
            sym = args[1].decode("ascii", "replace") if isinstance(args[1], bytes) else str(args[1])
            if not sym.startswith(("Py", "_Py")):
                refuse(f"{event}({sym!r}) is not allowed in a verify script (foreign C calls bypass the confinement)")
        if event not in PATH_EVENTS or not args:
            return
        if event == "open":
            mode = args[1] if len(args) > 1 else "r"
            flags = args[2] if len(args) > 2 else 0
            write = (isinstance(mode, str) and any(c in mode for c in "wax+")) or (
                isinstance(flags, int) and bool(flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND)))
            check_path(event, args[0], write)
        elif event in ("os.listdir", "os.scandir", "os.chdir"):
            check_path(event, args[0] if args[0] is not None else ".", False)
        else:
            for a in args[:2]:
                if isinstance(a, (str, bytes, os.PathLike)):
                    check_path(event, a, True)

    try:
        import _posixsubprocess

        real_fork_exec = _posixsubprocess.fork_exec

        def fork_exec(*a, **k):
            if getattr(child_ok, "allow", False):
                child_ok.allow = False
                return real_fork_exec(*a, **k)
            refuse("_posixsubprocess.fork_exec (multiprocessing spawn / forkserver) is not allowed in a verify script")

        _posixsubprocess.fork_exec = fork_exec
        sub = sys.modules.get("subprocess")
        if sub is not None and getattr(sub, "_fork_exec", None) is real_fork_exec:
            sub._fork_exec = fork_exec
    except ImportError:
        pass
    sys.excepthook = sys.__excepthook__  # Ubuntu's apport hook reads /etc/default/apport on a crash
    sys.dont_write_bytecode = True
    sys.addaudithook(hook)


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: confine.py PKG_ROOT SCRIPT", file=sys.stderr)
        return 2
    pkg, script = sys.argv[1], sys.argv[2]
    script = os.path.realpath(script)
    script_dir = os.path.dirname(script)
    sys.path[0] = script_dir
    sys.argv = [script]
    os.chdir(script_dir)
    site = sys.modules.get("sitecustomize")
    if not getattr(site, "CONFINED", False):
        install(pkg)
    runpy.run_path(script, run_name="__main__")
    return 0


if __name__ == "sitecustomize" and os.environ.get(ENV_PKG):
    install(os.environ[ENV_PKG])
elif __name__ == "__main__":
    raise SystemExit(main())
