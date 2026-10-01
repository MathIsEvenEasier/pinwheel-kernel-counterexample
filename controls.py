"""Adversarial checks that altered certificates are rejected."""
import copy
import gzip
import json
from pathlib import Path

from check_counterexample import check_negative, check_word

HERE = Path(__file__).resolve().parent


def rejected(name, fn):
    try:
        fn()
    except ValueError as error:
        return {"control": name, "status": "REJECTED_AS_REQUIRED", "reason": str(error)}
    raise RuntimeError(f"Corrupted evidence was accepted: {name}")


def main():
    witness = json.loads((HERE / "witness.json").read_text())
    negative = json.loads(gzip.decompress((HERE / "unsched-32.json.gz").read_bytes()))
    expected = [3, 4, 5, 20, 22, 32]
    results = []

    corrupted = copy.deepcopy(witness)
    corrupted["word"][corrupted["word"].index(5)] = 0
    results.append(rejected("remove sole F from positive word", lambda: check_word(corrupted)))

    corrupted = copy.deepcopy(negative)
    corrupted["states"] = [row for row in corrupted["states"] if row[:6] != [0]*6]
    results.append(rejected("remove initial state", lambda: check_negative(corrupted, expected)))

    corrupted = copy.deepcopy(negative)
    del corrupted["states"][1]
    results.append(rejected("remove a legal successor", lambda: check_negative(corrupted, expected)))

    corrupted = copy.deepcopy(negative)
    corrupted["states"][0][-1] = 0
    results.append(rejected("make initial rank zero", lambda: check_negative(corrupted, expected)))

    corrupted = copy.deepcopy(negative)
    corrupted["deadlines"][-1] = 36
    results.append(rejected("substitute a different problem", lambda: check_negative(corrupted, expected)))

    report = {"status": "PASS", "controls": results}
    rendered = json.dumps(report, indent=2) + "\n"
    (HERE / "controls-report.json").write_text(rendered)
    print(rendered, end="")


if __name__ == "__main__":
    main()
