// Small regression checks for the guided explanation; no search or Lean build.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.join(__dirname, '..');
const {inspectWindow, inspectMoves} = require('../docs/proof-map.js');
const witness = JSON.parse(fs.readFileSync(path.join(root, 'witness.json')));
assert.deepEqual(inspectWindow(witness.word, 5, 9, 36).hits, [{day:44,task:5}]);
assert.equal(inspectWindow(witness.word, 5, 9, 35).hits.length, 0);
for (let task=0; task<6; task++) {
  for (let start=1; start<=36; start++) {
    assert.ok(inspectWindow(witness.word,task,start,witness.original[task]).hits.length);
  }
}
for (const limit of [32,35,36,40]) {
  const passing = Array.from({length:36},(_,i)=>inspectWindow(witness.word,5,i+1,limit))
    .filter(w=>w.hits.length).length;
  assert.equal(passing, Math.min(limit,36));
}
const compressed = fs.readFileSync(path.join(root,'docs/proof-35.json.gz'));
assert.deepEqual(compressed, fs.readFileSync(path.join(root,'unsched-35.json.gz')));
const certificate = JSON.parse(zlib.gunzipSync(compressed));
const lookup = new Map(certificate.states.map(r=>[r.slice(0,6).join(','),r]));
let state = lookup.get('0,0,0,0,0,0');
assert.equal(state[6],101);
// Inspect only the provided 101-step witness path and the exits along it.
for (const task of certificate.longest_prefix) {
  const options = inspectMoves(state,certificate.deadlines,lookup);
  for (const o of options) if (o.target) assert.ok(o.target[6]<state[6]);
  assert.ok(options[task].target);
  state=options[task].target;
}
assert.equal(state[6],0);
assert.deepEqual(state.slice(0,6),[0,3,4,12,6,1]);
const deadEnd=inspectMoves(state,certificate.deadlines,lookup);
assert.ok(deadEnd.every(o=>o.missed.length));
assert.deepEqual(deadEnd[1].missed,[2]); // Run B: C misses its deadline.
assert.deepEqual(deadEnd[2].missed,[1]); // Run C: B misses its deadline.
assert.throws(()=>inspectMoves([0,0,0,0,0,0,101],certificate.deadlines,new Map()),/missing/);
console.log('PASS: 216 witness windows, cycle boundary, limits 32/35/36/40, unchanged certificate, 101-step path, all dead-end choices, missing successor rejected.');
