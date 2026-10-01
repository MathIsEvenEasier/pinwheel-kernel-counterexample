/* Explanatory grouping of the actual Lean lemmas. No proof search runs here. */
(() => {
  const root = document.getElementById('theorem-map');
  if (!root) return;
  const source = 'https://github.com/MathIsEvenEasier/pinwheel-kernel-counterexample/blob/f1053824f63b214a34c2f2c285d7a3dbae24b008/lean/';
  const nodes = [
    {id:'witness', title:'Cykl działa dla 36', short:'Jeden plan wystarcza', formula:'Wykonalne(A₃₆)', deps:[], file:'Result.lean', line:22, lemma:'original_feasible',
      explanation:'Sprawdzamy wszystkie okna zaczynające się w 36 pozycjach cyklu. Okresowość przenosi tę skończoną kontrolę na każdy dzień nieskończonego harmonogramu. To dowód istnienia: wystarczy jeden poprawny plan.',
      detail:'<div class="gap-proof">'+[3,4,5,20,22,36].map((n,i)=>`<div><span>${'ABCDEF'[i]}</span><div><i style="width:${n/36*100}%"></i></div><strong>${n}</strong></div>`).join('')+'</div><p class="map-caption">Największe odstępy, włącznie z przejściem między cyklami. Każdy mieści się w swoim limicie.</p>',
      extra:[['Result.lean',17,'finite_windows']]},
    {id:'mono', title:'Większy limit ułatwia', short:'Kierunek ma znaczenie', formula:'p ≤ q ⇒ Wykonalne(p) → Wykonalne(q)', deps:[], file:'Result.lean', line:33, lemma:'feasible_mono',
      explanation:'Większy okres to łagodniejsze wymaganie. Jeśli zadanie pojawia się w każdym oknie długości p, pojawi się też w każdym dłuższym oknie q. Ten sam plan wystarcza. Nierówności między wektorami rozumiemy współrzędnie.',
      detail:'<label class="map-slider">Zmień limit q dla jednego zadania <output id="mono-value">7</output><input id="mono-limit" type="range" min="3" max="9" value="7"></label><div class="mono-slots" aria-label="Zadanie pojawia się co pięć dni">'+Array.from({length:11},(_,i)=>`<span class="${i%5===0?'hit':''}">${i%5===0?'A':'·'}</span>`).join('')+'</div><p class="map-caption">Przykład: odstęp między wykonaniami wynosi 5 dni.</p><p id="mono-verdict" class="map-verdict" role="status"></p>', extra:[]},
    {id:'impossible', title:'Dla 35 plan nie istnieje', short:'Wszystkie kontynuacje', formula:'¬ Wykonalne(A₃₅)', deps:[], file:'Result.lean', line:29, lemma:'infeasible_35',
      explanation:'Każdy poprawny harmonogram daje legalną ścieżkę stanów wieku zadań. Certyfikat zawiera stan początkowy i wszystkich legalnych następców, a ranga maleje na każdym kroku. Nieskończona ścieżka wymagałaby nieskończenie malejących liczb naturalnych.',
      detail:'<div class="rank-proof"><span>Start należy do zbioru</span><b>↓</b><span>Każdy legalny następnik też należy</span><b>↓</b><span>Ranga zawsze maleje</span></div><div class="map-formula">101 &gt; r₁ &gt; r₂ &gt; … ≥ 0</div><p class="map-caption">Ten ciąg musi się skończyć. Certyfikat dla 35: 56 284 stany, 107 847 przejść. Wyklucza też plany nieokresowe.</p><p class="map-caption">Gra poniżej używa osobnego certyfikatu dla 32. Formalny dowód progu korzysta z mocniejszego przypadku 35.</p>',
      extra:[['Pinwheel.lean',74,'window_implies_age'],['Pinwheel.lean',157,'certificate_excludes_schedule'],['Certificate.lean',1029,'Certificate.checked']]},
    {id:'threshold', title:'Dokładna granica: 36', short:'Obie strony równoważności', formula:'Wykonalne(A<sub>b</sub>) ⇔ b ≥ 36', deps:['witness','mono','impossible'], file:'Result.lean', line:41, lemma:'exact_threshold',
      explanation:'Dla b ≥ 36 zachowujemy znaleziony cykl i luzujemy ostatni limit. Gdy b ≤ 35, ewentualny plan działałby również dla 35, co przeczy certyfikatowi. Te dwa argumenty obejmują każde naturalne b.',
      detail:'<label class="map-slider">Ostatni limit b <output id="threshold-value">36</output><input id="threshold-limit" type="range" min="28" max="42" value="36"></label><div class="threshold-strip">'+Array.from({length:15},(_,i)=>`<span data-bound="${i+28}" class="${i+28<36?'no':'yes'}">${i+28}</span>`).join('')+'</div><p id="threshold-verdict" class="map-verdict" role="status"></p><p class="map-caption">Pozostałe terminy są stałe: 3, 4, 5, 20, 22.</p>', extra:[]},
    {id:'kernel', title:'Żadne mniejsze jądro ≤ 32', short:'Wszyscy kandydaci odpadają', formula:'¬ ∃ q ≤ A₃₆: (∀ i, qᵢ ≤ 32) ∧ Wykonalne(q)', deps:['threshold','mono'], file:'Result.lean', line:65, lemma:'no_dominated_kernel',
      explanation:'Każdy kandydat q ograniczony jednocześnie przez A i przez 32 spełnia q ≤ min(A, 32) = A₃₂. Gdyby q miał poprawny plan, ten sam plan działałby dla A₃₂. Dokładny próg 36 to wyklucza. Odpadają więc wszyscy kandydaci, bez ich wyliczania.',
      detail:'<label class="map-slider">Zbadaj proponowaną granicę K <output id="kernel-value">32</output><input id="kernel-limit" type="range" min="28" max="40" value="32"></label><div class="kernel-vectors"><span>A</span><code>(3, 4, 5, 20, 22, 36)</code><span>q ≤ min(A, K)</span><code id="kernel-vector"></code></div><p id="kernel-verdict" class="map-verdict" role="status"></p><p class="map-caption">Hipoteza narzuca K = 2⁵ = 32. Suwak ilustruje wniosek z progu dla tej jednej instancji; nie ustala granicy uniwersalnej.</p>',
      extra:[['Result.lean',55,'capped_infeasible']]},
    {id:'result', title:'Kontrprzykład', short:'Hipoteza 2.3 jest fałszywa', formula:'Wykonalne(A₃₆) ∧ brak wymaganego jądra', deps:['witness','kernel'], file:'Result.lean', line:76, lemma:'kernel_counterexample',
      explanation:'Hipoteza wymagała odpowiedniego jądra dla każdej wykonalnej instancji. Mamy jedną wykonalną instancję i dowód, że żadne wymagane jądro do niej nie istnieje. To wystarcza do obalenia zdania ogólnego.',
      detail:'<div class="conclusion-pair"><div><b>✓</b><strong>Plan dla A istnieje</strong><span>jawny cykl długości 36</span></div><span class="conjunction">∧</span><div><b>∅</b><strong>Wymaganych jąder brak</strong><span>każdy kandydat z limitem 32 odpada</span></div></div><p class="map-caption">Nie wynika stąd, że 36 wystarcza dla wszystkich instancji sześciu zadań.</p>', extra:[]}
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
  root.innerHTML = `<div class="map-layout"><div><div class="proof-graph" role="group" aria-label="Kroki dowodu. Wybierz twierdzenie, aby poznać jego przesłanki."><svg viewBox="0 0 720 528" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>${paths.map(([from,to,d])=>`<path data-from="${from}" data-to="${to}" d="${d}" marker-end="url(#map-arrow)"/>`).join('')}</svg>${nodes.map((n,i)=>`<button class="theorem-node node-${n.id}" data-node="${n.id}" aria-controls="theorem-detail" aria-pressed="false"><small>${String(i+1).padStart(2,'0')} / ${n.short}</small><strong>${n.title}</strong></button>`).join('')}</div><p class="map-caption map-legend">Strzałka: przesłanka → wniosek. Kolor wskazuje przesłanki wybranego kroku. Główne lematy są zgrupowane; to nie jest pełny graf 6850 deklaracji.</p></div><div class="theorem-detail" id="theorem-detail" role="region" aria-label="Wyjaśnienie wybranego twierdzenia"></div></div>`;

  function needed(id, out=new Set()) { out.add(id); byId[id].deps.forEach(d=>needed(d,out)); return out; }
  function sourceLink(file,line,label) { return `<a href="${source}${file}#L${line}" target="_blank" rel="noopener">${label} ↗</a>`; }
  function updateBound(kind) {
    const value = Number(document.getElementById(`${kind}-limit`).value);
    document.getElementById(`${kind}-value`).value = value;
    const verdict = document.getElementById(`${kind}-verdict`);
    let good;
    if(kind==='mono') {
      good = value>=5;
      verdict.textContent = good ? `5 ≤ ${value}: ten sam rytm co 5 dni spełnia również limit ${value}.` : `${value} < 5: ten rytm nie spełnia ostrzejszego limitu. Twierdzenie nie pozwala odwrócić strzałki; inny, częstszy rytm nadal może działać.`;
    } else if(kind==='threshold') {
      good = value>=36;
      verdict.textContent = good ? `${value} ≥ 36 — wykonalne. ${value===36?'Działa jawny cykl.':'Działa ten sam cykl, bo limit jest łagodniejszy.'}` : `${value} ≤ 35 — niewykonalne. Każdy taki plan działałby również dla 35, wbrew certyfikatowi.`;
      root.querySelectorAll('[data-bound]').forEach(e=>e.classList.toggle('chosen',Number(e.dataset.bound)===value));
    } else {
      good = value>=36;
      document.getElementById('kernel-vector').textContent = `(3, 4, 5, 20, 22, ${Math.min(36,value)})`;
      verdict.textContent = good ? `Dla K = ${value} ta instancja ma kandydata: q = A. Nie dowodzi to, że K wystarcza dla innych instancji.` : `Dla K = ${value} nawet min(A, K) jest niewykonalne. Każde mniejsze q też odpada. ${value===32?'To granica postulowana przez hipotezę.':''}`;
    }
    verdict.classList.toggle('negative',!good);
  }
  function select(id) {
    const n=byId[id], all=needed(id), index=nodes.indexOf(n);
    root.querySelectorAll('[data-node]').forEach(el=>{el.classList.toggle('selected',el.dataset.node===id);el.classList.toggle('needed',all.has(el.dataset.node));el.setAttribute('aria-pressed',String(el.dataset.node===id));});
    root.querySelectorAll('svg > path').forEach(el=>el.classList.toggle('needed',all.has(el.dataset.to)&&all.has(el.dataset.from)));
    const detail=document.getElementById('theorem-detail');
    detail.innerHTML=`<p class="eyebrow">KROK ${index+1} / ${nodes.length}</p><h3>${n.title}</h3><div class="map-formula">${n.formula}</div><p>${n.explanation}</p>${n.detail}<div class="map-dependencies"><span>Korzysta z:</span> ${n.deps.length?n.deps.map(d=>`<button data-jump="${d}">${byId[d].title}</button>`).join(''):'<span>konstrukcji lub lematu bazowego opisanego powyżej</span>'}</div><details><summary>Odpowiednik w Lean</summary><div class="lean-links">${sourceLink(n.file,n.line,n.lemma)}${n.extra.map(x=>sourceLink(...x)).join('')}</div></details><div class="map-navigation"><button data-step="${index-1}" ${index===0?'disabled':''}>← Wstecz</button><button data-step="${index+1}" ${index===nodes.length-1?'disabled':''}>Dalej →</button></div>`;
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
