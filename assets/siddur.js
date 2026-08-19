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
    var active = ['show-hebrew', 'show-translit', 'show-translation', 'show-aliyot'].filter(function (c) {
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
})();
