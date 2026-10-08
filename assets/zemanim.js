(function () {
  var RAD = Math.PI / 180;

  // Solar transit and hour angle for a civil date at (lat, lng east-positive),
  // per the standard "sunrise equation" (NOAA-style, good to about a minute
  // away from the polar circles). `altitude` is the sun's center in degrees
  // above the horizon: -0.833 for sea-level sunrise/sunset, -d for a
  // depression of d degrees. Returns [rise, set] as epoch ms, NaN if the sun
  // never reaches that altitude on that date.
  function sunTimes(y, m, d, lat, lng, altitude) {
    var n = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5 - 2451545 + 0.0008 - lng / 360;
    var M = (357.5291 + 0.98560028 * n) % 360 * RAD;
    var C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
    var L = (M / RAD + C + 180 + 102.9372) % 360 * RAD;
    var transit = 2451545 + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var sinDec = Math.sin(L) * Math.sin(23.4397 * RAD);
    var cosDec = Math.cos(Math.asin(sinDec));
    var w = Math.acos((Math.sin(altitude * RAD) - Math.sin(lat * RAD) * sinDec) /
      (Math.cos(lat * RAD) * cosDec)) / RAD / 360;
    return [transit - w, transit + w].map(function (jd) { return (jd - 2440587.5) * 864e5; });
  }

  // Gra: the day runs sunrise to sunset, divided into 12 sha'ot zemaniyot.
  // Rows are [label, epoch ms, rounding], where rounding picks the stringent
  // side of the minute: -1 rounds down (a latest time), 1 rounds up (an
  // earliest time), 0 rounds to nearest (cuts both ways). Labels follow the
  // siddur's transliteration schema (siddur-build/schema.mjs), capitalized.
  // 'Ammudh Hashshaḥar is the Rambam's fixed 72 minutes before sunrise.
  var DAWN = '\'Ammudh Hashshaḥar (72 min)';
  function zemanim(y, m, d, lat, lng) {
    var day = sunTimes(y, m, d, lat, lng, -0.833);
    var rise = day[0], set = day[1], hour = (set - rise) / 12;
    return [
      [DAWN, rise - 72 * 6e4, 0],
      ['Sunrise', rise, 1],
      ['Sof Zĕman Shĕma\' (Gra)', rise + 3 * hour, -1],
      ['Sof Zĕman Shaḥrith (Gra)', rise + 4 * hour, -1],
      ['Ḥăṣoth', rise + 6 * hour, 0],
      ['Minḥa Gĕdhola', rise + 6.5 * hour, 1],
      ['Minḥa Qĕṭanna', rise + 9.5 * hour, 1],
      ['Pĕlagh Hamminḥa', rise + 10.75 * hour, 0],
      ['Sunset', set, -1],
      ['Ṣeʾth Hakkokhavim (4.15°)', sunTimes(y, m, d, lat, lng, -4.15)[1], 1],
      ['Ṣeʾth Hakkokhavim (4.43°)', sunTimes(y, m, d, lat, lng, -4.43)[1], 1],
      ['Ṣeʾth Hakkokhavim (20 min)', set + 20 * 6e4, 1]
    ];
  }

  function roundMin(ms, mode) { return Math[['floor', 'round', 'ceil'][mode + 1]](ms / 6e4) * 6e4; }

  // The dial: sunrise at 0 (left), clockwise through Ḥăṣoth at 90 (top) and
  // sunset at 180 (right), then the night back around to the next sunrise at
  // 360. Each half is 12 proportional hours of 15 degrees, so day and night
  // always fill exactly half the circle whatever the season. Returns null
  // where there is no sunrise/sunset to hang it on.
  function dial(y, m, d, lat, lng) {
    var rows = zemanim(y, m, d, lat, lng), rise = rows[1][1], set = rows[8][1];
    var next = sunTimes(y, m, d + 1, lat, lng, -0.833)[0];
    var prevSet = sunTimes(y, m, d - 1, lat, lng, -0.833)[1];
    if (isNaN(rise) || isNaN(next) || isNaN(prevSet)) return null;
    var tzet = rows.slice(9).map(function (r) { return r[1]; }).filter(isFinite);
    var midnight = ['Ḥăṣoth Layla', (set + next) / 2, 0];
    // ponytail: where the night is under 144 minutes dawn falls before
    // midnight; the mark is dropped rather than drawn out of order.
    var dawn = next - 72 * 6e4;
    return {
      cardinal: [rows[1], rows[4], rows[8], midnight],
      // Twilight is one band out to the latest of the three Ṣeʾth times; they
      // sit within a degree or so of each other, too close to draw apart.
      // ponytail: where the sun never gets that low (high-latitude summer)
      // the band is dropped and the night shading shifts a step.
      marks: rows.slice(1, 9).concat([['Ṣeʾth Hakkokhavim', Math.max.apply(null, tzet), 1], midnight,
        [DAWN, dawn > midnight[1] ? dawn : NaN, 0], ['Sunrise', next, 1]])
        .filter(function (r) { return isFinite(r[1]); }),
      // Before sunrise we are still in the previous night.
      angle: function (t) {
        if (t < rise) return 180 + 180 * (t - prevSet) / (rise - prevSet);
        if (t <= set) return 180 * (t - rise) / (set - rise);
        return 180 + 180 * (t - set) / (next - set);
      }
    };
  }

  if (typeof document === 'undefined') {
    // `node assets/zemanim.js` self-check: Jerusalem at the March equinox.
    var assert = require('assert');
    var z = zemanim(2026, 3, 20, 31.778, 35.235);
    var near = function (ms, iso) { assert(Math.abs(ms - Date.parse(iso)) < 2 * 6e4, new Date(ms).toISOString() + ' vs ' + iso); };
    near(z[0][1], '2026-03-20T02:31:00Z');
    near(z[1][1], '2026-03-20T03:43:00Z');
    near(z[8][1], '2026-03-20T15:50:00Z');
    assert(z[11][1] > z[8][1] && z[10][1] > z[9][1] && z[9][1] > z[8][1]);
    assert(isNaN(sunTimes(2026, 6, 21, 80, 0, -0.833)[0]));
    assert.deepStrictEqual([-1, 0, 1].map(function (r) { return roundMin(90001, r); }), [6e4, 12e4, 12e4]);
    var D = dial(2026, 3, 20, 31.778, 35.235);
    var angles = D.marks.map(function (r) { return D.angle(r[1]); });
    assert(angles.every(function (a, i) { return i === 0 || a > angles[i - 1]; }), 'angles increase');
    assert.deepStrictEqual(D.cardinal.map(function (r) { return Math.round(D.angle(r[1])); }), [0, 90, 180, 270]);
    assert(Math.abs(D.angle(z[1][1] - 36e5) - 345) < 1, 'hour before sunrise sits in the previous night');
    assert.strictEqual(D.marks.length, 12);
    assert.strictEqual(D.marks[10][0], DAWN);
    assert.strictEqual(dial(2026, 6, 21, 80, 0), null);
    console.log('zemanim ok');
    return;
  }

  var dateInput = document.getElementById('zemanim-date');
  var latInput = document.getElementById('zemanim-lat');
  var lngInput = document.getElementById('zemanim-lng');
  var status = document.getElementById('zemanim-status');
  var tbody = document.getElementById('zemanim-body');
  var svg = document.getElementById('zemanim-dial');
  var KEY = 'siddur-zemanim-loc';
  var R = 100, r = 76;
  // Morning golds, a neutral half hour after midday, afternoon ambers,
  // twilight, the two halves of the night, then dawn.
  var COLORS = ['#eda52b', '#fae3a3', '#deab35', '#bdb6a6', '#f7cf9a', '#ee9f5a', '#d9612f',
    '#b891cc', '#3f4f8f', '#6c7fc4', '#e8a0a8'];
  var current = null; // the dial on screen, or null

  function fmt(row) {
    return isNaN(row[1]) ? '—' :
      new Date(roundMin(row[1], row[2])).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function today() {
    var now = new Date();
    return now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
  }
  function pt(a, rad) { return (-rad * Math.cos(a * RAD)).toFixed(2) + ' ' + (-rad * Math.sin(a * RAD)).toFixed(2); }

  function center(top, main, bottom) {
    [top, main, bottom].forEach(function (text, i) { svg.querySelector('#zemanim-c' + i).textContent = text; });
  }

  // Centre readout and travelling marker for the present moment; both blank
  // when another date is selected.
  function showNow() {
    if (!current) return;
    var sel = svg.querySelector('.selected');
    if (sel) sel.classList.remove('selected');
    var marker = svg.querySelector('#zemanim-now');
    var live = dateInput.value === today();
    marker.style.display = live ? '' : 'none';
    if (!live) return center('', '', 'Tap a section');
    var now = Date.now(), a = current.angle(now);
    marker.setAttribute('cx', pt(a, R + 9).split(' ')[0]);
    marker.setAttribute('cy', pt(a, R + 9).split(' ')[1]);
    center('Now', fmt(['', now, 0]), 'Hour ' + (Math.floor(a % 180 / 15) + 1) + ' of the ' + (a < 180 ? 'day' : 'night'));
  }

  function drawDial(y, m, d, lat, lng) {
    current = dial(y, m, d, lat, lng);
    if (!current) { svg.textContent = ''; return; }
    var marks = current.marks, h = '', i;
    for (i = 0; i < marks.length - 1; i++) {
      var a1 = current.angle(marks[i][1]), a2 = i === marks.length - 2 ? 360 : current.angle(marks[i + 1][1]);
      h += '<path class="zem-seg" tabindex="0" data-i="' + i + '" fill="' + COLORS[i] + '" d="M' + pt(a1, R) +
        'A' + R + ' ' + R + ' 0 0 1 ' + pt(a2, R) + 'L' + pt(a2, r) + 'A' + r + ' ' + r + ' 0 0 0 ' + pt(a1, r) + 'Z">' +
        '<title>' + marks[i][0] + ' – ' + marks[i + 1][0] + '</title></path>';
    }
    h += '<circle class="zem-edge" r="' + R + '"/><circle class="zem-edge" r="' + r + '"/>';
    for (i = 0; i < 24; i++) h += '<path class="zem-tick" d="M' + pt(i * 15, r - 3) + 'L' + pt(i * 15, r - 7) + '"/>';
    [[-118, -2, 'end'], [0, -130, 'middle'], [118, -2, 'start'], [0, 126, 'middle']].forEach(function (p, k) {
      var row = current.cardinal[k];
      h += '<text class="zem-muted" x="' + p[0] + '" y="' + p[1] + '" text-anchor="' + p[2] + '">' + row[0] + '</text>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 12) + '" text-anchor="' + p[2] + '">' + fmt(row) + '</text>';
    });
    h += '<text id="zemanim-c0" class="zem-muted" y="-16" text-anchor="middle"></text>' +
      '<text id="zemanim-c1" class="zem-main" y="3" text-anchor="middle"></text>' +
      '<text id="zemanim-c2" class="zem-muted" y="18" text-anchor="middle"></text>' +
      '<circle id="zemanim-now" class="zem-now" r="5"/>';
    svg.innerHTML = h;
    showNow();
  }

  function showSegment(el) {
    showNow();
    var i = +el.getAttribute('data-i'), from = current.marks[i], to = current.marks[i + 1];
    el.classList.add('selected');
    center(from[0], fmt(from) + ' – ' + fmt(to), to[0]);
  }
  svg.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-i')) showSegment(e.target); else showNow();
  });
  svg.addEventListener('focusin', function (e) { if (e.target.hasAttribute('data-i')) showSegment(e.target); });
  setInterval(function () { if (!svg.querySelector('.selected')) showNow(); }, 30000);

  function render() {
    var ymd = dateInput.value.split('-').map(Number);
    var lat = parseFloat(latInput.value), lng = parseFloat(lngInput.value);
    var valid = ymd.length === 3 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    tbody.textContent = '';
    if (!valid) { current = null; svg.textContent = ''; return; }
    try { localStorage.setItem(KEY, lat + ',' + lng); } catch (e) {}
    zemanim(ymd[0], ymd[1], ymd[2], lat, lng).forEach(function (row) {
      var tr = tbody.insertRow();
      tr.insertCell().textContent = row[0];
      tr.insertCell().textContent = fmt(row);
    });
    drawDial(ymd[0], ymd[1], ymd[2], lat, lng);
  }

  dateInput.value = today();
  try {
    var saved = (localStorage.getItem(KEY) || '').split(',');
    if (saved.length === 2) { latInput.value = saved[0]; lngInput.value = saved[1]; }
  } catch (e) {}
  [dateInput, latInput, lngInput].forEach(function (el) { el.addEventListener('input', render); });
  render();

  function manual() { status.textContent = 'Location unavailable — enter latitude and longitude.'; }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      latInput.value = pos.coords.latitude.toFixed(4);
      lngInput.value = pos.coords.longitude.toFixed(4);
      status.textContent = 'Using your current location.';
      render();
    }, manual, { timeout: 10000, maximumAge: 36e5 });
  } else manual();
})();
