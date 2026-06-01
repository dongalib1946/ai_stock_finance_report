
const DATA = window.REPORT_DATA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const fmt = new Intl.NumberFormat('ko-KR');
const scopeNames = { global: '전세계', korea: '한국', donga: '동아대학교' };
let paperMode = 'representative';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'}[c]));
}

function modal(title, html) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  const panel = $('.modal');
  const body = $('#modalBody');
  panel.scrollTop = 0;
  body.scrollTop = 0;
  $('#modalBackdrop').classList.add('open');
  requestAnimationFrame(() => {
    panel.scrollTop = 0;
    body.scrollTop = 0;
  });
}

function closeModal() { $('#modalBackdrop').classList.remove('open'); }

function tooltip() {
  let el = $('#tooltipPop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tooltipPop';
    el.className = 'tooltip-pop';
    document.body.appendChild(el);
  }
  return el;
}

function showTip(event, title, body) {
  const el = tooltip();
  el.innerHTML = `<b>${esc(title)}</b>${esc(body)}`;
  const x = Math.min(window.innerWidth - 360, event.clientX + 14);
  const y = Math.min(window.innerHeight - 120, event.clientY + 14);
  el.style.left = Math.max(10, x) + 'px';
  el.style.top = Math.max(10, y) + 'px';
  el.classList.add('show');
}

function hideTip() { const el = $('#tooltipPop'); if (el) el.classList.remove('show'); }

function attachTip(el, title, body) {
  el.addEventListener('mouseenter', e => showTip(e, title, body));
  el.addEventListener('mousemove', e => showTip(e, title, body));
  el.addEventListener('mouseleave', hideTip);
  el.addEventListener('click', e => showTip(e, title, body));
}

function count(el, to, dec = 0) {
  let st = performance.now();
  function f(now) {
    let p = Math.min(1, (now - st) / 900), e = 1 - Math.pow(1 - p, 3), v = to * e;
    el.textContent = dec ? v.toFixed(dec) + 'x' : fmt.format(Math.round(v));
    if (p < 1) requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}

function initHero() {
  $('#sdgChips').innerHTML = DATA.sdgs.map(x => `<span class="chip">${esc(x)}</span>`).join('');
  const items = [
    ['전세계 Scholarly Output', DATA.summary.global.total, '2020-2026 서지 데이터 기준'],
    ['한국 Scholarly Output', DATA.summary.korea.total, '한국 소속기관 기준'],
    ['동아대 Scholarly Output', DATA.summary.donga.total, '동아대학교 해당 분야 연구 기준'],
    ['글로벌 성장비', DATA.summary.global.ratio, '최근/초기 연구량 비율', 2],
  ];
  $('.kpis').innerHTML = items.map((it, i) => `<article class="kpi reveal"><span>${it[0]}</span><b data-kpi="${i}">0</b><small>${it[2]}</small></article>`).join('');
  items.forEach((it, i) => count($(`[data-kpi="${i}"]`), it[1], it[3] || 0));
}

function newsCards() {
  const el = $('#newsCards');
  if (!el) return;
  el.innerHTML = (DATA.newsCards || []).map((n, i) => {
    const visual = n.image ? `<img src="${esc(n.image)}" alt="${esc(n.imageAlt || n.source || '')}">` : `<span>${esc(n.sourceCode || n.source || 'NEWS')}</span>`;
    return `<a class="news-card accent-${esc(n.accent || 'blue')}" href="${esc(n.url)}" target="_blank" rel="noopener" data-i="${i}"><div class="news-thumb">${visual}</div><div class="news-copy"><div class="news-meta">${esc(n.source)} · ${esc(n.date)}</div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><strong>${esc(n.angle)}</strong></div></a>`;
  }).join('');
}

function sdgVisuals() {
  const el = $('#sdgVisuals');
  if (!el) return;
  el.innerHTML = (DATA.sdgCards || []).map(x => `<article class="sdg-visual reveal"><img src="${esc(x.src)}" alt="${esc(x.alt)}"><div><b>${esc(x.title)}</b><p>${esc(x.body)}</p></div></article>`).join('');
}

function normPaperTitle(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function allPapers() {
  return Object.values(DATA.papers || {}).flat();
}

function findPaper(ref) {
  const key = normPaperTitle(ref.paper || ref.title || '');
  if (!key) return null;
  return allPapers().find(p => {
    const title = normPaperTitle(p.title || '');
    return title === key || title.includes(key) || key.includes(title);
  }) || null;
}

function openPaperModal(p) {
  if (!p) return;
  let keywords = (p.keywords || []).map(k => `<span class="badge">${esc(k)}</span>`).join('');
  let abstractText = (p.abstract || '').trim() || '현재 정리된 서지 레코드에는 초록 전문이 포함되어 있지 않습니다. 아래 메타데이터와 키워드를 기준으로 논문 맥락을 확인할 수 있습니다.';
  const insight = p.interpretation ? `<div class="paper-insight"><b>논문 해석</b><p>${esc(p.interpretation)}</p></div>` : '';
  modal('논문 초록 및 연구 해석', `<p><b>${esc(p.title)}</b></p><div class="modal-index"><div><span>학술지</span>${esc(p.source || '-')}</div><div><span>연도 / 인용</span>${p.year || '-'} · Cited ${fmt.format(p.cited || 0)}</div>${p.resourceSource ? `<div><span>국가</span>${esc(p.resourceSource)}</div>` : ''}${p.authorDisplay ? `<div><span>저자</span>${esc(cleanAuthors(p.authorDisplay))}</div>` : ''}${p.corresponding ? `<div><span>교신저자</span>${esc(cleanAuthors(p.corresponding))}</div>` : ''}${p.doi ? `<div><span>DOI</span>${esc(p.doi)}</div>` : ''}</div>${insight}<div class="modal-abstract"><b>초록</b><p>${esc(abstractText)}</p>${keywords ? `<div class="badges">${keywords}</div>` : ''}</div>`);
}

function figureCards() {
  const el = $('#figureCards');
  if (!el) return;
  const head = $('#data-structure .section-head');
  if (head) head.innerHTML = '<p>Core Paper Diagrams</p><h2>AI 금융예측 연구 핵심 논문</h2>';
  el.innerHTML = (DATA.figures || []).map((x, i) => {
    const tags = (x.tags || []).map(t => `<span>${esc(t)}</span>`).join('');
    const paper = x.paper ? `<button class="figure-paper-title" type="button" data-figure="${i}">${esc(x.paper)}</button>` : '';
    const label = x.title ? `<small>${esc(x.title)}</small>` : '';
    const takeaway = x.takeaway ? `<strong>${esc(x.takeaway)}</strong>` : '';
    return `<article class="figure-card reveal"><img src="${esc(x.src)}" alt="${esc(x.alt)}"><div class="figure-caption-block">${label}${paper}<p>${esc(x.body)}</p>${tags ? `<div class="figure-tags">${tags}</div>` : ''}${takeaway}</div></article>`;
  }).join('');
  $$('.figure-paper-title', el).forEach(btn => {
    btn.addEventListener('click', () => openPaperModal(findPaper((DATA.figures || [])[Number(btn.dataset.figure)] || {})));
  });
}

function trend() {
  const svg = $('#trendChart'), W = 980, H = 420, m = { l: 64, r: 32, t: 30, b: 52 };
  const years = DATA.yearly.global.map(d => d.year), max = Math.max(...DATA.yearly.global.map(d => d.total));
  const lowMax = {
    korea: Math.max(...DATA.yearly.korea.map(d => d.total), 1),
    donga: Math.max(...DATA.yearly.donga.map(d => d.total), 1),
  };
  const x = y => m.l + (years.indexOf(y) / (years.length - 1)) * (W - m.l - m.r);
  const yy = v => H - m.b - (v / max) * (H - m.t - m.b);
  const lineY = (s, v) => {
    if (s === 'global') return yy(v);
    if (s === 'korea') return H - m.b - 42 - (v / lowMax.korea) * 154;
    return H - m.b - 8 - (v / lowMax.donga) * 108;
  };
  let h = `<defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#176fc2"/><stop offset="1" stop-color="#12a6cf"/></linearGradient></defs>`;
  for (let i = 0; i <= 4; i++) {
    let v = Math.round(max * i / 4), y = yy(v);
    h += `<line x1="${m.l}" y1="${y}" x2="${W - m.r}" y2="${y}" stroke="#e8eef5"/><text x="${m.l - 10}" y="${y + 4}" text-anchor="end" fill="#607083" font-size="12">${fmt.format(v)}</text>`;
  }
  DATA.yearly.global.forEach(d => {
    let cx = x(d.year), bh = H - m.b - yy(d.total);
    h += `<rect class="trendbar" x="${cx - 30}" y="${yy(d.total)}" width="60" height="${bh}" rx="8" fill="url(#tg)" data-year="${d.year}" data-total="${d.total}"/><text x="${cx}" y="${H - 18}" text-anchor="middle" fill="#607083" font-size="13">${d.year}</text><text x="${cx}" y="${yy(d.total) - 8}" text-anchor="middle" fill="#123766" font-size="12" font-weight="900">${fmt.format(d.total)}</text>`;
  });
  function poly(s, c) {
    h += `<polyline points="${DATA.yearly[s].map(d => `${x(d.year)},${lineY(s, d.total)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="4"/>`;
    DATA.yearly[s].forEach(d => h += `<circle cx="${x(d.year)}" cy="${lineY(s, d.total)}" r="5" fill="${c}"><title>${scopeNames[s]} ${d.year}: ${d.total}</title></circle>`);
  }
  poly('korea', '#15a879'); poly('donga', '#f47b20');
  h += `<text x="${m.l}" y="18" fill="#176fc2" font-weight="900">Global bars</text><text x="${m.l + 118}" y="18" fill="#15a879" font-weight="900">Korea</text><text x="${m.l + 190}" y="18" fill="#f47b20" font-weight="900">Dong-A</text><text x="${W - m.r}" y="18" text-anchor="end" fill="#607083" font-size="12" font-weight="800">Korea/Dong-A line scale amplified</text>`;
  svg.innerHTML = h;
  $$('.trendbar', svg).forEach(b => attachTip(b, `${b.dataset.year}년 연구량`, `전세계 서지 표본 ${fmt.format(b.dataset.total)}건`));
}

function donuts() {
  $('#donuts').innerHTML = ['global', 'korea', 'donga'].map(s => {
    let v = DATA.summary[s], tot = Math.max(1, v.early + v.recent), pct = v.recent / tot, c = 2 * Math.PI * 38, d = pct * c;
    let color = s === 'global' ? '#176fc2' : s === 'korea' ? '#15a879' : '#f47b20';
    return `<div class="donut-card"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="38" fill="none" stroke="#e8eef5" stroke-width="14"/><circle cx="55" cy="55" r="38" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${d} ${c - d}" transform="rotate(-90 55 55)"/><text x="55" y="57" text-anchor="middle" font-size="17" font-weight="950" fill="#123766">${(pct * 100).toFixed(1)}%</text><text x="55" y="73" text-anchor="middle" font-size="10" fill="#607083">recent</text></svg><b>${scopeNames[s]}</b><small>최근 ${fmt.format(v.recent)} / 초기 ${fmt.format(v.early)}</small></div>`;
  }).join('');
  $('#scopeTable').innerHTML = '<thead><tr><th>구분</th><th>총량</th><th>최근</th><th>성장비</th></tr></thead><tbody>' + ['global','korea','donga'].map(s => `<tr><td><b>${scopeNames[s]}</b></td><td>${fmt.format(DATA.summary[s].total)}</td><td>${fmt.format(DATA.summary[s].recent)}</td><td>${DATA.summary[s].ratio.toFixed(2)}x</td></tr>`).join('') + '</tbody>';
}

function bars(id, items) {
  let max = Math.max(...items.map(x => x.docs), 1);
  $(id).innerHTML = items.map(x => `<div class="bar"><label>${esc(x.label)}</label><div class="track"><div class="fill" data-w="${Math.max(5, x.docs / max * 100).toFixed(1)}"></div></div><strong>${fmt.format(x.docs)}</strong></div>`).join('');
  requestAnimationFrame(() => $$(`${id} .fill`).forEach(x => x.style.width = x.dataset.w + '%'));
}

function wordcloud(s = 'global') {
  let words = DATA.keywords[s].slice(0, 42), max = Math.max(...words.map(w => w.count), 1);
  let pos = [[50,48],[34,36],[66,35],[33,62],[68,62],[48,25],[52,72],[20,48],[80,48],[18,28],[82,28],[18,72],[82,72],[42,12],[60,14],[43,86],[61,86],[28,18],[73,18],[29,82],[74,82],[10,53],[90,55],[10,38],[90,38],[50,8],[50,92],[25,50],[75,50],[38,48],[62,48],[39,73],[61,25],[16,15],[84,15],[16,86],[84,86],[7,68],[93,68],[7,24],[93,24],[50,62]];
  let colors = ['#123766','#176fc2','#12a6cf','#15a879','#f47b20'];
  $('#wordcloud').innerHTML = words.map((w,i) => `<button class="word" style="left:${pos[i][0]}%;top:${pos[i][1]}%;font-size:${15 + Math.pow(w.count / max, .62) * 34}px;color:${colors[i % colors.length]};z-index:${1 + Math.round((w.count / max) * 29)}" data-word="${esc(w.text)}" data-count="${w.count}">${esc(w.text)}</button>`).join('');
  $$('.word').forEach(n => attachTip(n, `키워드: ${n.dataset.word}`, `${scopeNames[s]} 범위에서 ${fmt.format(n.dataset.count)}회 등장`));
}

function network() {
  const svg = $('#networkChart'), edges = DATA.networkEdges, wt = {};
  edges.forEach(e => { wt[e.source] = (wt[e.source] || 0) + e.weight; wt[e.target] = (wt[e.target] || 0) + e.weight; });
  let nodes = Object.keys(wt).sort((a,b) => wt[b] - wt[a]).slice(0, 34), pos = {}, cx = 460, cy = 270;
  nodes.forEach((n,i) => { let a = i / nodes.length * Math.PI * 2 - Math.PI / 2, r = i < 10 ? 176 : 262; pos[n] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .78 }; });
  ['learning','stock','prediction','market'].forEach((n,i) => { if (pos[n]) pos[n] = { x: cx + (i - 1.5) * 104, y: cy + (i % 2 ? 42 : -42) }; });
  let max = Math.max(...Object.values(wt), 1), h = '';
  edges.forEach(e => { let a = pos[e.source], b = pos[e.target]; if (a && b) h += `<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke-width="${1 + e.weight / 38}"></line>`; });
  nodes.forEach(n => { let p = pos[n], r = 13 + Math.sqrt(wt[n] / max) * 34, c = n.includes('learning') ? '#176fc2' : n.includes('stock') || n.includes('market') ? '#12a6cf' : n.includes('prediction') || n.includes('price') ? '#15a879' : '#f47b20'; h += `<g class="node" data-n="${esc(n)}" data-w="${wt[n]}"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${c}" opacity=".9"/><text x="${p.x}" y="${p.y + r + 18}" text-anchor="middle" font-size="${Math.min(23, 12 + r / 3)}">${esc(n)}</text></g>`; });
  svg.innerHTML = h;
  $$('.node', svg).forEach(n => attachTip(n, `네트워크 노드: ${n.dataset.n}`, `연결 가중치 합 ${fmt.format(n.dataset.w)}`));
}

function researcherModal(r) {
  const metrics = Object.entries(r.metrics || {}).map(([k, v]) => `<div><span>${esc(k)}</span>${esc(v)}</div>`).join('');
  const paperList = (r.papers || []).map(p => {
    const authors = p.authors ? `<div class="paper-authors">${esc(cleanAuthors(p.authors))}</div>` : '';
    const abstract = p.abstract ? `<p>${esc(p.abstract)}</p>` : '';
    const insight = p.interpretation ? `<div class="paper-insight"><b>논문 해석</b><p>${esc(p.interpretation)}</p></div>` : '';
    return `<article class="mini-paper"><div class="paper-top"><b>${esc(p.title)}</b><span class="cite-chip">Cited ${fmt.format(p.cited || 0)}</span></div><div class="paper-meta">${p.year || '-'} · ${esc(p.source || '-')}</div>${authors}${p.doi ? `<div class="badges"><span class="badge">DOI ${esc(p.doi)}</span></div>` : ''}${insight}${abstract}</article>`;
  }).join('') || '<p>현재 정리된 동아대학교 연구자 데이터에서 이 연구자와 직접 매칭되는 논문이 없습니다.</p>';
  modal(`${r.name} 연구 성과`, `<p><b>${esc(r.department)}</b>${r.position ? ' · ' + esc(r.position) : ''}</p><p>${esc(r.focus)}</p><div class="modal-index">${metrics}</div><div class="researcher-paper-list">${paperList}</div>${r.profile ? `<p class="modal-link"><a href="${esc(r.profile)}" target="_blank" rel="noopener">Scopus Author Profile 열기</a></p>` : ''}`);
}

function researchers() {
  $('#researcherCards').innerHTML = DATA.researchers.map((r, i) => `<article class="researcher-card reveal" data-i="${i}" role="button" tabindex="0" aria-label="${esc(r.name)} 연구 성과 보기"><div class="avatar">${esc(r.initial)}</div><h3>${esc(r.name)}</h3><p class="dept">${esc(r.department)} ${r.position ? '· ' + esc(r.position) : ''}</p><span class="badge">${esc(r.role)}</span><p class="focus">${esc(r.focus)}</p><div class="metrics">${Object.entries(r.metrics).map(([k,v]) => `<div class="metric"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div><div class="researcher-cta">논문 ${fmt.format((r.papers || []).length)}건 보기</div></article>`).join('');
  $$('.researcher-card').forEach(card => {
    const open = () => researcherModal(DATA.researchers[Number(card.dataset.i)]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

function paperTabs() {
  let tabs = [['representative','전세계 대표'],['recent','최신'],['korea','한국'],['donga','동아대']];
  $('#paperTabs').innerHTML = tabs.map(([k,l],i) => `<button class="tab ${i ? '' : 'active'}" data-mode="${k}">${l}</button>`).join('');
  $('#paperTabs').onclick = e => { let b = e.target.closest('button'); if (!b) return; paperMode = b.dataset.mode; $$('#paperTabs .tab').forEach(x => x.classList.toggle('active', x === b)); papers(); };
  $('#paperSearch').oninput = papers;
  papers();
}

function cleanAuthors(a) { return String(a || '').replace(/<[^>]*>/g, '').replace(/�+/g, '').replace(/\s*;\s*/g, '; '); }

function papers() {
  let q = $('#paperSearch').value.toLowerCase().trim();
  let arr = (DATA.papers[paperMode] || []).filter(p => (p.title + ' ' + (p.authorDisplay || '') + ' ' + (p.doi || '') + ' ' + (p.resourceSource || '')).toLowerCase().includes(q));
  $('#paperList').innerHTML = arr.map((p, i) => `<article class="paper-card" data-i="${i}"><div class="paper-top"><a class="paper-title">${esc(p.title)}</a><span class="cite-chip">Cited ${fmt.format(p.cited || 0)}</span></div><div class="paper-meta">${p.year || '-'} · ${esc(p.source || '-')}</div>${p.authorDisplay ? `<div class="paper-authors">${esc(cleanAuthors(p.authorDisplay))}</div>` : ''}<div class="badges"><span class="badge scopus">Scopus</span>${p.resourceSource ? `<span class="badge wos">${esc(p.resourceSource)}</span>` : ''}${p.scopeNote ? `<span class="badge">${esc(p.scopeNote)}</span>` : ''}${p.doi ? `<span class="badge">DOI ${esc(p.doi)}</span>` : ''}</div></article>`).join('') || '<article class="panel">검색 결과가 없습니다.</article>';
  $$('.paper-card').forEach((c, idx) => c.onclick = () => openPaperModal(arr[idx]));
}

function closingCards() {
  const el = $('#closingCards');
  if (!el) return;
  el.innerHTML = (DATA.closingCards || []).map(c => {
    const logos = c.images ? `<div class="closing-logos">${c.images.map(img => `<img src="${esc(img.src)}" alt="${esc(img.alt)}">`).join('')}</div>` : '';
    return `<article class="closing-card reveal"><small>${esc(c.kicker)}</small><h3>${esc(c.title)}</h3><span class="closing-score">${esc(c.score)}</span>${logos}<p>${esc(c.body)}</p><ul>${(c.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul></article>`;
  }).join('');
}

function renderAnalysis() {
  function block(id, items, type) {
    let el = $(id); if (!el) return; if (type) el.dataset.type = type;
    el.innerHTML = `<div class="analysis-list">${items.map(x => `<p>${esc(x)}</p>`).join('')}</div>`;
  }
  block('#trendAnalysis', [...DATA.analysis.trend, ...DATA.analysis.country]);
  block('#keywordAnalysis', DATA.analysis.keyword, 'keyword');
  block('#paperAnalysis', DATA.analysis.papers, 'paper');
  block('#strategyAnalysis', DATA.analysis.strategy, 'strategy');
  block('#researcherAnalysis', DATA.analysis.researcher, 'researcher');
}

function sources() {
  const el = $('#referenceSections');
  if (!el) return;
  const groups = {};
  (DATA.references || []).forEach(r => {
    const key = r.type || '출처';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  el.innerHTML = Object.entries(groups).map(([type, items]) => `<section class="reference-group"><h3>${esc(type)} <small>${fmt.format(items.length)}</small></h3><ol class="reference-list">${items.map(r => `<li><span>${esc(type)}</span><p>${esc(r.text || '')}${r.url ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener">URL</a>` : ''}</p></li>`).join('')}</ol></section>`).join('');
}

function reveal() {
  let io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold: .08 });
  $$('.reveal,.panel,.section').forEach(e => { e.classList.add('reveal'); io.observe(e); });
  let links = $$('.site-header nav a'), secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-42% 0px -52% 0px' });
  secs.forEach(s => spy.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initHero(); trend(); donuts(); bars('#countryBars', DATA.countries); bars('#koreaBars', DATA.koreaInstitutions);
  $('#keywordTabs').innerHTML = ['global','korea','donga'].map((s,i) => `<button class="tab ${i ? '' : 'active'}" data-s="${s}">${scopeNames[s]}</button>`).join('');
  $('#keywordTabs').onclick = e => { let b = e.target.closest('button'); if (!b) return; $$('#keywordTabs .tab').forEach(x => x.classList.toggle('active', x === b)); wordcloud(b.dataset.s); };
  newsCards(); sdgVisuals(); figureCards(); wordcloud(); network(); researchers(); paperTabs(); closingCards(); renderAnalysis(); sources(); reveal();
  $('#modalClose').onclick = closeModal;
  $('#modalBackdrop').onclick = e => { if (e.target.id === 'modalBackdrop') closeModal(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); hideTip(); } });
  setTimeout(() => $('#loader').classList.add('done'), 450);
});
