# A six-task counterexample to the Pinwheel Kernel Conjecture

**Evidence package updated 2026-10-01.**

The pinwheel instance `(3,4,5,20,22,36)` is feasible, while
`(3,4,5,20,22,32)` is not. For these fixed first five periods,
`(3,4,5,20,22,b)` is feasible if and only if `b >= 36`.

This refutes Conjecture 2.3 (the Kernel Conjecture) in
Gąsieniec, Smith and Wild, *Towards the 5/6-Density Conjecture of Pinwheel
Scheduling* (2021 preprint; ALENEX 2022):
https://arxiv.org/abs/2111.01784
The result bounds any universal six-task cap from below by 36; it does not
show that 36 is a sufficient universal cap.

By [Proposition 2.4 of the same paper](https://arxiv.org/html/2111.01784#S2.SS1),
this also refutes Conjecture 2.2, the **2^k Conjecture**: the claim that every
loosely schedulable k-task instance admits a schedule with a holiday at
least every 2^k days. Here a holiday is a day on which no task is executed.

The consequence can be seen directly for the five-task instance
`(3,4,5,20,22)`. Deleting task 6 from our periodic witness gives a valid
schedule with holidays. If there were a schedule with a holiday in every
32-day window (`2^5 = 32`), filling those holidays with task 6 would solve
`(3,4,5,20,22,32)`, contradicting the existing infeasibility certificate.
This is a mathematical consequence of the supplied witness and certificate;
it is not a separately formalized Lean endpoint.

## Definition and argument

A schedule selects one of the six tasks in each integer time slot. A task
with period a must appear in every a consecutive slots. The 36-slot word in
`witness.json`, repeated forever, has maximum cyclic gaps exactly
`(3,4,5,20,22,36)`.

For each infeasible instance, states contain six nonnegative ages. Initially
all ages are zero, which optimistically treats all tasks as freshly executed.
Selecting a task resets its age to zero and increments the other ages.
A move is legal when all resulting ages are smaller than their periods.
Any schedule satisfying the window constraints induces only legal moves
from this optimistic initial state; this implication is proved in Lean.

Each negative certificate contains the initial state, every legal successor
of every stored state, and a natural-number rank strictly decreasing along
every legal move. An infinite schedule would give an infinite strictly
decreasing sequence of natural numbers, which is impossible. This excludes
nonperiodic schedules as well as periodic schedules.

The period-35 certificate has 56,284 states and 107,847 legal transitions.
The period-32 certificate has 50,881 states and 97,140 legal transitions.
Monotonicity in the periods establishes the exact threshold 36 and rules out
any feasible vector dominated by `(3,4,5,20,22,36)` whose entries are all at
most `2^(6-1) = 32`. Such a vector would also yield a feasible schedule for
`(3,4,5,20,22,32)`, contradicting the certificate.

## Check the finite certificates

Python 3, standard library only, from this directory:

```sh
python3 check_counterexample.py
python3 -O check_counterexample.py
python3 controls.py
```

The checker imports no producer/search code. The control program tests five
corrupted certificates. Included JSON reports record the completed checks.
The checker is a separate implementation, not independent expert review.
Regenerating the certificates using `produce_counterexample.py` is optional
and is not necessary for checking the result.

## Lean proof and trust boundary

All 260 Lean modules are supplied, including generated certificate modules.
`lean/Result.lean` contains `Pinwheel.exact_threshold` and
`Pinwheel.kernel_counterexample`; `lean/Pinwheel.lean` defines infinite
schedules and proves the soundness of the finite certificate argument.

The full build passed in Azure on 2026-10-01 with official Lean 4.34.1,
standard library only, using `decide +kernel` for certificate conditions.
The source hashes match the completed build report
`lean/verification-azure.json`. The four audited endpoint theorems depend
only on `propext` and `Quot.sound`; see `lean/axioms-azure.log`.
There are no custom axioms, sorry/admit, unsafe declarations, native_decide,
or modifications to the kernel in this project. Lean also rejected the
bad initial-rank control in `lean/corruption-control-azure.log`.
No independent audit of the formal statement or peer review is claimed.
Nanoda independently replayed the four endpoint theorems and their transitive
dependencies on 2026-10-01: 6,850 declarations passed, with only `propext` and
`Quot.sound` admitted. A deliberately corrupted proof was rejected. The
checker source was unmodified. See `nanoda/README.md` and its pinned reports
and export. Both Azure runs completed and their temporary resources were removed. The trusted computing base includes the standard Lean kernel
and its standard axioms.

To reproduce the full build, use a Linux worker with resource and time
limits and install the official Lean version pinned in
`lean/lean-toolchain`. The release URL and SHA-256 are in
`lean/linux-release.json`. The recorded Azure run compiled sequentially
with one thread, a 22 GiB OS address-space limit, a 24 GiB service limit,
a 120-second timeout per module, and a 30-minute overall driver limit; it
took 460.135 seconds. Its temporary Azure resources were removed afterward.

From `lean/`, with the official `lean` executable on PATH, this is the module
order and command sequence used for the proof (run within the resource-limited
Azure worker):

```sh
export LEAN_PATH="$PWD"
timeout 30m python3 - <<'CHECK'
import json, resource, subprocess
resource.setrlimit(resource.RLIMIT_AS, (22 * 1024**3, 22 * 1024**3))
for module in json.load(open('modules.json')):
    subprocess.run([
        'lean', '-j1', '-M18000', '-DwarningAsError=true', '-DElab.async=false',
        '-o', module + '.olean', module + '.lean'
    ], check=True, timeout=120)
CHECK
```

The build report records the run described above. The package contains
source files; reproducing the build regenerates the compiled `.olean` files. `lean/generate_certificate.py` can regenerate the certificate source
modules from `unsched-35.json.gz` if desired, but generation is not trusted
as a proof. Lean checks the resulting certificate.

## Practical use

Capping the six periods at 32 is not sound feasibility-preserving
preprocessing: it can make a feasible instance infeasible. This tuple is a
small, certified regression test for pinwheel scheduling implementations.

## Provenance and scope of review

OpenAI Codex (GPT-6 Astra) discovered the example,
implemented the searches, certificates and separate checker, and developed
the formalization under human direction. The human set the objective,
supervised the workflow, and requested prior-work and formal checks.
Discovery and finite-certificate verification: 2026-09-30.
Completed Lean verification: 2026-10-01.

A bounded prior-work search found no earlier refutation. It included the
original paper, the authors' repository, Benjamin Smith's 2025 thesis,
related GitHub material, Google-indexed X results, and VibeMathed. This does
not establish priority or exhaust the literature. Original references:

- https://arxiv.org/abs/2111.01784
- https://github.com/roarin-roran/Towards-the-5-over-6-Density-Conjecture-of-Pinwheel-Scheduling
- https://livrepository.liverpool.ac.uk/3194461/1/201381305_Aug2025.pdf

`SHA256SUMS` lists every other file in this evidence package. The package
contains proof sources, certificates, checkers, and verification reports;
no cloud account configuration or cached third-party papers are included.

## Acknowledgments

Research inspired by @xamualexander, Dr. Samuel Allen Alexander. Still there.

## Interactive website

`docs/` contains the interactive site:
an editable 36-slot schedule, deadline controls, a finite-state game, and a
JavaScript certificate verifier running in a Web Worker. A four-step guided
proof shows actual sliding windows in the witness, all six choices at a state
of the certificate for 35, and why every candidate capped at 32 would imply a
schedule that the certificate excludes. Readers can inspect deadline conflicts,
change candidate periods, and follow links to the verified Lean statements.
The exact-threshold argument is available as an additional explanation.

Live site: https://mathiseveneasier.github.io/pinwheel-kernel-counterexample/

All asset references
are relative, so GitHub Pages project URLs work without a custom domain.
No account, API key, backend, or AI service is needed by website visitors.

Local preview (lightweight):

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Website logic checks: `node scripts/check_site.cjs` and
`node scripts/check_tour.cjs`. The second checks the guided proof against the
existing witness and certificate; it does not rerun the proof search.
To update the downloadable proof package, run `python3 scripts/rebuild_download.py`.

This repository is published as `MathIsEvenEasier/pinwheel-kernel-counterexample`.
The static website uses GitHub Pages from the `main` branch and `/docs` folder.
