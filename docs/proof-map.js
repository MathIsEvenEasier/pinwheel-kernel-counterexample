/* Explanatory grouping of the actual Lean lemmas. No proof search runs here. */
(() => {
  const root = document.getElementById('theorem-map');
  if (!root) return;
  const source = 'https://github.com/MathIsEvenEasier/pinwheel-kernel-counterexample/blob/f1053824f63b214a34c2f2c285d7a3dbae24b008/lean/';
  const nodes = [
    {id:'witness', title:'A cycle works for 36', short:'One witness is enough', formula:'Feasible(A₃₆)', deps:[], file:'Result.lean', line:22, lemma:'original_feasible',
      explanation:'We check every window starting at each of the 36 positions in the cycle. Periodicity extends this finite check to every day of the infinite schedule. This proves existence: one valid schedule is enough.',
      detail:'<div class="gap-proof">'+[3,4,5,20,22,36].map((n,i)=>`<div><span>${'ABCDEF'[i]}</span><div><i style="width:${n/36*100}%"></i></div><strong>${n}</strong></div>`).join('')+'</div><p class="map-caption">Maximum gaps, including the boundary between cycles. Each meets its corresponding limit.</p>',
      extra:[['Result.lean',17,'finite_windows']]},
    {id:'mono', title:'Larger periods are easier', short:'Direction matters', formula:'p ≤ q ⇒ Feasible(p) → Feasible(q)', deps:[], file:'Result.lean', line:33, lemma:'feasible_mono',
      explanation:'A larger period is a weaker requirement. If a task appears in every window of length p, it also appears in every longer window of length q. The same schedule works. Vector inequalities are componentwise.',
      detail:'<label class="map-slider">Change the period q of one task <output id="mono-value">7</output><input id="mono-limit" type="range" min="3" max="9" value="7"></label><div class="mono-slots" aria-label="The task appears every five days">'+Array.from({length:11},(_,i)=>`<span class="${i%5===0?'hit':''}">${i%5===0?'A':'·'}</span>`).join('')+'</div><p class="map-caption">Example: consecutive executions are 5 days apart.</p><p id="mono-verdict" class="map-verdict" role="status"></p>', extra:[]},
    {id:'impossible', title:'No schedule exists for 35', short:'Every continuation', formula:'¬ Feasible(A₃₅)', deps:[], file:'Result.lean', line:29, lemma:'infeasible_35',
      explanation:'Every valid schedule induces a legal path through task-age states. The certificate contains the initial state and every legal successor, with a rank that decreases at every step. An infinite path would require an infinite strictly decreasing sequence of natural numbers.',
      detail:'<div class="rank-proof"><span>The initial state belongs to the set</span><b>↓</b><span>Every legal successor belongs too</span><b>↓</b><span>The rank always decreases</span></div><div class="map-formula">101 &gt; r₁ &gt; r₂ &gt; … ≥ 0</div><p class="map-caption">This sequence must end. The certificate for 35 has 56,284 states and 107,847 transitions. It also rules out nonperiodic schedules.</p><p class="map-caption">The game below uses a separate certificate for 32. The formal threshold proof uses the stronger case of 35.</p>',
      extra:[['Pinwheel.lean',74,'window_implies_age'],['Pinwheel.lean',157,'certificate_excludes_schedule'],['Certificate.lean',1029,'Certificate.checked']]},
    {id:'threshold', title:'The exact threshold is 36', short:'Both directions', formula:'Feasible(A<sub>b</sub>) ⇔ b ≥ 36', deps:['witness','mono','impossible'], file:'Result.lean', line:41, lemma:'exact_threshold',
      explanation:'For b ≥ 36, keep the witness cycle and relax the last period. For b ≤ 35, any feasible schedule would also work for 35, contradicting the certificate. These two arguments cover every natural number b.',
      detail:'<label class="map-slider">Last period b <output id="threshold-value">36</output><input id="threshold-limit" type="range" min="28" max="42" value="36"></label><div class="threshold-strip">'+Array.from({length:15},(_,i)=>`<span data-bound="${i+28}" class="${i+28<36?'no':'yes'}">${i+28}</span>`).join('')+'</div><p id="threshold-verdict" class="map-verdict" role="status"></p><p class="map-caption">The other periods stay fixed: 3, 4, 5, 20, 22.</p>', extra:[]},
    {id:'kernel', title:'No dominated kernel ≤ 32', short:'Every candidate ruled out', formula:'¬ ∃ q ≤ A₃₆: (∀ i, qᵢ ≤ 32) ∧ Feasible(q)', deps:['threshold','mono'], file:'Result.lean', line:65, lemma:'no_dominated_kernel',
      explanation:'Every candidate q bounded by both A and 32 satisfies q ≤ min(A, 32) = A₃₂. If q had a valid schedule, the same schedule would work for A₃₂. The exact threshold of 36 rules this out. All candidates are excluded without enumerating them.',
      detail:'<label class="map-slider">Explore a proposed cap K <output id="kernel-value">32</output><input id="kernel-limit" type="range" min="28" max="40" value="32"></label><div class="kernel-vectors"><span>A</span><code>(3, 4, 5, 20, 22, 36)</code><span>q ≤ min(A, K)</span><code id="kernel-vector"></code></div><p id="kernel-verdict" class="map-verdict" role="status"></p><p class="map-caption">The conjecture requires K = 2⁵ = 32. The slider illustrates the threshold for this one instance; it does not establish a universal cap.</p>',
      extra:[['Result.lean',55,'capped_infeasible']]},
    {id:'result', title:'Counterexample', short:'Conjecture 2.3 is false', formula:'Feasible(A₃₆) ∧ no required kernel', deps:['witness','kernel'], file:'Result.lean', line:76, lemma:'kernel_counterexample',
      explanation:'The conjecture requires a suitable kernel for every feasible instance. We have one feasible instance and a proof that none of its required kernels exist. This suffices to refute the universal statement.',
      detail:'<div class="conclusion-pair"><div><b>✓</b><strong>A has a valid schedule</strong><span>an explicit 36-slot cycle</span></div><span class="conjunction">∧</span><div><b>∅</b><strong>No required kernel exists</strong><span>every candidate capped at 32 is excluded</span></div></div><p class="map-caption">This does not show that 36 is sufficient for every six-task instance.</p>', extra:[]}
  ];
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
  const paths = [
    ['witness','threshold','M 120 96 V 118 Q 120 128 132 128 H 335 Q 360 128 360 144'],
    ['mono','threshold','M 360 96 V 144'],
    ['impossible','threshold','M 600 96 V 118 Q 600 128 588 128 H 385 Q 360 128 360 144'],
    ['threshold','kernel','M 360 240 V 288'],
    ['mono','kernel','M 460 48 H 484 Q 500 48 500 64 V 320 Q 500 336 484 336 H 460'],
    ['witness','result','M 120 96 V 464 Q 120 480 136 480 H 260'],
    ['kernel','result','M 360 384 V 432']
  ];
  root.innerHTML = `<div class="map-layout"><div><div class="proof-graph" role="group" aria-label="Proof steps. Select a theorem to explore its premises."><svg viewBox="0 0 720 528" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>${paths.map(([from,to,d])=>`<path data-from="${from}" data-to="${to}" d="${d}" marker-end="url(#map-arrow)"/>`).join('')}</svg>${nodes.map((n,i)=>`<button class="theorem-node node-${n.id}" data-node="${n.id}" aria-controls="theorem-detail" aria-pressed="false"><small>${String(i+1).padStart(2,'0')} / ${n.short}</small><strong>${n.title}</strong></button>`).join('')}</div><p class="map-caption map-legend">Arrow: premise → conclusion. Highlighting shows the premises of the selected step. This groups the main lemmas; it is not the full graph of 6,850 declarations.</p></div><div class="theorem-detail" id="theorem-detail" role="region" aria-label="Explanation of the selected theorem"></div></div>`;

  function needed(id, out=new Set()) { out.add(id); byId[id].deps.forEach(d=>needed(d,out)); return out; }
  function sourceLink(file,line,label) { return `<a href="${source}${file}#L${line}" target="_blank" rel="noopener">${label} ↗</a>`; }
  function updateBound(kind) {
    const value = Number(document.getElementById(`${kind}-limit`).value);
    document.getElementById(`${kind}-value`).value = value;
    const verdict = document.getElementById(`${kind}-verdict`);
    let good;
    if(kind==='mono') {
      good = value>=5;
      verdict.textContent = good ? `5 ≤ ${value}: the same five-day rhythm also meets the limit of ${value}.` : `${value} < 5: this rhythm fails the tighter limit. The theorem does not reverse the arrow; a different, more frequent rhythm may still work.`;
    } else if(kind==='threshold') {
      good = value>=36;
      verdict.textContent = good ? `${value} ≥ 36 — feasible. ${value===36?'The explicit cycle works.':'The same cycle works because the limit is weaker.'}` : `${value} ≤ 35 — infeasible. Any such schedule would also work for 35, contradicting the certificate.`;
      root.querySelectorAll('[data-bound]').forEach(e=>e.classList.toggle('chosen',Number(e.dataset.bound)===value));
    } else {
      good = value>=36;
      document.getElementById('kernel-vector').textContent = `(3, 4, 5, 20, 22, ${Math.min(36,value)})`;
      verdict.textContent = good ? `For K = ${value}, this instance has a candidate: q = A. This does not prove K is sufficient for other instances.` : `For K = ${value}, even min(A, K) is infeasible. Every smaller q is excluded too. ${value===32?'This is the cap required by the conjecture.':''}`;
    }
    verdict.classList.toggle('negative',!good);
  }
  function select(id) {
    const n=byId[id], all=needed(id), index=nodes.indexOf(n);
    root.querySelectorAll('[data-node]').forEach(el=>{el.classList.toggle('selected',el.dataset.node===id);el.classList.toggle('needed',all.has(el.dataset.node));el.setAttribute('aria-pressed',String(el.dataset.node===id));});
    root.querySelectorAll('svg > path').forEach(el=>el.classList.toggle('needed',all.has(el.dataset.to)&&all.has(el.dataset.from)));
    const detail=document.getElementById('theorem-detail');
    detail.innerHTML=`<p class="eyebrow">STEP ${index+1} / ${nodes.length}</p><h3>${n.title}</h3><div class="map-formula">${n.formula}</div><p>${n.explanation}</p>${n.detail}<div class="map-dependencies"><span>Depends on:</span> ${n.deps.length?n.deps.map(d=>`<button data-jump="${d}">${byId[d].title}</button>`).join(''):'<span>the construction or foundational lemma described above</span>'}</div><details><summary>Corresponding Lean statements</summary><div class="lean-links">${sourceLink(n.file,n.line,n.lemma)}${n.extra.map(x=>sourceLink(...x)).join('')}</div></details><div class="map-navigation"><button data-step="${index-1}" ${index===0?'disabled':''}>← Previous</button><button data-step="${index+1}" ${index===nodes.length-1?'disabled':''}>Next →</button></div>`;
    if(['mono','threshold','kernel'].includes(id)) updateBound(id);
  }
  root.addEventListener('click',e=>{
    const node=e.target.closest('[data-node]'), jump=e.target.closest('[data-jump]'), step=e.target.closest('[data-step]');
    if(node) select(node.dataset.node);
    if(jump) {select(jump.dataset.jump); root.querySelector(`[data-node="${jump.dataset.jump}"]`).focus({preventScroll:true});}
    if(step) {const id=nodes[Number(step.dataset.step)].id;select(id);root.querySelector(`[data-node="${id}"]`).focus({preventScroll:true});}
  });
  root.addEventListener('input',e=>{if(e.target.matches('input[type="range"]'))updateBound(e.target.id.replace('-limit',''));});
  select('threshold');
})();
