/* A guided explanation using the witness and the existing, verified certificate.
   Browser interaction is explanatory; the linked Lean proof remains authoritative. */
(() => {
  const labels = 'ABCDEF';
  function inspectWindow(word, task, start, length) {
    const days = Array.from({length}, (_, offset) => ({day:start+offset, task:word[(start+offset-1)%word.length]}));
    return {days, hits:days.filter(d=>d.task===task)};
  }
  function inspectMoves(row, limits, lookup) {
    return Array.from({length:6}, (_, task) => {
      const next = row.slice(0,6).map((age,i)=>i===task?0:age+1);
      const missed = next.flatMap((age,i)=>age>=limits[i]?[i]:[]);
      const target = missed.length ? null : lookup.get(next.join(','));
      if (!missed.length && !target) throw Error('A legal successor is missing from the certificate.');
      return {task, next, missed, target};
    });
  }
  if (typeof module==='object' && module.exports) {
    module.exports={inspectWindow,inspectMoves};
    return;
  }
  const root=document.getElementById('theorem-map');
  if (!root) return;
  const witness=[...original];
  const limits=[3,4,5,20,22,36], cap=[3,4,5,20,22,32];
  const source='https://github.com/MathIsEvenEasier/pinwheel-kernel-counterexample/blob/f1053824f63b214a34c2f2c285d7a3dbae24b008/lean/';
  const steps=[
    {title:'One schedule works',question:'How can 36 days prove an infinite schedule exists?',links:[['Result.lean',17,'finite_windows'],['Result.lean',22,'original_feasible']]},
    {title:'Every alternative fails at 35',question:'Could a completely different schedule work?',links:[['Pinwheel.lean',74,'window_implies_age'],['Pinwheel.lean',157,'certificate_excludes_schedule'],['Certificate.lean',1029,'Certificate.checked'],['Result.lean',29,'infeasible_35']]},
    {title:'Smaller limits cannot rescue it',question:'What about a different kernel, with other limits?',links:[['Result.lean',33,'feasible_mono'],['Result.lean',55,'capped_infeasible'],['Result.lean',65,'no_dominated_kernel']]},
    {title:'Combine the two facts',question:'Which promise has the example broken?',links:[['Result.lean',41,'exact_threshold'],['Result.lean',76,'kernel_counterexample']]}
  ];
  let selected=0, task=5, start=9, fLimit=36, q=[...cap], qFocus=5, bound=36;
  let certificate=null, loading=null, loadError='', row=null, history=[], played=[], highlighted=null;
  const $=id=>document.getElementById(id);
  const vector=v=>'('+v.join(', ')+')';
  const sourceLinks=n=>n.links.map(([f,l,t])=>`<a href="${source}${f}#L${l}" target="_blank" rel="noopener">${t} ↗</a>`).join('');
  const takeaway=(label,text)=>`<div class="tour-takeaway"><strong>${label}</strong><p>${text}</p></div>`;
  root.innerHTML=`<nav class="tour-tabs" aria-label="Four steps of the argument">${steps.map((s,i)=>`<button data-tour-step="${i}" aria-controls="tour-panel" aria-pressed="false"><span>${i+1}</span>${s.title}</button>`).join('')}</nav><div id="tour-panel" class="tour-panel" role="region" aria-labelledby="tour-question"></div>`;
  function select(i, focus=false) {
    selected=i;
    root.querySelectorAll('[data-tour-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tourStep)===i)));
    const s=steps[i];
    $('tour-panel').innerHTML=`<p class="eyebrow">STEP ${i+1} OF 4</p><h3 id="tour-question" tabindex="-1">${s.question}</h3><div id="tour-body"></div><details class="tour-sources"><summary>See the corresponding Lean statements</summary><div class="lean-links">${sourceLinks(s)}</div></details><div class="tour-navigation"><button data-tour-go="${i-1}" ${i===0?'disabled':''}>← Back</button><button data-tour-go="${i+1}" ${i===3?'disabled':''}>${['Next: rule out other schedules','Next: rule out every smaller kernel','Next: assemble the counterexample','Finished'][i]} →</button></div>`;
    [renderWitness,renderCertificate,renderKernel,renderConclusion][i]();
    if(focus) $('tour-question').focus({preventScroll:true});
  }
  function renderWitness() {
    $('tour-body').innerHTML=`<p>A period is a <strong>maximum allowed gap</strong>. Task F with period 36 must appear in <em>every</em> block of 36 consecutive days. Inspect the fixed witness from the first section, repeated forever.</p><div class="tour-controls"><label>Task to inspect<select id="tour-task">${[...labels].map((c,i)=>`<option value="${i}" ${i===task?'selected':''}>Task ${c}</option>`).join('')}</select></label><label>F’s allowed gap<select id="tour-f-limit">${[32,35,36,40].map(n=>`<option ${n===fLimit?'selected':''}>${n}</option>`).join('')}</select></label></div><label class="tour-slider" for="tour-window-start">Start of the window <output id="tour-window-value"></output><input id="tour-window-start" type="range" min="1" max="36" value="${start}"></label><div id="tour-window" class="tour-window" aria-label="The selected consecutive days"></div><p id="tour-window-result" class="tour-verdict" role="status"></p><div id="tour-window-checks" class="tour-checks"></div>${takeaway('What this establishes','When all 36 starting positions pass for all six tasks, the infinite repetition works: a later window is a copy of one we checked. One valid schedule proves existence.')}<p class="tour-caution"><strong>Try 35:</strong> this cycle fails for F. That alone says nothing about other schedules. Step 2 supplies the missing argument.</p>`;
    updateWindow();
  }
  function updateWindow() {
    const p=[3,4,5,20,22,fLimit], result=inspectWindow(witness,task,start,p[task]);
    $('tour-window-value').textContent=`day ${start} → day ${start+p[task]-1}`;
    $('tour-window').innerHTML=result.days.map(d=>`<span class="tour-day ${d.task===task?'hit':''} ${(d.day-1)%36===0?'cycle-boundary':''}" title="Day ${d.day}, task ${labels[d.task]}${d.day>36?', next repetition':''}"><small>${d.day}</small><b>${labels[d.task]}</b></span>`).join('');
    const bad=result.hits.length===0;
    $('tour-window-result').classList.toggle('negative',bad);
    $('tour-window-result').textContent=bad?`No ${labels[task]} in these ${p[task]} days. This window fails.`:`Found ${labels[task]} on day${result.hits.length>1?'s':''} ${result.hits.map(d=>d.day).join(', ')}. This ${p[task]}-day window passes.${task===5&&start===9&&fLimit===36?' F is on day 8 and then day 44: exactly 36 days apart.':''}`;
    const counts=limits.map((_,t)=>Array.from({length:36},(_,j)=>inspectWindow(witness,t,j+1,p[t]).hits.length>0).filter(Boolean).length);
    $('tour-window-checks').innerHTML=`<p><strong>All starting positions, computed from this word</strong><br><span class="tour-muted">The line at day 37 marks the next copy of the cycle.</span></p><div class="tour-check-grid">${counts.map((n,t)=>`<div class="${n<36?'fails':''}"><strong>${labels[t]} · limit ${p[t]}</strong><span>${n}/36 windows pass</span></div>`).join('')}</div>`;
  }
  async function loadCertificate() {
    if(certificate) return;
    if(loading) return loading;
    loading=(async()=>{
      try {
        const response=await fetch('proof-35.json.gz');
        if(!response.ok) throw Error('The certificate could not be downloaded.');
        const decoded=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
        certificate={...decoded, lookup:new Map(decoded.states.map(r=>[r.slice(0,6).join(','),r]))};
        row=certificate.lookup.get(decoded.initial_state.join(','));
        if(!row) throw Error('The initial state is missing.');
      } catch(e) {loadError=e.message;certificate=null;}
      if(selected===1) renderCertificate();
    })();
    return loading;
  }
  function renderCertificate() {
    $('tour-body').innerHTML=`<p>Checking a few cycles cannot prove impossibility. Instead, record six <strong>ages</strong>: consecutive days since each task last ran. Run one task: its age resets to 0; the other five ages increase by 1. An age reaching its period means a missed deadline.</p><div class="tour-proof-rule"><strong>Why this covers every schedule</strong><ol><li>Every valid schedule traces a path through these states, whether it repeats or not.</li><li>At each state there are exactly six choices: A, B, C, D, E or F.</li><li>The certificate includes every legal successor and gives it a <strong>smaller nonnegative rank</strong>.</li></ol><p>So after <em>t</em> days, rank ≤ 101 − <em>t</em>. Day 102 would require rank ≤ −1. An infinite schedule is impossible.</p></div><div class="tour-experiment"><p class="eyebrow">INSPECT THE ACTUAL CERTIFICATE FOR 35</p><p class="tour-muted">Rank is a bound on how many legal steps remain, not a task deadline. Try a move or jump to a state where the conflict is immediate.</p><div id="tour-state-area"></div></div>${takeaway('Why one dead end is not the proof','The same decreasing-rank check covers all 56,284 states and all 107,847 legal transitions, including branches you did not click. Lean verifies that coverage and the argument from states to schedules. The controls inspect this certificate; they do not replace the full check.')}<p class="tour-caution">All ages start at 0, deliberately giving the scheduler extra slack. Even with that advantage it cannot continue forever. Allowing idle days cannot help: replace an idle day by task A without hurting another task.</p>`;
    if(!certificate) {
      $('tour-state-area').innerHTML=loadError?`<p role="alert">Could not load the interactive certificate. <a href="downloads/pinwheel-proof.zip">Download the proof package</a> to inspect it.</p>`:'<p role="status">Loading the existing certificate (175 KB compressed)…</p>';
      if(!loading) void loadCertificate();
      return;
    }
    renderState();
  }
  function renderState() {
    const options=inspectMoves(row,certificate.deadlines,certificate.lookup);
    $('tour-state-area').innerHTML=`<div class="tour-state-heading"><div><span>After ${played.length} days</span><strong>Rank ${row[6]}</strong></div><div class="tour-controls"><button data-tour-action="dead-end">Show a dead end</button><button data-tour-action="restart">Start at day 0</button><button data-tour-action="undo" ${history.length?'':'disabled'}>Undo move</button></div></div><div class="tour-ages">${row.slice(0,6).map((a,i)=>`<div class="${a+1>=certificate.deadlines[i]?'urgent':''}"><strong>${labels[i]}</strong><span>age ${a}</span><small>must stay &lt; ${certificate.deadlines[i]}</small></div>`).join('')}</div><p><strong>All six choices for the next day</strong> — a legal choice must keep every age below its limit.</p><div class="tour-choices">${options.map(o=>`<button data-tour-move="${o.task}" class="${o.missed.length?'blocked':'legal'}" aria-pressed="${highlighted===o.task}"><strong>Run ${labels[o.task]}</strong><span>${o.missed.length?'Misses '+o.missed.map(i=>labels[i]).join(' and '):`Rank ${row[6]} → ${o.target[6]}`}</span><small>${o.missed.length?'Click to see the conflict':'Take this legal step'}</small></button>`).join('')}</div><p id="tour-transition" class="tour-verdict ${row[6]===0?'negative':''}" role="status">${row[6]===0?'No choice is legal. At least two tasks need this day, but only one can run.':`Every legal choice above leads to a rank strictly below ${row[6]}. There is no seventh choice that avoids the check.`}</p><details><summary>Show the ${played.length}-day path to this state</summary><p class="tour-path">${played.length?played.map(t=>labels[t]).join(' '):'Initial state: (0, 0, 0, 0, 0, 0).'}</p></details>`;
  }
  function chooseMove(t) {
    const move=inspectMoves(row,certificate.deadlines,certificate.lookup)[t];
    if(move.missed.length) {
      highlighted=t;
      root.querySelectorAll('[data-tour-move]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tourMove)===t)));
      $('tour-transition').classList.add('negative');
      $('tour-transition').textContent=`Run ${labels[t]} → next ages ${vector(move.next)}. ${move.missed.map(i=>`${labels[i]} reaches age ${move.next[i]}, but must stay below ${certificate.deadlines[i]}`).join('; ')}. This choice is illegal.`;
    } else {
      const before=row[6];history.push(row);played.push(t);row=move.target;highlighted=null;renderState();
      $('tour-transition').textContent=`Ran ${labels[t]}: its age reset to 0, all other ages increased by 1. Rank decreased ${before} → ${row[6]}.${row[6]===0?' No legal move remains.':''}`;
    }
  }
  function renderKernel() {
    $('tour-body').innerHTML=`<p>For six tasks, the conjecture asks for a feasible vector <strong>q</strong> with every limit at most <strong>32 = 2⁵</strong>, and no limit larger than the original one. Here are all the restrictions at once.</p><div class="tour-table-wrap"><table class="tour-kernel-table"><thead><tr><th scope="col">Task</th><th scope="col">Original limit</th><th scope="col">Largest allowed q</th><th scope="col">Try a candidate q</th></tr></thead><tbody>${cap.map((n,i)=>`<tr><th scope="row">${labels[i]}</th><td>${limits[i]}</td><td>${n}</td><td><label class="tour-candidate"><span class="sr-only">Candidate period for ${labels[i]}</span><input data-tour-q="${i}" type="range" min="1" max="${n}" value="${q[i]}"><output id="tour-q-${i}">${q[i]}</output></label></td></tr>`).join('')}</tbody></table></div><div class="tour-controls"><button data-tour-action="easiest">Use the largest allowed limits</button><button data-tour-action="tighter">Try a stricter candidate</button></div><div id="tour-kernel-argument" aria-live="polite"></div>${takeaway('Why this rules out every candidate','The largest allowed vector is the easiest candidate to schedule. It already fails. Every other candidate only tightens requirements, so none can work. We do not need to enumerate the candidates.')}<p class="tour-caution">The direction matters: a schedule for a stricter limit also meets a looser limit. Making a task more frequent cannot free days for the other tasks.</p>`;
    updateKernel();
  }
  function updateKernel() {
    q.forEach((v,i)=>$('tour-q-'+i).value=v);
    const i=qFocus;
    $('tour-kernel-argument').innerHTML=`<div class="tour-implication"><div><small>Suppose a schedule meets your q</small><strong>${vector(q)}</strong></div><b aria-hidden="true">↓</b><div><small>That same schedule would meet the larger limits C</small><strong>${vector(cap)}</strong></div><b aria-hidden="true">↓</b><div><small>It would also meet the even looser last limit 35</small><strong>(3, 4, 5, 20, 22, 35)</strong></div><b aria-hidden="true">↓</b><div class="contradiction"><strong>But step 2 proves that no such schedule exists.</strong><span>So the supposed schedule for q cannot exist either.</span></div></div><div class="tour-nested"><p><strong>See the implication for task ${labels[i]}</strong><br>Any ${cap[i]}-day window contains its first ${q[i]} ${q[i]===1?'day':'days'}. If every ${q[i]}-day window has ${labels[i]}, the larger window must have it too.</p><div class="tour-window-bars"><div class="outer-window"><span>Any ${cap[i]}-day window</span><div style="width:${100*q[i]/cap[i]}%"><span>${q[i]} ${q[i]===1?'day':'days'}: contains ${labels[i]}</span></div></div></div></div>`;
  }
  function renderConclusion() {
    $('tour-body').innerHTML=`<div class="tour-promise"><strong>The conjecture’s promise, for six tasks</strong><p>For <em>every</em> feasible instance, there is <em>some</em> feasible dominated vector whose six periods are all at most 32.</p></div><div class="tour-result-grid"><div><span class="tour-result-icon">✓</span><h4>Our instance meets the premise</h4><p>(3, 4, 5, 20, 22, 36) is feasible.</p><button data-tour-go="0">Inspect its repeating schedule</button></div><div><span class="tour-result-icon">∅</span><h4>It has none of the promised kernels</h4><p>Every permitted q is impossible.</p><button data-tour-go="2">See why all candidates fail</button></div></div>${takeaway('The contradiction','One feasible instance without any required kernel is enough to falsify “every feasible instance has one”. This is a counterexample to the Pinwheel Kernel Conjecture.')}<details class="tour-threshold"><summary>Extra result: why the exact threshold is 36</summary><p>Keep the first five periods at 3, 4, 5, 20, 22 and vary only F’s period b.</p><label class="tour-slider" for="tour-bound">Last period b <output id="tour-bound-value"></output><input id="tour-bound" type="range" min="28" max="42" value="${bound}"></label><div id="tour-threshold-argument" class="tour-verdict" role="status"></div><p>This describes this fixed five-task prefix. It does not prove that a cap of 36 works for every six-task instance.</p></details>`;
    updateThreshold();
  }
  function updateThreshold() {
    $('tour-bound-value').value=bound;
    $('tour-threshold-argument').classList.toggle('negative',bound<36);
    $('tour-threshold-argument').textContent=bound>=36?`The step 1 cycle has maximum gaps (3, 4, 5, 20, 22, 36). Since 36 ≤ ${bound}, every gap meets the chosen limits. The same cycle is a witness for b = ${bound}.`:`Suppose a schedule worked for b = ${bound}. Since ${bound} ≤ 35, the same schedule would meet (3, 4, 5, 20, 22, 35). Step 2 rules that out. So b = ${bound} is impossible.`;
  }
  root.addEventListener('click',e=>{
    const step=e.target.closest('[data-tour-step], [data-tour-go]');
    if(step&&!step.disabled) {select(Number(step.dataset.tourStep??step.dataset.tourGo),true);return;}
    const move=e.target.closest('[data-tour-move]');if(move) {chooseMove(Number(move.dataset.tourMove));return;}
    const action=e.target.closest('[data-tour-action]')?.dataset.tourAction;
    if(action==='easiest'||action==='tighter') {q=action==='easiest'?[...cap]:[2,3,4,18,20,30];qFocus=action==='easiest'?5:0;renderKernel();}
    if(action==='restart'||action==='dead-end') {
      row=certificate.lookup.get(certificate.initial_state.join(','));history=[];played=[];highlighted=null;
      if(action==='dead-end') for(const t of certificate.longest_prefix) {history.push(row);played.push(t);row=inspectMoves(row,certificate.deadlines,certificate.lookup)[t].target;}
      renderState();
    }
    if(action==='undo'&&history.length) {row=history.pop();played.pop();highlighted=null;renderState();}
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='tour-window-start') {start=Number(e.target.value);updateWindow();}
    if(e.target.matches('[data-tour-q]')) {qFocus=Number(e.target.dataset.tourQ);q[qFocus]=Number(e.target.value);updateKernel();}
    if(e.target.id==='tour-bound') {bound=Number(e.target.value);updateThreshold();}
  });
  root.addEventListener('change',e=>{
    if(e.target.id==='tour-task') {task=Number(e.target.value);updateWindow();}
    if(e.target.id==='tour-f-limit') {fLimit=Number(e.target.value);updateWindow();}
  });
  select(0);
})();
