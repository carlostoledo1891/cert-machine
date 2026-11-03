# The Verify Seal registry

`registry.jsonl` is append-only: one line per digest, `{"digest": "<64 hex>", "posted": "<YYYY-MM-DD>", "issue": <n>}`,
added by the maintainer in one commit per digest. The commit's date is the public anchor; the digest is the only thing
anyone learns. A seal's owner records that commit in the bundle's `anchors.json` and `seal.py open --registry <clone>`
reads it back. Post a digest with the issue form "Register a Verify Seal digest"; a line that is not exactly 64 lowercase
hex characters is refused by `tools/seal-registry.py` before anything is committed.

Nothing here is a judgement about any idea. See instruments/seal/README.md for the commitment and the threat model.
