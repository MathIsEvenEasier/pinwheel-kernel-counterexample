// Lightweight checks of the real worker and the schedule evaluator, without a browser.
const vm=require('node:vm');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..','docs');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const evaluator=app.slice(app.indexOf('function evaluateWord'),app.indexOf('function renderWord'));
const evalContext={letters:'ABCDEF'};
vm.createContext(evalContext);
vm.runInContext(evaluator,evalContext);
const original=JSON.parse(app.match(/const original=(\[[^;]+\]);/)[1]);
const periods=[3,4,5,20,22,36];
assert.equal(JSON.stringify(evalContext.evaluateWord(original,periods).map(x=>x.max)),JSON.stringify(periods));
assert.equal(evalContext.evaluateWord(original,[3,4,5,20,22,32]).filter(x=>x.max>x.limit).length,1);
const changed=original.map(x=>x===5?0:x);
assert.equal(evalContext.evaluateWord(changed,periods)[5].max,Infinity);
let messages=[];
const worker={postMessage:x=>messages.push(x)};
worker.self=worker;
vm.createContext(worker);
vm.runInContext(fs.readFileSync(path.join(root,'verify-worker.js'),'utf8'),worker);
const proof=JSON.parse(fs.readFileSync(path.join(root,'proof.json'),'utf8'));
worker.onmessage({data:proof});
assert.equal(messages.at(-1).ok,true);
assert.equal(messages.at(-1).states,50881);
assert.equal(messages.at(-1).edges,97140);
const rank=proof.rows[0][6];
proof.rows[0][6]=0;messages=[];worker.onmessage({data:proof});
assert.equal(messages.at(-1).ok,false);
proof.rows[0][6]=rank;
let state=proof.initial,steps=0;
while(proof.rows[state][6]>0){
  const options=proof.rows[state].slice(7).filter(x=>x>=0);
  state=options.reduce((a,b)=>proof.rows[a][6]>=proof.rows[b][6]?a:b);
  assert.ok(++steps<=99);
}
assert.equal(steps,99);
assert.ok(proof.rows[state].slice(7).every(x=>x<0));
console.log(JSON.stringify({status:'PASS',cyclicGaps:periods,states:50881,edges:97140,
  corruptedRankRejected:true,optimalLegalPrefix:steps,browserRenderingTested:false}));
