# Independent Nanoda replay — PASS

Nanoda checked 6,850 declarations on 2026-10-01, including the complete
transitive dependency closure of these four endpoints:

- `Pinwheel.original_feasible`
- `Pinwheel.infeasible_35`
- `Pinwheel.exact_threshold`
- `Pinwheel.kernel_counterexample`

The only exported axioms are `propext` and `Quot.sound`. The configuration
rejects every other axiom, and the export scan found no unsafe or partial
declarations. The upstream Nanoda source was not modified. A valid small
control proof passed; changing its claimed type from True to False caused
Nanoda to reject it with a definitional-equality assertion failure.

The audit ran in Azure with memory/time limits and an independent deletion
guard. Nanoda itself took 342.712 seconds. All temporary cloud resources were
confirmed deleted at 2026-10-01T07:23:51Z. No cloud credentials or account
configuration are included here.

## Check the supplied export

The proof export is NDJSON compressed with gzip. In an appropriately bounded
Azure Linux worker, build the pinned Nanoda source:

```sh
git clone https://github.com/ammkrn/nanoda_lib.git nanoda-checker
git -C nanoda-checker checkout 3a2407216ee84a75f9e1aead6803d0578be06ae7
cargo +1.97.1 build --manifest-path nanoda-checker/Cargo.toml --release --locked
```

From this evidence directory, with that binary's path substituted:

```sh
gzip -dk nanoda-proof-export.ndjson.gz
ulimit -s 524288
timeout 20m /path/to/nanoda-checker/target/release/nanoda_bin nanoda-proof-config.json
```

Use the same worker memory limit as the original audit (24 GiB service cap;
22 GiB address-space cap). The main-thread stack limit is an execution
resource and does not change the checker or logical rules.

The final line must report `Checked 6850 declarations with no errors`.
The `_` symbols in `nanoda-proof-check.log` are only the pretty-printer's
`proofs: false` setting: the actual export contains the proof terms that
Nanoda checked. They are not proof holes.

To regenerate the export from source, first build all Lean modules using the
repository README. Build `leanprover/lean4export` at commit
`076e8e57707e813375e8f9da8bf989799ace9680`, setting its `lean-toolchain` to
`leanprover/lean4:v4.34.1`; this was the only exporter source-tree change.
From the repository's `lean/` directory:

```sh
export LEAN_PATH="$PWD"
/path/to/lean4export Result -- Pinwheel.original_feasible Pinwheel.infeasible_35 Pinwheel.exact_threshold Pinwheel.kernel_counterexample > ../nanoda/nanoda-proof-export.ndjson
```

`verification-azure.json` records the fresh 260-module build, their source
hashes, the Lean axiom audit, and Nanoda's result. `nanoda-report.json` records
tool revisions, tool hashes, the export hash, and the strict checker
configuration. `run_nanoda.py` is the audit routine used by the bounded Azure
driver; it requires that driver rather than being a standalone local command.

This checks proof validity using an independently implemented kernel. It does
not constitute an independent human audit of how the formal statement matches
the published Kernel Conjecture, peer review, or a guarantee of priority.
