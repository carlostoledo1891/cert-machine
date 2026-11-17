#!/usr/bin/env python3
"""The physics answer key, second engine: record Newton's runs as bytes.

Runs the scenes of corpus/physics-key/RULES.md, amendment 2, in Newton on the CPU
device, for the four solver configurations and the four timesteps, and writes

  corpus/physics-key/newton/<run-id>.f64.gz   the trajectory (section 3, A2.2)
  corpus/physics-key/newton/runs.json         the manifest
  corpus/physics-key/newton/calibration.json  the checks N0, N1, N2, N3 (A2.3)
  corpus/physics-key/newton/ENV.json          what produced the bytes

It decides nothing. With --check it regenerates in memory and compares every sha256
with the manifest (on this machine: bytes from another platform may differ).

Needs: python 3.12, newton 1.8.0, warp-lang 1.19.0, numpy (the .venv of this worktree).
"""
import gzip
import hashlib
import io
import json
import os
import platform
import struct
import sys

import numpy as np
import warp as wp

wp.config.quiet = True
import newton  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "corpus", "physics-key", "newton")
DEVICE = "cpu"

TIMESTEPS = ["0.01", "0.005", "0.002", "0.001"]
# name -> (solver class, keyword arguments, the damping the source says the body kernel applies)
INTEGRATORS = {
    "semiimplicit": ("SolverSemiImplicit", {}, 0.05),
    "semiimplicit-d0": ("SolverSemiImplicit", {"angular_damping": 0.0}, 0.0),
    "featherstone": ("SolverFeatherstone", {}, None),
    "featherstone-d0": ("SolverFeatherstone", {"angular_damping": 0.0}, None),
}
SCENES = {
    "fall": {"horizon": 2.0, "integrators": list(INTEGRATORS)},
    "pendulum": {"horizon": 10.0, "integrators": ["featherstone", "featherstone-d0"]},
    "top": {"horizon": 10.0, "integrators": list(INTEGRATORS)},
}
MUST_BE_ZERO = ["joint_armature", "joint_friction", "joint_damping", "joint_target_ke",
                "joint_target_kd", "joint_stiffness", "joint_limit_ke", "joint_limit_kd"]


def bits(x):
    return struct.pack(">d", float(x)).hex()


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def build(scene):
    """One freshly built model and its initial state (A2.1). No step is taken here."""
    if scene == "top":
        b = newton.ModelBuilder(gravity=(0.0, 0.0, 0.0))
        b.add_body(mass=1.0, com=wp.vec3(0.0, 0.0, 0.0), inertia=wp.mat33(1.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 3.0))
    elif scene == "fall":
        b = newton.ModelBuilder()
        b.add_body(mass=1.0, com=wp.vec3(0.0, 0.0, 0.0), inertia=wp.mat33(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0))
    elif scene == "pendulum":
        b = newton.ModelBuilder()
        link = b.add_link(mass=1.0, com=wp.vec3(0.0, 0.0, 0.0),
                          inertia=wp.mat33(0.01, 0.0, 0.0, 0.0, 0.01, 0.0, 0.0, 0.0, 0.01))
        j = b.add_joint_revolute(parent=-1, child=link, axis=newton.Axis.Y,
                                 parent_xform=wp.transform_identity(),
                                 child_xform=wp.transform(wp.vec3(0.0, 0.0, 1.0), wp.quat_identity()),
                                 limit_ke=0.0, limit_kd=0.0)
        b.add_articulation([j])
    else:
        raise ValueError(scene)
    m = b.finalize(device=DEVICE)
    if m.body_count != 1 or m.joint_count != 1 or m.shape_count != 0:
        raise RuntimeError("%s: not one body on one joint with no shape" % scene)
    for name in MUST_BE_ZERO:
        v = getattr(m, name, None)
        if v is not None and np.any(v.numpy() != 0):
            raise RuntimeError("%s: the model stores a non-zero %s" % (scene, name))
    if np.any(m.body_com.numpy() != 0):
        raise RuntimeError("%s: the centre of mass is not the body origin" % scene)
    inertia = m.body_inertia.numpy()[0]
    if np.any(inertia != np.diag(np.diag(inertia))):
        raise RuntimeError("%s: the stored inertia is not diagonal" % scene)

    s0, s1 = m.state(), m.state()
    q, qd = s0.joint_q.numpy(), s0.joint_qd.numpy()
    if scene == "pendulum":
        q[0] = 2.0
    elif scene == "top":
        qd[3:6] = (0.0625, 4.0, 0.0625)
    s0.joint_q.assign(q)
    s0.joint_qd.assign(qd)
    newton.eval_fk(m, s0.joint_q, s0.joint_qd, s0)
    return m, s0, s1


def params(scene, m):
    g = m.gravity.numpy()[0]
    inertia = m.body_inertia.numpy()[0]
    if scene == "fall":
        return {"G": bits(-g[2])}
    if scene == "pendulum":
        return {"M": bits(m.body_mass.numpy()[0]), "L": bits(m.joint_X_c.numpy()[0][2]),
                "IYY": bits(inertia[1][1]), "G": bits(-g[2])}
    if scene == "top":
        return {"I1": bits(inertia[0][0]), "I2": bits(inertia[1][1]), "I3": bits(inertia[2][2])}
    raise ValueError(scene)


def run(scene, integrator, timestep, steps):
    """Returns the model, the trajectory bytes and, per row, the body state (for N3)."""
    cls, kwargs, _ = INTEGRATORS[integrator]
    m, s0, s1 = build(scene)
    solver = getattr(newton.solvers, cls)(m, **kwargs)
    h = float(timestep)
    buf = io.BytesIO()
    body = []

    def record(k, s):
        bq = s.body_q.numpy()[0].astype(np.float64)       # binary32 -> binary64 is exact
        bqd = s.body_qd.numpy()[0].astype(np.float64)
        body.append(np.concatenate([bq, bqd]))
        if scene == "pendulum":
            nums = [float(np.float64(s.joint_q.numpy()[0])), float(np.float64(s.joint_qd.numpy()[0]))]
        else:
            nums = list(bq) + list(bqd)
        buf.write(struct.pack("<%dd" % (1 + len(nums)), k * h, *nums))

    record(0, s0)
    for k in range(1, steps + 1):
        s0.clear_forces()
        solver.step(s0, s1, None, None, h)
        s0, s1 = s1, s0
        record(k, s0)
    return m, buf.getvalue(), np.array(body)


def rot(w, x, y, z):
    n = w * w + x * x + y * y + z * z
    return np.array([
        [w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)],
        [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)],
        [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z],
    ]) / n


def calibrate(scene, integrator, m, raw, steps, timestep, body):
    """N1, N2, N3 of amendment 2 (A2.3): floating point, not a verdict."""
    out = {}
    width = len(raw) // (8 * (steps + 1))
    a = np.frombuffer(raw, dtype="<f8").reshape(steps + 1, width)
    out["finite"] = bool(np.isfinite(a).all() and np.isfinite(body).all())
    if not out["finite"]:
        return out
    if scene == "top":
        inertia = np.diag(m.body_inertia.numpy()[0]).astype(np.float64)
        q, w = a[:, 4:8], a[:, 11:14]                      # (qx, qy, qz, qw), world-frame
        ours, engine, as_body, as_first = [], [], [], []
        for k in range(steps + 1):
            x, y, z, s = q[k]
            R = rot(s, x, y, z)
            ours.append(R @ (inertia * (R.T @ w[k])))
            Re = np.array(wp.quat_to_matrix(wp.quat(float(x), float(y), float(z), float(s))), dtype=np.float64).reshape(3, 3)
            engine.append((Re @ np.diag(inertia) @ Re.T) @ w[k])
            as_body.append(R @ (inertia * w[k]))           # planted: angular velocity as body-frame
            Rf = rot(x, y, z, s)                           # planted: quaternion as scalar-first
            as_first.append(Rf @ (inertia * (Rf.T @ w[k])))
        ours, engine = np.array(ours), np.array(engine)
        l0 = float(np.linalg.norm(ours[0]))
        out["N1"] = float(np.max(np.linalg.norm(ours - engine, axis=1)) / l0)
        out["N1plantedBody"] = float(np.max(np.linalg.norm(np.array(as_body) - engine, axis=1)) / l0)
        out["N1plantedFirst"] = float(np.max(np.linalg.norm(np.array(as_first) - engine, axis=1)) / l0)
        d = INTEGRATORS[integrator][2]
        if d is not None:
            h = float(timestep)

            def replay(damping):
                worst, total = 0.0, 0.0
                for k in range(steps):
                    x, y, z, s = q[k]
                    R = rot(s, x, y, z)
                    wb = R.T @ w[k]
                    wb1 = wb + h * (-np.cross(wb, inertia * wb)) / inertia
                    err = float(np.linalg.norm((1.0 - damping * h) * (R @ wb1) - w[k + 1]))
                    worst, total = max(worst, err), total + err
                return worst, total
            w0 = float(np.linalg.norm(w[0]))
            worst, total = replay(d)
            out["N2"] = worst / w0
            if d != 0.0:
                _, total0 = replay(0.0)
                out["N2plantedRatio"] = total0 / total if total > 0 else float("inf")
    if scene == "pendulum":
        L = float(m.joint_X_c.numpy()[0][2])
        th, om = a[:, 1], a[:, 2]
        out["N3z"] = float(np.max(np.abs(-L * np.cos(th) - body[:, 2])))
        out["N3w"] = float(np.max(np.abs(np.abs(om) - np.linalg.norm(body[:, 10:13], axis=1)) / (1.0 + np.abs(om))))
    return out


def source_files():
    """sha256 of the solver sources read for amendment 2 and of the Warp binaries."""
    out = {}
    base = os.path.dirname(os.path.dirname(newton.__file__))
    for rel in ["newton/_src/solvers/solver.py",
                "newton/_src/solvers/semi_implicit/solver_semi_implicit.py",
                "newton/_src/solvers/featherstone/solver_featherstone.py",
                "newton/_src/solvers/featherstone/kernels.py"]:
        with open(os.path.join(base, rel), "rb") as f:
            out[rel] = sha256(f.read())
    wbin = os.path.join(os.path.dirname(wp.__file__), "bin")
    for name in sorted(os.listdir(wbin)):
        with open(os.path.join(wbin, name), "rb") as f:
            out["warp/bin/" + name] = sha256(f.read())
    return out


def main():
    check = "--check" in sys.argv
    manifest, calibration, files = [], {}, {}
    for scene, spec in SCENES.items():
        for iname in spec["integrators"]:
            for h in TIMESTEPS:
                run_id = "%s-%s-h%s" % (scene, iname, h)
                steps = int(round(spec["horizon"] / float(h)))
                m, raw, body = run(scene, iname, h, steps)
                _, raw_again, _ = run(scene, iname, h, steps)
                cal = calibrate(scene, iname, m, raw, steps, h, body)
                cal["N0"] = raw_again == raw
                calibration[run_id] = cal
                files[run_id] = raw
                entry = {
                    "id": run_id,
                    "scene": scene,
                    "engine": "newton",
                    "engineVersion": newton.__version__,
                    "integrator": iname,
                    "timestep": h,
                    "timestepBits": bits(float(h)),
                    "steps": steps,
                    "nq": 1 if scene == "pendulum" else 7,
                    "nv": 1 if scene == "pendulum" else 6,
                    "sha256": sha256(raw),
                    "params": params(scene, m),
                    "warnings": {},
                }
                if scene != "pendulum":
                    entry["layout"] = "world"
                manifest.append(entry)
                print(run_id, sha256(raw)[:12], json.dumps(cal), flush=True)

    if check:
        with open(os.path.join(OUT, "runs.json")) as f:
            pinned = {r["id"]: r for r in json.load(f)["runs"]}
        bad = [r["id"] for r in manifest if pinned.get(r["id"], {}).get("sha256") != r.get("sha256")]
        bad += [i for i in pinned if i not in {r["id"] for r in manifest}]
        print("regenerated %d runs; %d differ from the manifest" % (len(manifest), len(bad)))
        for i in bad:
            print("  DIFFERS", i)
        sys.exit(1 if bad else 0)

    os.makedirs(OUT, exist_ok=True)
    for run_id, raw in files.items():
        with open(os.path.join(OUT, run_id + ".f64.gz"), "wb") as f:
            with gzip.GzipFile(filename="", mode="wb", fileobj=f, mtime=0, compresslevel=9) as g:
                g.write(raw)
    with open(os.path.join(OUT, "runs.json"), "w") as f:
        json.dump({"format": 1, "runs": manifest}, f, indent=1, sort_keys=True)
        f.write("\n")
    with open(os.path.join(OUT, "calibration.json"), "w") as f:
        json.dump(calibration, f, indent=1, sort_keys=True)
        f.write("\n")
    env = {
        "newton": newton.__version__,
        "warp": wp.__version__,
        "device": DEVICE,
        "numpy": np.__version__,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "machine": platform.machine(),
        "files": source_files(),
    }
    with open(os.path.join(OUT, "ENV.json"), "w") as f:
        json.dump(env, f, indent=1, sort_keys=True)
        f.write("\n")
    print("wrote %d runs, %d bytes raw" % (len(files), sum(len(b) for b in files.values())))


if __name__ == "__main__":
    main()
