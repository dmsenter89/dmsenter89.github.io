(function () {
  var html = document.documentElement;

  // Mobile off-canvas sidebar.
  var menuToggle = document.getElementById('siddur-menu-toggle');
  var sidebar = document.getElementById('siddur-sidebar');
  var backdrop = document.getElementById('siddur-sidebar-backdrop');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    backdrop.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
    backdrop.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && sidebar && backdrop) {
    menuToggle.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);
    sidebar.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeSidebar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });
  }

  // Light/dark toggle.
  var themeToggle = document.getElementById('siddur-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = html.getAttribute('data-theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = current ? current === 'dark' : prefersDark;
      var next = isDark ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('siddur-theme', next); } catch (e) {}
    });
  }

  // Hebrew / transliteration / translation display toggle.
  var toggleBtns = document.querySelectorAll('.siddur-toggle-btn[data-toggle-class]');
  function syncToggleButtons() {
    toggleBtns.forEach(function (btn) {
      var cls = btn.getAttribute('data-toggle-class');
      btn.setAttribute('aria-pressed', html.classList.contains(cls) ? 'true' : 'false');
    });
  }
  function saveDisplayState() {
    var active = ['show-hebrew', 'show-translit', 'show-translation'].filter(function (c) {
      return html.classList.contains(c);
    });
    try { localStorage.setItem('siddur-display', active.join(',')); } catch (e) {}
  }
  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cls = btn.getAttribute('data-toggle-class');
      html.classList.toggle(cls);
      syncToggleButtons();
      saveDisplayState();
    });
  });
  syncToggleButtons();

  // A link whose hash names a toggle radio (e.g. #siddur-toggle-kedushat-
  // hayom-shahrith, from a daily 'Amidah's Shabbat link) selects that option.
  function selectToggleFromHash() {
    var el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el || !el.classList.contains('siddur-toggle-group-radio')) return;
    el.checked = true;
    el.closest('.siddur-toggle-group').scrollIntoView();
  }
  selectToggleFromHash();
  window.addEventListener('hashchange', selectToggleFromHash);

  // Seasonal parts (Ya'aleh Weyavo, 'Al HanNissim, the Ten Days endings):
  // show only the ones that fit today's Hebrew date. See README, "Seasonal
  // parts". Until this runs (or if it can't), CSS shows every part, labeled.
  var parts = document.querySelectorAll('.siddur-part[data-when]');
  var hebFmt;
  try {
    hebFmt = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  } catch (e) {}
  if (!parts.length || !hebFmt) return;

  var NAMES = {
    'rosh-hodesh': 'Roʾsh Ḥodhesh',
    'hol-hamoed-pesah': 'Ḥol HamMoʿedh Pesaḥ',
    'hol-hamoed-sukkoth': 'Ḥol HamMoʿedh Sukkoth',
    'hanukka': 'Ḥănukka',
    'purim': 'Purim',
    'ten-days': 'the Ten Days of Tĕshuva'
  };

  // Local civil date -> { d: day of month, m: Hebrew month name }.
  function hebDate(date) {
    var out = {};
    hebFmt.formatToParts(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)))
      .forEach(function (p) {
        if (p.type === 'day') out.d = +p.value;
        if (p.type === 'month') out.m = p.value;
      });
    return out;
  }
  function addDays(date, n) {
    var x = new Date(date.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  // Ḥol HamMo'edh uses the Land of Israel's days; the extra Diaspora Yom Tov
  // day (16 Nisan / 16 Tishri) uses the Yom Tov page, which suppresses these.
  function occasionsOn(date) {
    var h = hebDate(date), o = [];
    if (h.d === 30 || (h.d === 1 && h.m !== 'Tishri')) o.push('rosh-hodesh');
    if (h.m === 'Tishri' && h.d <= 10) o.push('ten-days');
    if (h.m === 'Nisan' && h.d >= 16 && h.d <= 20) o.push('hol-hamoed-pesah');
    if (h.m === 'Tishri' && h.d >= 16 && h.d <= 21) o.push('hol-hamoed-sukkoth');
    if ((h.m === 'Adar' || h.m === 'Adar II') && h.d === 14) o.push('purim');
    for (var k = 0; k < 8; k++) {
      var b = hebDate(addDays(date, -k));
      if (b.m === 'Kislev' && b.d === 25) { o.push('hanukka'); break; }
    }
    return o;
  }

  var displayToggle = document.querySelector('.siddur-display-toggle');

  // 'Arvith belongs to the coming Hebrew day: from noon on, an evening
  // service (the 'Arvith page, or Shabbath's 'Arvith option) reads tomorrow.
  function serviceDate() {
    var now = new Date();
    var evening = (displayToggle && displayToggle.hasAttribute('data-evening')) ||
      document.querySelector('.siddur-toggle-group-radio[id$="-arvith"]:checked');
    return evening && now.getHours() >= 12 ? { date: addDays(now, 1), tonight: true } : { date: now };
  }

  // The Full 'Amidah takes the full additions; Abbreviated and Havinenu
  // take the short ones (Rabbi Abadi's one-line forms).
  function currentForm() {
    var r = document.querySelector('input[name="siddur-toggle-amidah-middle"]:checked');
    return r && !/-full$/.test(r.id) ? 'short' : 'full';
  }

  var note = document.createElement('p');
  note.className = 'siddur-today';
  note.hidden = true;
  var showAll = document.createElement('button');
  showAll.type = 'button';
  showAll.className = 'siddur-toggle-btn siddur-additions-btn';
  showAll.textContent = 'All additions';
  showAll.setAttribute('aria-pressed', 'false');
  showAll.addEventListener('click', function () {
    var on = html.classList.toggle('siddur-show-additions');
    showAll.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (displayToggle) {
    displayToggle.appendChild(showAll);
    displayToggle.insertAdjacentElement('afterend', note);
  }

  function apply() {
    var when = serviceDate(), occ = occasionsOn(when.date), form = currentForm(), shown = [];
    parts.forEach(function (p) {
      var spec = p.getAttribute('data-when'), negated = spec.charAt(0) === '!';
      var box = p.closest('[data-suppress]');
      var suppressed = box ? box.getAttribute('data-suppress').split(' ') : [];
      var keys = (negated ? spec.slice(1) : spec).split(' ').filter(function (k) {
        return suppressed.indexOf(k) < 0;
      });
      var hits = keys.filter(function (k) { return occ.indexOf(k) >= 0; });
      var formOk = !p.hasAttribute('data-form') || p.getAttribute('data-form') === form;
      var active = negated ? !hits.length : hits.length > 0 && formOk;
      p.classList.toggle('is-active', active);
      p.classList.toggle('is-suppressed', !negated && !keys.length);
      if (active && !negated) hits.forEach(function (k) { if (shown.indexOf(k) < 0) shown.push(k); });
    });
    note.hidden = !shown.length;
    note.textContent = shown.length
      ? (when.tonight ? 'Tonight' : 'Today') + ': additions for ' +
        shown.map(function (k) { return NAMES[k]; }).join(' and ') + ' are shown.'
      : '';
    html.classList.add('siddur-occasions');
  }
  apply();
  document.addEventListener('change', function (e) {
    if (e.target.classList && e.target.classList.contains('siddur-toggle-group-radio')) apply();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) apply();
  });
})();
