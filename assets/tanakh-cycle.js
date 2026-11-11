// Tanakh reading-cycle pages (Appendix > Study Cycles). Expects a global
// CYCLE = { key, weekLabel, weekNames?, dayLabel?, catchUp?, plans: {"6"?: [day], "5": [day]} },
// set by layouts/siddur/tanakh-cycle.html. Each day row:
// { w, d, ref, p, np[], words, verses, end, inc, fin?, n?:{ref,b[],words,verses,end}, k?:{...} }.
// fin (closing words) shows after inc on wide screens only.
// Rows without n/k make a Torah-only cycle (no Torah/Nakh toggle).
// Only the 6/5-day and Torah/Nakh choice is remembered (localStorage).
(function () {
  const DAYS = { 6: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 5: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] };
  const CATCH = { 6: 'Shabbath: catch-up day', 5: 'Friday and Shabbath: catch-up days' };
  const MK = { petuha: ['פ', 'pe'], setuma: ['ס', 'pe'], book: ['פ', 'pe'], aliyah: ['al', ''], scene: ['sc', ''],
    chapter: ['ch', ''], psalm: ['ps', ''], stanza: ['st', ''], verse: ['v', ''], seder: ['sd', ''] };
  const KEY = 'siddur-cycle-' + CYCLE.key;
  const DEF = CYCLE.plans['6'] ? '6' : '5', NAKH = !!CYCLE.plans[DEF][0].n;
  const weeks = Math.max(...CYCLE.plans[DEF].map(r => r.w));
  const weekName = w => CYCLE.weekNames ? CYCLE.weekNames[w - 1] : CYCLE.weekLabel + ' ' + w;
  const $ = id => document.getElementById(id);

  let st = { plan: DEF, mode: 'both' };
  try { const v = JSON.parse(localStorage.getItem(KEY)) || {}; st = { plan: CYCLE.plans[v.plan] ? v.plan : DEF, mode: v.mode || 'both' }; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  const T = () => !NAKH || st.mode !== 'nakh', N = () => NAKH && st.mode !== 'torah';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tot = r => (T() ? r.words : 0) + (N() ? r.n.words + r.k.words : 0);
  const fmt = n => n.toLocaleString();
  // One bar segment; tabindex lets a tap show its data-tip (CSS, siddur.css).
  const seg = (cls, name, words, left, width) => {
    const tip = `${name}: ${fmt(words)} words`;
    return `<i class="${cls}" style="left:${left}%;width:${width}%" tabindex="0" data-tip="${tip}" aria-label="${tip}"></i>`;
  };

  function render() {
    const rows = CYCLE.plans[st.plan], words = rows.map(tot), n = rows.length;
    document.querySelectorAll('[data-plan]').forEach(b => b.setAttribute('aria-pressed', b.dataset.plan === st.plan));
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));

    const avg = words.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(words.reduce((s, w) => s + (w - avg) ** 2, 0) / n);
    const vs = rows.reduce((s, r) => s + (T() ? r.verses : 0) + (N() ? r.n.verses + r.k.verses : 0), 0) / n;
    $('cycle-stats').innerHTML = [
      [n, 'reading days'], [fmt(Math.round(avg)), 'words / day'],
      [fmt(Math.min(...words)) + '–' + fmt(Math.max(...words)), 'range'],
      [Math.round(sd), 'std. dev.'], [Math.round(vs), 'pĕsuqim / day']
    ].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('');
    const trackAvg = { t: r => r.words, m: r => r.n.words, k: r => r.k.words };
    document.querySelectorAll('[data-avg]').forEach(el => {
      el.textContent = ' · ' + fmt(Math.round(rows.reduce((s, r) => s + trackAvg[el.dataset.avg](r), 0) / n));
    });

    const scale = Math.max(...words) * 1.05, pct = x => Math.min(100, x / scale * 100);
    let html = '', opts = '';
    for (let w = 1; w <= weeks; w++) {
      const rs = rows.filter(r => r.w === w), first = rs[0];
      opts += `<option value="${w}">${esc(weekName(w))}</option>`;
      const heads = (T() ? [first.p] : []).concat(N() ? [first.n.b[0], first.k.b[0]] : []).map(esc).join(' · ');
      html += `<section class="cycle-week" id="w${w}"><h2><span>${esc(weekName(w))}</span>`
        + `<span class="cycle-heads" lang="he" dir="rtl">${heads}</span>`
        + `<span class="cycle-sum">${fmt(rs.reduce((s, r) => s + tot(r), 0))} words</span></h2><div class="cycle-card"><table>`;
      for (const r of rs) {
        const tp = T() ? pct(r.words) : 0, mp = N() ? Math.min(100 - tp, pct(r.n.words)) : 0, kp = N() ? Math.min(100 - tp - mp, pct(r.k.words)) : 0;
        const nc = T() ? 'line sub' : 'line';
        const [mk, cls] = MK[r.end], [mmk, mcls] = N() ? MK[r.n.end] : [], [kmk, kcls] = N() ? MK[r.k.end] : [];
        const ps = r.np.length ? ` <span class="ps">· ${r.np.map(esc).join(' · ')}</span>` : '';
        html += `<tr><td class="day">${CYCLE.dayLabel ? CYCLE.dayLabel + ' ' + r.d : DAYS[st.plan][r.d - 1]}</td>`
          + `<td class="ref">${T() ? `<span class="line">${esc(r.ref)}${r.np.length ? `<span class="ps ps-phone"> · <span lang="he" dir="rtl">${r.np.map(esc).join(' · ')}</span></span>` : ''}</span>${NAKH ? '' : `<span class="line sub inc-phone" lang="he" dir="rtl">${esc(r.inc)}</span>`}` : ''}${N() ? `<span class="${nc}">${esc(r.n.ref)}</span><span class="${nc}">${esc(r.k.ref)}</span>` : ''}</td>`
          + `<td class="heb" dir="rtl" lang="he">${T() ? `<span class="line"><span class="inc">${esc(r.inc)}</span>${r.fin ? ` <span class="fin">… ${esc(r.fin)}</span>` : ''}${ps}</span>` : ''}${N() ? `<span class="${nc}">${r.n.b.map(esc).join(' · ')}</span><span class="${nc}">${r.k.b.map(esc).join(' · ')}</span>` : ''}</td>`
          + `<td class="len"><div class="track">${T() ? seg('t', 'Torah', r.words, 0, tp) : ''}${N() ? seg('m', 'Nĕviʾim', r.n.words, tp, mp) + seg('k', 'Kĕthuvim', r.k.words, tp + mp, kp) : ''}</div><span>${tot(r)}</span></td>`
          + `<td class="end">${T() ? `<span class="cycle-mk ${cls}" title="Torah: ${r.end}">${mk}</span>` : ''}${N() ? `<span class="cycle-mk ${mcls}" title="Nĕviʾim: ${r.n.end}">${mmk}</span><span class="cycle-mk ${kcls}" title="Kĕthuvim: ${r.k.end}">${kmk}</span>` : ''}</td></tr>`;
      }
      html += `</table><div class="cycle-catch">${esc(CYCLE.catchUp || CATCH[st.plan])}</div></div></section>`;
    }
    $('cycle-weeks').innerHTML = html;
    const j = $('cycle-jump'), cur = j.value;
    j.innerHTML = opts;
    if (cur) j.value = cur;
  }

  document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { st.plan = b.dataset.plan; save(); render(); });
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; save(); render(); });
  $('cycle-jump').onchange = e => $('w' + e.target.value).scrollIntoView({ block: 'start' });
  render();
})();
