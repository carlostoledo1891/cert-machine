The three qiushi-section* JSON files are copied unmodified from the GitHub release section-vectors-2026-10-11 of
Oxelra-AI/Qiushi-Engine-Kissing-Number-Research (files.json, section43-verification.json, section45-verification.json),
original data under CC BY 4.0 per the repository's RIGHTS.md. Their sha256 equal the digests GitHub reports for the release
assets (checked 2026-10-11). The point files themselves (section43/45 .i8.gz, .csv.gz) are not copied: they are pinned by
sha256 in tools/run-kissing-sections.py and cached git-ignored.

The five qiushi-lattice-* files are copied unmodified from the same repository at commit
33fe9c1fe73b473a13dcd4a2870dbcb480728ab1 (2026-10-11, "Publish complete section-vector export and reproduction tools"),
constructions/sections/: d43/data/parent-section.txt (the ambient Gram matrix G of P48n and the section rows T),
d43/data/euclidean-basis.json (the integer basis B with B B^T = 96 G — itself extracted from wcgbg/sphere-packing @ a0bc7f51,
Copyright (c) 2026 Chengu Wang, MIT, the licence text carried inside the file), d45/data/gram.json (G), d45/data/compact.json
(T and W) and d45/data/parent.json (the basis with B B^T = 12 G). Original data under CC BY 4.0 per their RIGHTS.md; the
sha256 of parent-section.txt and gram.json equal their own constructions/sections/source-manifest.json. Read as data only:
tools/run-kissing-gram.py parses them; none of their programs is run or read.
