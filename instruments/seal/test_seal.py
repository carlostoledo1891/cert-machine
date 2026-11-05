#!/usr/bin/env python3
"""test_seal.py — unit tests for seal.py (python3 -I -m unittest instruments/seal/test_seal.py): the commitment against
a hand computation, the strict salt rule, the deterministic archive, the shell one-liner against the Python digest."""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import seal as S  # noqa: E402


class SealTests(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp(prefix="seal-ut-")
        self.idea = os.path.join(self.d, "idea")
        os.makedirs(os.path.join(self.idea, "sub"))
        open(os.path.join(self.idea, "b.txt"), "w").write("bee\n")
        open(os.path.join(self.idea, "a.txt"), "w").write("ay\n")
        open(os.path.join(self.idea, "sub", "c.txt"), "w").write("sea\n")

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def test_commitment_by_hand(self):
        arch = b"not really a tar"
        salt = bytes(range(32))
        want = hashlib.sha256(b"verify-seal-v1\n" + salt + hashlib.sha256(arch).digest()).hexdigest()
        self.assertEqual(S.digest(arch, salt), want)

    def test_salt_is_strict(self):
        good = "ab" * 32
        self.assertEqual(S.parse_salt(good), bytes.fromhex(good))
        for bad in ("", good + "\n", good[:-2], good.upper(), good + "00", "zz" * 32, " " + good):
            with self.assertRaises(S.Refused):
                S.parse_salt(bad)

    def test_archive_is_deterministic_and_ordered(self):
        a1 = S.archive_bytes(self.idea)
        os.utime(os.path.join(self.idea, "a.txt"), (123456789, 123456789))
        os.chmod(os.path.join(self.idea, "b.txt"), 0o755)
        a2 = S.archive_bytes(self.idea)
        self.assertEqual(a1, a2)
        import tarfile, io
        names = [m.name for m in tarfile.open(fileobj=io.BytesIO(a1)).getmembers()]
        self.assertEqual(names, ["a.txt", "b.txt", "sub/c.txt"])
        for m in tarfile.open(fileobj=io.BytesIO(a1)).getmembers():
            self.assertEqual((m.mtime, m.uid, m.gid, m.mode, m.uname, m.gname), (0, 0, 0, 0o644, "", ""))

    def test_single_file_seals_under_its_name(self):
        arch = S.archive_bytes(os.path.join(self.idea, "a.txt"))
        import tarfile, io
        self.assertEqual([m.name for m in tarfile.open(fileobj=io.BytesIO(arch)).getmembers()], ["a.txt"])

    def test_cli_seal_open_roundtrip_and_shell(self):
        bundle = os.path.join(self.d, "idea.seal")
        r = subprocess.run([sys.executable, "-I", S.__file__, "seal", self.idea, "--out", bundle], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = r.stdout.strip()
        self.assertRegex(d, r"^[0-9a-f]{64}$")
        self.assertEqual(S.digest(open(os.path.join(bundle, "archive.tar"), "rb").read(), S.parse_salt(open(os.path.join(bundle, "salt.hex")).read())), d)
        r = subprocess.run([sys.executable, "-I", S.__file__, "open", bundle], capture_output=True, text=True)
        self.assertEqual(r.returncode, 2)          # no anchor: REFUSED, never CERTIFIED
        self.assertIn('"REFUSED"', r.stdout)
        if shutil.which("xxd") and shutil.which("shasum"):
            r = subprocess.run(["bash", "-c", S.REDERIVE], cwd=bundle, capture_output=True, text=True)
            self.assertEqual(r.stdout.split()[0], d)

    # ---- v2: the per-file salted manifest
    def test_v2_commitments_by_hand(self):
        s_i = bytes(range(32))
        data = b"Theorem. x\n"
        self.assertEqual(S.file_hash(s_i, data), hashlib.sha256(b"verify-seal-v2-file\n" + s_i + hashlib.sha256(data).digest()).hexdigest())
        self.assertEqual(S.path_hash(s_i, "notes/plan.txt"), hashlib.sha256(b"verify-seal-v2-path\n" + s_i + "notes/plan.txt".encode("utf-8")).hexdigest())
        files = [{"index": 0, "path_hash": "0" * 64, "sha256": "1" * 64}]
        man = S.manifest_bytes(files)
        self.assertEqual(man, b'{"files":[{"index":0,"path_hash":"' + b"0" * 64 + b'","sha256":"' + b"1" * 64 + b'"}],"version":"verify-seal-v2"}\n')
        salt = bytes(range(32, 64))
        self.assertEqual(S.digest2(man, salt), hashlib.sha256(b"verify-seal-v2\n" + salt + hashlib.sha256(man).digest()).hexdigest())

    def test_v2_seal_reveal_verify_roundtrip(self):
        bundle = os.path.join(self.d, "idea.seal2")
        r = subprocess.run([sys.executable, "-I", S.__file__, "seal2", self.idea, "--out", bundle], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = r.stdout.strip()
        self.assertRegex(d, r"^[0-9a-f]{64}$")
        man = open(os.path.join(bundle, "manifest.json"), "rb").read()
        self.assertNotIn(b"a.txt", man); self.assertNotIn(b"sub", man)            # no path in the manifest
        self.assertEqual(S.digest2(man, S.parse_salt(open(os.path.join(bundle, "salt.hex")).read())), d)
        pkg = os.path.join(self.d, "r")
        r = subprocess.run([sys.executable, "-I", S.__file__, "reveal", bundle, "sub/c.txt", "--out", pkg], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(os.listdir(os.path.join(pkg, "files")), ["sub"])
        self.assertFalse(os.path.exists(os.path.join(pkg, "salts.json")))        # the other salts never leave the bundle
        self.assertFalse(os.path.exists(os.path.join(pkg, "archive.tar")))
        r = subprocess.run([sys.executable, "-I", S.__file__, "verify", pkg], capture_output=True, text=True)
        self.assertEqual(r.returncode, 2)          # no anchor: REFUSED, never CERTIFIED
        self.assertIn('"REFUSED"', r.stdout)
        self.assertIn('"file_sha256"', r.stdout)   # the file and the manifest re-derived before the anchors stopped it
        if shutil.which("xxd") and shutil.which("shasum"):
            r = subprocess.run(["bash", "-c", S.REDERIVE2], cwd=bundle, capture_output=True, text=True)
            self.assertEqual(r.stdout.split()[0], d)


if __name__ == "__main__":
    unittest.main()
