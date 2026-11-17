#!/usr/bin/env python3
"""The physics answer key: record the engine's runs as bytes.

Runs every scene of corpus/physics-key/RULES.md (section 4) in MuJoCo, for every
integrator the engine names and every timestep of the ladder, and writes

  corpus/physics-key/runs/<run-id>.f64.gz   the trajectory (RULES.md section 3)
  corpus/physics-key/runs/runs.json         the manifest
  corpus/physics-key/runs/calibration.json  the checks C0, C1, C2 (section 8)
  corpus/physics-key/runs/ENV.json          what produced the bytes

It decides nothing. With --check it regenerates in memory and compares every sha256
with the manifest (on this machine: bytes from another platform may differ).

Needs: python 3.12, mujoco 4.0.1, numpy (the .venv of this worktree).
"""
import gzip
import hashlib
import io
import json
import os
import platform
import struct
import sys

import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
KEY = os.path.join(ROOT, "corpus", "physics-key")
SCENES_DIR = os.path.join(KEY, "scenes")
RUNS_DIR = os.path.join(KEY, "runs")

TIMESTEPS = ["0.01", "0.005", "0.002", "0.001"]
INTEGRATORS = [
    ("euler", "mjINT_EULER"),
    ("rk4", "mjINT_RK4"),
    ("implicit", "mjINT_IMPLICIT"),
    ("implicitfast", "mjINT_IMPLICITFAST"),
    ("discrete", "mjINT_DISCRETE"),
]
SCENES = {
    "fall": {"horizon": 2.0},
    "pendulum": {"horizon": 10.0},
    "top": {"horizon": 10.0},
}
SENSOR = '<sensor><subtreeangmom name="angmom" body="b"/></sensor>'


def bits(x):
    return struct.pack(">d", float(x)).hex()


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def load(scene, integrator, timestep, instrumented):
    with open(os.path.join(SCENES_DIR, scene + ".xml")) as f:
        xml = f.read()
    if instrumented:
        xml = xml.replace("</mujoco>", SENSOR + "</mujoco>")
    m = mujoco.MjModel.from_xml_string(xml)
    m.opt.integrator = int(getattr(mujoco.mjtIntegrator, integrator))
    m.opt.timestep = float(timestep)
    if instrumented:
        m.opt.enableflags |= int(mujoco.mjtEnableBit.mjENBL_ENERGY)
    d = mujoco.MjData(m)
    mujoco.mj_resetData(m, d)
    if scene == "pendulum":
        d.qpos[0] = 2.0
    elif scene == "top":
        d.qvel[3:6] = (0.0625, 4.0, 0.0625)
    return m, d


def params(scene, m):
    if scene == "fall":
        return {"G": bits(-m.opt.gravity[2])}
    if scene == "pendulum":
        return {
            "M": bits(m.body_mass[1]),
            "L": bits(-m.body_ipos[1][2]),
            "IYY": bits(m.body_inertia[1][1]),
            "G": bits(-m.opt.gravity[2]),
        }
    if scene == "top":
        return {
            "I1": bits(m.body_inertia[1][0]),
            "I2": bits(m.body_inertia[1][1]),
            "I3": bits(m.body_inertia[1][2]),
        }
    raise ValueError(scene)


def row(d):
    return struct.pack("<%dd" % (1 + len(d.qpos) + len(d.qvel)), d.time, *d.qpos, *d.qvel)


def warnings_of(d):
    out = {}
    for name in dir(mujoco.mjtWarning):
        if name.startswith("mjWARN_"):
            n = int(d.warning[int(getattr(mujoco.mjtWarning, name))].number)
            if n:
                out[name] = n
    return out


def rot(q):
    w, x, y, z = q
    n = w * w + x * x + y * y + z * z
    return np.array([
        [w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)],
        [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)],
        [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z],
    ]) / n


def run_plain(scene, integrator, timestep, steps):
    m, d = load(scene, integrator, timestep, False)
    buf = io.BytesIO()
    buf.write(row(d))
    for _ in range(steps):
        mujoco.mj_step(m, d)
        buf.write(row(d))
    return m, d, buf.getvalue()


def run_instrumented(scene, integrator, timestep, steps):
    """The same run with the energy flag, the sensor and a forward pass per row.

    Returns the trajectory bytes and, per row, the engine's own energy and angular
    momentum, each read at the state of that row.
    """
    m, d = load(scene, integrator, timestep, True)
    buf = io.BytesIO()
    energy, angmom = [], []
    for k in range(steps + 1):
        mujoco.mj_forward(m, d)
        energy.append(float(d.energy[0] + d.energy[1]))
        angmom.append(np.array(d.sensordata[0:3], dtype=float))
        buf.write(row(d))
        if k < steps:
            mujoco.mj_step(m, d)
    return m, buf.getvalue(), np.array(energy), np.array(angmom)


def calibrate(scene, m, raw, steps, energy, angmom):
    """C1, C2 of RULES.md section 8: floating point, not a verdict."""
    width = 1 + m.nq + m.nv
    a = np.frombuffer(raw, dtype="<f8").reshape(steps + 1, width)
    out = {}
    finite = bool(np.isfinite(a).all() and np.isfinite(energy).all())
    out["finite"] = finite
    if not finite:
        return out
    if scene == "pendulum":
        M, L = m.body_mass[1], -m.body_ipos[1][2]
        IYY, G = m.body_inertia[1][1], -m.opt.gravity[2]
        th, om = a[:, 1], a[:, 2]
        ours = 0.5 * (IYY + M * L * L) * om * om - M * G * L * np.cos(th)
        scale = M * G * L
        out["C2"] = float(np.max(np.abs((ours - ours[0]) - (energy - energy[0]))) / scale)
    if scene == "top":
        I = m.body_inertia[1]
        q, w = a[:, 4:8], a[:, 11:14]
        T = 0.5 * (I[0] * w[:, 0] ** 2 + I[1] * w[:, 1] ** 2 + I[2] * w[:, 2] ** 2)
        out["C2"] = float(np.max(np.abs((T - T[0]) - (energy - energy[0]))) / T[0])
        ours = np.array([rot(q[k]) @ (I * w[k]) for k in range(steps + 1)])
        # the planted misreading: the angular velocity taken as world-frame
        wrong = np.array([rot(q[k]) @ (I * (rot(q[k]).T @ w[k])) for k in range(steps + 1)])
        l0 = float(np.linalg.norm(ours[0]))
        out["C1"] = float(np.max(np.linalg.norm(ours - angmom, axis=1)) / l0)
        out["C1planted"] = float(np.max(np.linalg.norm(wrong - angmom, axis=1)) / l0)
    return out


def engine_files():
    """sha256 of every binary of the installed engine packages."""
    out = {}
    base = os.path.dirname(os.path.dirname(mujoco.__file__))
    for pkg in sorted(os.listdir(base)):
        if not pkg.lower().startswith("mujoco") or pkg.endswith(".dist-info"):
            continue
        for dirpath, _, names in os.walk(os.path.join(base, pkg)):
            for name in sorted(names):
                if name.endswith((".so", ".dylib")):
                    p = os.path.join(dirpath, name)
                    with open(p, "rb") as f:
                        out[os.path.relpath(p, base)] = sha256(f.read())
    return out


def main():
    check = "--check" in sys.argv
    manifest, calibration, files = [], {}, {}
    for scene, spec in SCENES.items():
        for iname, ienum in INTEGRATORS:
            for h in TIMESTEPS:
                run_id = "%s-%s-h%s" % (scene, iname, h)
                steps = int(round(spec["horizon"] / float(h)))
                try:
                    m, d, raw = run_plain(scene, ienum, h, steps)
                except Exception as e:  # an integrator that will not run is recorded
                    manifest.append({"id": run_id, "scene": scene, "notRun": str(e)})
                    continue
                mi, raw_i, energy, angmom = run_instrumented(scene, ienum, h, steps)
                cal = calibrate(scene, mi, raw, steps, energy, angmom)
                cal["C0"] = raw_i == raw
                calibration[run_id] = cal
                files[run_id] = raw
                manifest.append({
                    "id": run_id,
                    "scene": scene,
                    "engine": "mujoco",
                    "engineVersion": mujoco.__version__,
                    "integrator": iname,
                    "timestep": h,
                    "timestepBits": bits(m.opt.timestep),
                    "steps": steps,
                    "nq": int(m.nq),
                    "nv": int(m.nv),
                    "sha256": sha256(raw),
                    "params": params(scene, m),
                    "warnings": warnings_of(d),
                })

    if check:
        with open(os.path.join(RUNS_DIR, "runs.json")) as f:
            pinned = {r["id"]: r for r in json.load(f)["runs"]}
        bad = [r["id"] for r in manifest if pinned.get(r["id"], {}).get("sha256") != r.get("sha256")]
        bad += [i for i in pinned if i not in {r["id"] for r in manifest}]
        print("regenerated %d runs; %d differ from the manifest" % (len(manifest), len(bad)))
        for i in bad:
            print("  DIFFERS", i)
        sys.exit(1 if bad else 0)

    os.makedirs(RUNS_DIR, exist_ok=True)
    for run_id, raw in files.items():
        with open(os.path.join(RUNS_DIR, run_id + ".f64.gz"), "wb") as f:
            with gzip.GzipFile(filename="", mode="wb", fileobj=f, mtime=0, compresslevel=9) as g:
                g.write(raw)
    with open(os.path.join(RUNS_DIR, "runs.json"), "w") as f:
        json.dump({"format": 1, "runs": manifest}, f, indent=1, sort_keys=True)
        f.write("\n")
    with open(os.path.join(RUNS_DIR, "calibration.json"), "w") as f:
        json.dump(calibration, f, indent=1, sort_keys=True)
        f.write("\n")
    env = {
        "mujoco": mujoco.__version__,
        "mujocoVersionString": mujoco.mj_versionString(),
        "numpy": np.__version__,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "machine": platform.machine(),
        "engineBinaries": engine_files(),
        "scenes": {s: sha256(open(os.path.join(SCENES_DIR, s + ".xml"), "rb").read()) for s in SCENES},
    }
    with open(os.path.join(RUNS_DIR, "ENV.json"), "w") as f:
        json.dump(env, f, indent=1, sort_keys=True)
        f.write("\n")
    total = sum(len(b) for b in files.values())
    print("wrote %d runs, %d bytes raw; %d not run" % (len(files), total, len(manifest) - len(files)))


if __name__ == "__main__":
    main()
