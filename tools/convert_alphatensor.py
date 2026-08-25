#!/usr/bin/env python3
"""convert_alphatensor.py — mechanical transcription of DeepMind's published
AlphaTensor factorizations (corpus/sources/alphatensor_{r,f2}.npz, pinned by
sha256) into corpus/strassen-corpus.json for the strassen-audit family.

Stdlib only. The .npz members are either plain int .npy arrays or
object-dtype .npy arrays (a pickle of three ragged factor matrices); the
pickle is read through a shim Unpickler that admits ONLY numpy's ndarray /
dtype reconstruction symbols and rebuilds the raw integer buffers by hand —
no numpy, and nothing else can be smuggled through the pickle.

Nothing here is trusted: this tool converts bytes to JSON; the family's
exact audit decides whether each factorization is a correct algorithm. A
conversion mistake cannot ship as a certificate — it would be REFUTED.

usage: python3 tools/convert_alphatensor.py"""

import ast
import io
import json
import pickle
import struct
import zipfile
import os
import hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus', 'sources')

# which published factorizations the corpus audits
SELECT = {
    'alphatensor_r.npz': {
        'ring': 'Q',
        'keys': ['2,2,2', '3,3,3', '4,4,4', '3,4,5', '4,5,5']
    },
    'alphatensor_f2.npz': {
        'ring': 'F2',
        'keys': ['4,4,4', '5,5,5']
    }
}


class NDArray(object):
    def __setstate__(self, state):
        self.version, self.shape, self.dtype, self.fortran, self.data = state


def _reconstruct(cls, shape, dtype):
    return NDArray()


class DType(object):
    def __init__(self, descr, align=0, copy=1):
        self.descr = descr

    def __setstate__(self, state):
        self.state = state


class ShimUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == '_reconstruct':
            return _reconstruct
        if name == 'ndarray':
            return NDArray
        if name == 'dtype':
            return DType
        raise pickle.UnpicklingError('refusing %s.%s' % (module, name))


def decode_int_array(nd):
    fmt = {'i8': 'q', 'i4': 'i', 'i2': 'h', 'i1': 'b', 'u1': 'B'}[nd.dtype.descr.lstrip('<>|=')]
    vals = [v[0] for v in struct.iter_unpack('<' + fmt, nd.data)]
    rows, cols = nd.shape
    assert not nd.fortran
    return [[vals[r * cols + c] for c in range(cols)] for r in range(rows)]


def load_factors(raw):
    """-> [U, V, W], each a (size x rank) integer matrix"""
    assert raw[:6] == b'\x93NUMPY'
    hlen = struct.unpack('<H', raw[8:10])[0]
    hdr = ast.literal_eval(raw[10:10 + hlen].decode())
    body = raw[10 + hlen:]
    if hdr['descr'] == '|O':
        arr = ShimUnpickler(io.BytesIO(body)).load()
        return [decode_int_array(x) for x in arr.data]
    fmt = {'<i8': 'q', '<i4': 'i'}[hdr['descr']]
    vals = [v[0] for v in struct.iter_unpack('<' + fmt, body)]
    three, size, rank = hdr['shape']
    assert three == 3
    out = []
    for f in range(3):
        base = f * size * rank
        out.append([[vals[base + i * rank + t] for t in range(rank)] for i in range(size)])
    return out


def main():
    corpus = []
    for fn, spec in SELECT.items():
        path = os.path.join(SRC, fn)
        sha = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        z = zipfile.ZipFile(path)
        for key in spec['keys']:
            U, V, W = load_factors(z.read(key + '.npy'))
            n, m, p = [int(x) for x in key.split(',')]
            rank = len(U[0])
            assert len(U) == n * m and len(V) == m * p and len(W) == n * p, (key, len(U), len(V), len(W))
            corpus.append({
                'id': 'alphatensor-' + spec['ring'].lower() + '-' + key.replace(',', 'x'),
                'dims': [n, m, p], 'rank': rank, 'ring': spec['ring'],
                'source': fn, 'sourceSha256': sha, 'npzKey': key,
                'U': U, 'V': V, 'W': W
            })
            print('%-24s <%s> rank %d over %s' % (corpus[-1]['id'], key, rank, spec['ring']))
    out = {
        'what': 'AlphaTensor factorizations (DeepMind, Nature 610, 2022; github.com/google-deepmind/alphatensor), '
                'mechanically converted from the pinned npz sources. Each entry claims: the rank-r tensor '
                'decomposition U,V,W multiplies n x m by m x p matrices over the stated ring. The strassen-audit '
                'family decides each claim exactly; this file is transcription, not truth.',
        'convertedBy': 'tools/convert_alphatensor.py',
        'entries': corpus
    }
    dst = os.path.join(ROOT, 'corpus', 'strassen-corpus.json')
    with open(dst, 'w') as f:
        json.dump(out, f)
        f.write('\n')
    print('corpus/strassen-corpus.json: %d factorizations' % len(corpus))


if __name__ == '__main__':
    main()
