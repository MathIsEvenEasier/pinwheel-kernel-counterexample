"""Generate bounded Lean proof modules; generation itself does not prove anything."""
import gzip
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def generate(source, destination, chunk_size=255):
    raw = Path(source).read_bytes()
    if hashlib.sha256(raw).hexdigest() != '0d9ed9488d7f0153a622e436aad78afe2bfa28e96e9ab683f54be6e432fe3ae2':
        raise ValueError('Unexpected certificate SHA-256')
    rows = json.loads(gzip.decompress(raw))['states']
    def key(row):
        n = 0
        for x in row[:6]: n = 40*n+x
        return n
    rows.sort(key=key)
    destination = Path(destination)
    destination.mkdir(exist_ok=True)
    definitions, nodes = [], {}
    def tree(xs):
        if not xs: return 'Tree.empty'
        mid = len(xs)//2
        left, right = tree(xs[:mid]), tree(xs[mid+1:])
        state = '⟨'+','.join(map(str,xs[mid][:6]))+'⟩'
        rank = xs[mid][6]
        term = f'(Tree.node {left} {state} {rank} {right})'
        if len(xs) <= 15: return term
        name = f't{len(definitions)}'
        definitions.append(f'def {name} : Tree := {term}')
        nodes[name] = (left, state, rank, right, len(xs))
        return name
    root = tree(rows)
    header = 'import Pinwheel\nset_option maxRecDepth 100000\nset_option maxHeartbeats 0\nnamespace Pinwheel.Certificate\n'
    (destination/'CertificateData.lean').write_text(header+'\n'.join(definitions)+f'\ndef cert : Tree := {root}\nend Pinwheel.Certificate\n')
    chunks, proofs = [], []
    def prove(name):
        left, state, rank, right, size = nodes[name]
        if size <= chunk_size:
            module = f'CertificatePart{len(chunks):03}'
            theorem = f'checked_{name}'
            body = f'theorem {theorem} : checkTree 35 cert {name} = true := by decide +kernel\n'
            chunks.append(module)
            (destination/(module+'.lean')).write_text(header.replace('import Pinwheel','import CertificateData')+body+'end Pinwheel.Certificate\n')
            return theorem
        hl, hr = prove(left), prove(right)
        theorem = f'checked_{name}'
        proofs.append(f'theorem {theorem} : checkTree 35 cert {name} = true :=\n  checked_node {hl} (by decide +kernel) {hr}\n')
        return theorem
    root_proof = prove(root)
    helper = '''theorem checked_node {b : Nat} {whole l r : Tree} {s : State} {rank : Nat}
    (hl : checkTree b whole l = true) (hm : checkRow b whole s rank = true)
    (hr : checkTree b whole r = true) : checkTree b whole (.node l s rank r) = true := by
  simp only [checkTree, hl, hm, hr, Bool.and_self]
'''
    text = '\n'.join('import '+c for c in chunks)+'\n'+header.split('\n',1)[1]
    text += helper+'\n'.join(proofs)+f'\ntheorem checked : checkTree 35 cert cert = true := {root_proof}\n'
    text += 'theorem initial : lookup cert zero = some 101 := by decide +kernel\nend Pinwheel.Certificate\n'
    (destination/'Certificate.lean').write_text(text)
    modules = ['Pinwheel', 'CertificateData', *chunks, 'Certificate', 'Result']
    (destination/'modules.json').write_text(json.dumps(modules,indent=2)+'\n')
    return {'states':len(rows),'chunks':len(chunks),'modules':len(modules),'chunk_size':chunk_size}

if __name__ == '__main__':
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument('--source',type=Path,default=HERE.parent/'unsched-35.json.gz')
    p.add_argument('--destination',type=Path,default=HERE)
    p.add_argument('--chunk-size',type=int,default=255)
    args=p.parse_args()
    if args.chunk_size < 32: p.error('chunk-size must be at least 32')
    print(json.dumps(generate(args.source,args.destination,args.chunk_size)))
