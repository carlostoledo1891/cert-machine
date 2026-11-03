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


if __name__ == "__main__":
    unittest.main()
