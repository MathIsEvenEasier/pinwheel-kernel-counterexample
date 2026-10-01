"""Small, independent proof-certificate checker. No solver is trusted/imported.

Checks all cyclic windows in the positive witness, and verifies a strictly
decreasing nonnegative rank on EVERY legal successor of EVERY stored state.
Forward closure and inclusion of the all-zero initial state certify that no
infinite schedule exists. This works with python -O as well.
"""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import time

HERE = Path(__file__).resolve().parent
EXPECTED = [3, 4, 5, 20, 22, 36]


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def ints(xs, length, lower=0):
    return isinstance(xs, list) and len(xs) == length and all(type(x) is int and x >= lower for x in xs)


def check_word(witness):
    require(witness.get("schema") == "pinwheel-counterexample-v1", "witness schema")
    require(witness["original"] == EXPECTED and witness["cap"] == 32, "wrong conjecture instance")
    word = witness["word"]
    require(ints(word, 36) and max(word) < 6, "positive word alphabet/length")
    checked_windows = 0
    for task, deadline in enumerate(EXPECTED):
        for start in range(len(word)):
            require(any(word[(start+offset) % len(word)] == task for offset in range(deadline)),
                    f"missing task {task} in cyclic window beginning at {start}")
            checked_windows += 1
    gaps = []
    positions = []
    for task in range(6):
        indices = [i for i, value in enumerate(word) if value == task]
        positions.append(indices)
        closed = indices + [indices[0] + len(word)]
        gaps.append(max(y-x for x, y in zip(closed, closed[1:])))
    require(gaps == EXPECTED, "unexpected exact cyclic gaps")
    return {"period_length": len(word), "maximum_gaps": gaps,
            "cyclic_windows_checked": checked_windows, "positions_zero_based": positions}


def check_negative(data, expected_deadlines):
    require(data.get("schema") == "pinwheel-strict-rank-v1", "rank schema")
    require(data["deadlines"] == expected_deadlines, "wrong negative instance")
    require(data["initial_state"] == [0]*6, "wrong initial state")
    ranks = {}
    for row in data["states"]:
        require(ints(row, 7), "bad state/rank row")
        state, rank = tuple(row[:6]), row[6]
        require(state not in ranks, "duplicate state")
        require(all(age < deadline for age, deadline in zip(state, expected_deadlines)), "invalid age")
        ranks[state] = rank
    require((0,)*6 in ranks, "initial state absent")
    checked_edges = 0
    maximum_rank = max(ranks.values())
    for state, rank in ranks.items():
        # Use lists and coordinate updates; not the producer's tuple comprehension.
        incremented = [age+1 for age in state]
        child_ranks = []
        for task in range(6):
            after = incremented.copy()
            after[task] = 0
            legal = True
            for i in range(6):
                if after[i] >= expected_deadlines[i]:
                    legal = False
                    break
            if not legal:
                continue
            successor = tuple(after)
            require(successor in ranks, "missing legal successor: certificate not closed")
            require(ranks[successor] < rank, "rank fails to decrease on a legal move")
            child_ranks.append(ranks[successor])
            checked_edges += 1
        # Stronger than needed for infeasibility: certify exact longest-path values.
        require(rank == (1 + max(child_ranks) if child_ranks else 0), "nonexact longest-path rank")
    path = data["longest_prefix"]
    require(ints(path, ranks[(0,)*6]) and max(path, default=0) < 6, "bad longest prefix")
    ages = [0]*6
    for action in path:
        ages = [x+1 for x in ages]
        ages[action] = 0
        require(all(age < deadline for age, deadline in zip(ages, expected_deadlines)), "invalid finite witness")
    return {"deadlines": expected_deadlines, "states": len(ranks), "edges": checked_edges,
            "initial_rank": ranks[(0,)*6], "maximum_rank": maximum_rank,
            "rank_histogram": dict(sorted(Counter(ranks.values()).items()))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    started = time.monotonic()
    witness = json.loads((HERE / "witness.json").read_text())
    positive = check_word(witness)
    negative = []
    hashes = {}
    for bound in (32, 35):
        path = HERE / f"unsched-{bound}.json.gz"
        payload = path.read_bytes()
        hashes[path.name] = hashlib.sha256(payload).hexdigest()
        data = json.loads(gzip.decompress(payload))
        negative.append(check_negative(data, EXPECTED[:-1]+[bound]))
    hashes["witness.json"] = hashlib.sha256((HERE / "witness.json").read_bytes()).hexdigest()
    report = {"status": "PASS", "result": "six-task kernel conjecture refuted",
              "original": EXPECTED, "capped": [min(a, 32) for a in EXPECTED],
              "exact_minimum_sixth_deadline_for_fixed_prefix": 36,
              "positive": positive, "negative": negative, "sha256": hashes,
              "formal_proof_assistant": False,
              "seconds": round(time.monotonic()-started, 6)}
    rendered = json.dumps(report, indent=2) + "\n"
    if args.report:
        args.report.write_text(rendered)
    print(json.dumps({k: v for k, v in report.items() if k != "negative"}, indent=2))
    for case in negative:
        print(json.dumps({k: v for k, v in case.items() if k != "rank_histogram"}))


if __name__ == "__main__":
    main()
