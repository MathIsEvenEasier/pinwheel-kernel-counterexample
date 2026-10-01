# Website maintenance

`node scripts/check_site.cjs` checks the real JavaScript verifier and schedule
evaluator. `python3 scripts/rebuild_download.py` refreshes the public proof
archive. Full Lean and Nanoda runs belong on the bounded Azure worker.
