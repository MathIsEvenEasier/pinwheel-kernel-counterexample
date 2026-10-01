"""Reproduce the negative certificates by BFS and topological elimination.

Python standard library only. The independent checker does not import this file.
"""
from collections import deque
import gzip
import hashlib
import json
from pathlib import Path
import time

HERE = Path(__file__).resolve().parent
ORIGINAL = [3, 4, 5, 20, 22, 36]
WORD = [0, 2, 1, 0, 1, 2, 0, 5, 1, 0, 2, 0,
        1, 3, 0, 2, 1, 0, 1, 2, 0, 4, 1, 0,
        2, 0, 1, 2, 0, 3, 1, 0, 2, 0, 1, 4]


def produce(deadlines):
    started = time.monotonic()
    initial = (0,) * len(deadlines)
    states, identifiers, graph, indegrees = [initial], {initial: 0}, [], [0]
    for state in states:
        outgoing = []
        for task in range(len(deadlines)):
            after = tuple(0 if i == task else age+1 for i, age in enumerate(state))
            if any(age >= deadline for age, deadline in zip(after, deadlines)):
                continue
            if after not in identifiers:
                identifiers[after] = len(states)
                states.append(after)
                indegrees.append(0)
            destination = identifiers[after]
            outgoing.append(destination)
            indegrees[destination] += 1
        graph.append(outgoing)
    queue = deque(i for i, degree in enumerate(indegrees) if degree == 0)
    order = []
    while queue:
        source = queue.popleft()
        order.append(source)
        for destination in graph[source]:
            indegrees[destination] -= 1
            if indegrees[destination] == 0:
                queue.append(destination)
    if len(order) != len(states):
        raise RuntimeError(f"Directed cycle exists for {deadlines}; no negative certificate")
    ranks = [0] * len(states)
    for source in reversed(order):
        ranks[source] = max((ranks[destination]+1 for destination in graph[source]), default=0)
    # Include a longest finite word to check sharpness of the transient length.
    longest_word, source = [], 0
    while ranks[source]:
        destination = next(v for v in graph[source] if ranks[v]+1 == ranks[source])
        action = next(i for i, age in enumerate(states[destination]) if age == 0)
        longest_word.append(action)
        source = destination
    certificate = {
        "schema": "pinwheel-strict-rank-v1",
        "deadlines": deadlines,
        "initial_state": list(initial),
        "states": [list(state) + [rank] for state, rank in zip(states, ranks)],
        "longest_prefix": longest_word,
    }
    contents = (json.dumps(certificate, separators=(",", ":")) + "\n").encode()
    path = HERE / f"unsched-{deadlines[-1]}.json.gz"
    path.write_bytes(gzip.compress(contents, mtime=0))
    return {
        "deadlines": deadlines, "states": len(states),
        "edges": sum(map(len, graph)), "maximum_prefix_length": ranks[0],
        "certificate": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "seconds": round(time.monotonic()-started, 6),
    }


def main():
    witness = {"schema": "pinwheel-counterexample-v1", "original": ORIGINAL,
               "cap": 32, "word": WORD, "task_labels": "ABCDEF"}
    (HERE / "witness.json").write_text(json.dumps(witness, indent=2) + "\n")
    report = {
        "method": "BFS with tuple ages; Kahn topological elimination; longest-path ranks",
        "cases": [produce(ORIGINAL[:-1]+[bound]) for bound in (32, 35)],
    }
    rendered = json.dumps(report, indent=2) + "\n"
    (HERE / "production-report.json").write_text(rendered)
    print(rendered, end="")


if __name__ == "__main__":
    main()
