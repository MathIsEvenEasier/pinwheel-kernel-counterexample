# Interactive Pinwheel Lab

This directory is the GitHub Pages publication root. The HTML, CSS, JavaScript,
and certificate data are static files. The mathematical evidence download is
in `downloads/pinwheel-proof.zip`.

The guided proof uses `proof-35.json.gz`, an unchanged copy of the verified
certificate `unsched-35.json.gz`. It decompresses this file on demand, then
looks up legal successors for the state being inspected. It performs no search.
The separate game and browser verifier use `proof.json` for the cap of 32.
