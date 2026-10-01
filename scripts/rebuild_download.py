"""Package the explicit public proof files for the static website."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
paths=[root/p for p in ["README.md","check_counterexample.py","produce_counterexample.py","controls.py","witness.json","unsched-32.json.gz","unsched-35.json.gz","verification-report.json","controls-report.json","verification-optimized-python.json","production-report.json"]]
paths += [p for p in (root/"lean").iterdir() if p.is_file() and p.suffix in {".lean",".py",".json",".log",".md"}]
paths += [root/"lean/lean-toolchain"]
if (root/"nanoda").is_dir():
    paths += [p for p in (root/"nanoda").iterdir() if p.is_file() and p.suffix in {".py",".json",".log",".gz",".md",".ndjson"}]
out=root/"docs/downloads/pinwheel-proof.zip"
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(set(paths)):
        archive.write(p,p.relative_to(root))
print(f"Packaged {len(set(paths))} selected public files.")
