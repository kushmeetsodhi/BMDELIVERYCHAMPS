/* BM Picking - warehouse map, routes and spot close-ups.
 *
 * Everything is drawn in millimetres from the Spanco layout
 * (SSS/1616-10/2026-27), the same geometry the slotting plan uses:
 * 10 rack rows, bays 2300 mm long with two pallet positions each
 * (P1 = the half nearer the front aisle), 4 levels.
 * Paths follow the aisles: along an aisle to the front cross-aisle,
 * across, and up the next aisle - never through a rack.
 */
(function () {
  var W = 31252, H = 33546, Y0 = 6446, BAY = 2300, FY = 29800;
  var RX = { 1: 0, 2: 4000, 3: 5250, 4: 9250, 5: 10500, 6: 16132, 7: 20221, 8: 21471, 9: 25559, 10: 26809 };
  var AX = { 1: 2500, 2: 2500, 3: 7750, 4: 7750, 5: 13816, 6: 18676, 7: 18676, 8: 24015, 9: 24015, 10: 29353 };
  var ROWZONE = { 1: 'nf', 2: 'nf', 3: 'bev', 4: 'bev', 5: 'bis', 6: 'chips', 7: 'chips', 8: 'chips', 9: 'chips', 10: 'chips' };
  var ZF = { bev: '#9DC3E6', chips: '#F8CB7F', bis: '#A9D18E', nf: '#C9B8E0' };
  var PACK = { x: 22150, y: 30150 }, STAGE = { x: 8300, y: 30150 };

  // Chocolate (cold) room, bottom right: door in the middle of its top wall, an aisle down the
  // middle, shelving units 1-4 on the left wall and 5-8 on the right, 1200 mm long, 5 shelves.
  var ROOM = { x: 28100, y: 27538, w: 3152, h: 6008, door: 29676, unitY0: 28000, unitGap: 1300 };
  // Aisle A6 (beside R10) and the room are reached through the open floor where R10's
  // last two bays would be: up at CX, across at CY.
  var CX = 27300, CY = 26200;

  function nbays(row) { return row >= 9 ? 8 : 10; }
  function geom(code) {
    var c = String(code), m = c.match(/^CR-(\d\d)-(\d)-([AB])$/);
    if (m) {
      var u = +m[1], i = (u - 1) % 4, left = u <= 4, yt = ROOM.unitY0 + i * ROOM.unitGap;
      var ux = left ? ROOM.x + 100 : ROOM.x + ROOM.w - 600;
      return { code: c, room: true, unit: u, shelf: +m[2], half: m[3], x: ux, y: yt, w: 500, h: 1200, ytop: yt, bw: 500, bh: 1200,
               sx: ux + 250, ty: yt + 600, cx: ROOM.door, ch: 'CR', west: left };
    }
    m = c.match(/^R(\d\d)-B(\d\d)-L(\d)-P(\d)(?:-S(\d)(?:-(\d))?)?$/);
    if (!m) return null;
    var row = +m[1], bay = +m[2], lv = +m[3], pos = +m[4];
    var ytop = Y0 + (nbays(row) - bay) * BAY, py = pos === 1 ? ytop + 1150 : ytop;
    return { code: c, row: row, bay: bay, level: lv, pos: pos, sec: m[5] ? +m[5] : 0, part: m[6] ? +m[6] : 0,
             x: RX[row], y: py, w: 1000, h: 1150, ytop: ytop, bw: 1000, bh: BAY, sx: RX[row] + 500,
             ax: AX[row], cx: AX[row], ch: 'A' + AX[row], ty: py + 575, west: RX[row] < AX[row] };
  }
  var BACK = { A29353: 1, CR: 1 };   // channels reached via the corridor at CX/CY
  // From the front aisle to a spot.
  function approach(g) {
    if (BACK[g.ch]) return [[CX, FY], [CX, CY], [g.cx, CY], [g.cx, g.ty]];
    return [[g.cx, FY], [g.cx, g.ty]];
  }
  // From a spot back out to the front aisle.
  function exitPts(p) { return approach(p).reverse().slice(1); }

  // Walking points from a place (packing, staging or a spot) to a spot.
  function leg(from, to) {
    var pts = [[from.x, from.y]];
    if (from.ch && from.ch === to.ch) { pts.push([to.cx, to.ty]); return pts; }
    if (from.ch && BACK[from.ch] && BACK[to.ch]) { pts.push([from.cx, CY], [to.cx, CY], [to.cx, to.ty]); return pts; }
    if (from.ch) exitPts(from).forEach(function (q) { pts.push(q); });
    else pts.push([from.x, FY]);
    approach(to).forEach(function (q) { pts.push(q); });
    return pts;
  }
  function legHome(from, home) {
    var pts = [[from.cx, from.ty]];
    exitPts(from).forEach(function (q) { pts.push(q); });
    pts.push([home.x, FY], [home.x, home.y]);
    return pts;
  }
  function spotPoint(g) { return { x: g.cx, y: g.ty, cx: g.cx, ty: g.ty, ch: g.ch }; }
  function dPath(pts) {
    var d = '', last = null;
    pts.forEach(function (p) { if (last && last[0] === p[0] && last[1] === p[1]) return; d += (d ? 'L' : 'M') + p[0] + ' ' + p[1]; last = p; });
    return d;
  }
  function plen(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); return s; }

  /* ---------- the floor (drawn once, reused) ---------- */
  var BASE = null;
  function base() {
    if (BASE) return BASE;
    var s = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="var(--map-floor)" stroke="var(--map-wall)" stroke-width="120"/>';
    function area(x, y, w, h, fill, label, fs) {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="250" fill="' + fill + '"/>';
      if (label) s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2) + '" font-size="' + (fs || 700) + '" text-anchor="middle" dominant-baseline="central" fill="var(--map-label)" font-weight="700">' + label + '</text>';
    }
    area(0, 0, 16132, 3086, 'var(--map-office)', 'Office', 800);
    area(16132, 0, 12460, 3086, 'var(--map-office)', 'Office', 800);
    // Chocolate (cold) room, bottom right, with its shelving units.
    area(ROOM.x, ROOM.y, ROOM.w, ROOM.h, 'var(--map-cold)', '', 0);
    s += '<line x1="' + (ROOM.door - 700) + '" y1="' + ROOM.y + '" x2="' + (ROOM.door + 700) + '" y2="' + ROOM.y + '" stroke="var(--map-floor)" stroke-width="160"/>';
    for (var u = 1; u <= 8; u++) {
      var gu = geom('CR-' + (u < 10 ? '0' : '') + u + '-1-A');
      s += '<rect x="' + gu.x + '" y="' + gu.y + '" width="500" height="1200" fill="#C8A27C" fill-opacity=".75" stroke="var(--map-rack)" stroke-width="40"/>';
      s += '<text x="' + gu.sx + '" y="' + (gu.y + 600) + '" font-size="300" text-anchor="middle" dominant-baseline="central" fill="var(--map-label)" font-weight="700">' + u + '</text>';
    }
    s += '<text x="' + ROOM.door + '" y="' + (ROOM.y + ROOM.h - 650) + '" font-size="420" text-anchor="middle" fill="var(--map-label)" font-weight="700">Chocolate</text>' +
         '<text x="' + ROOM.door + '" y="' + (ROOM.y + ROOM.h - 200) + '" font-size="420" text-anchor="middle" fill="var(--map-label)" font-weight="700">room</text>';
    area(1200, 30150, 14200, 1900, 'var(--map-stage)', 'STAGING', 900);
    area(1500, 32250, 12500, 1200, 'var(--map-office)', 'Order loading', 650);
    area(16500, 30150, 11300, 1700, 'var(--map-pack)', 'PACKING', 900);
    area(16500, 32050, 11300, 1400, 'var(--map-office)', 'Stock unloading', 650);
    s += '<line x1="16132" y1="3086" x2="16132" y2="29446" stroke="var(--map-wall)" stroke-width="140" stroke-dasharray="500 350"/>';
    for (var r = 1; r <= 10; r++) {
      var nb = nbays(r), z = ZF[ROWZONE[r]];
      for (var b = 1; b <= nb; b++) {
        var yt = Y0 + (nb - b) * BAY;
        s += '<rect x="' + RX[r] + '" y="' + yt + '" width="1000" height="' + BAY + '" fill="' + z + '" fill-opacity=".55" stroke="var(--map-rack)" stroke-width="45"/>';
        s += '<line x1="' + RX[r] + '" y1="' + (yt + 1150) + '" x2="' + (RX[r] + 1000) + '" y2="' + (yt + 1150) + '" stroke="var(--map-rack)" stroke-width="20" stroke-opacity=".5"/>';
      }
      // Back-to-back rows sit 250 mm apart, so their names are staggered.
      var hi = r === 2 || r === 4 || r === 7 || r === 9;
      s += '<text x="' + (RX[r] + 500) + '" y="' + (Y0 - (hi ? 1250 : 380)) + '" font-size="600" text-anchor="middle" fill="var(--map-label)" font-weight="700">R' + (r < 10 ? '0' : '') + r + '</text>';
    }
    BASE = s; return s;
  }

  /* ---------- a map with routes ---------- */
  // o: { view: [x,y,w,h], legs: [{pts, cls}], stops: [{g, n, cls}], target: geom, walker: [x,y], anim: bool }
  function svg(o) {
    var v = o.view || [-400, -400, W + 800, H + 800];
    var sw = Math.max(110, v[2] / 110);
    var s = '<svg class="wmap" viewBox="' + v.join(' ') + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' + base();
    if (o.target) {
      var t = o.target;
      s += '<rect class="tgt-bay" x="' + (t.x - 160) + '" y="' + (t.ytop - 160) + '" width="' + (t.bw + 320) + '" height="' + (t.bh + 320) + '" rx="200"/>';
      s += '<rect class="tgt" x="' + t.x + '" y="' + t.y + '" width="' + t.w + '" height="' + t.h + '"/>';
    }
    (o.legs || []).forEach(function (l, i) {
      s += '<path class="leg ' + (l.cls || '') + '" data-leg="' + i + '" d="' + dPath(l.pts) + '" stroke-width="' + sw + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    (o.stops || []).forEach(function (st, i) {
      var g = st.g, r = Math.max(420, v[2] / 55);
      s += '<g class="stop ' + (st.cls || '') + '" data-stop="' + i + '"><circle cx="' + g.sx + '" cy="' + g.ty + '" r="' + r + '"/><text x="' + g.sx + '" y="' + g.ty + '" font-size="' + (r * 1.15) + '" text-anchor="middle" dominant-baseline="central">' + st.n + '</text></g>';
    });
    if (o.walker) s += '<circle class="walker" cx="' + o.walker[0] + '" cy="' + o.walker[1] + '" r="' + Math.max(380, v[2] / 50) + '"/>';
    return s + '</svg>';
  }

  // A view that fits the given points, 4:3, at least 15 m wide, inside the building.
  function fit(pointsList, pad, ratio) {
    pad = pad || 2600; ratio = ratio || 0.75;
    var xs = [], ys = [];
    pointsList.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    var x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad, y0 = Math.min.apply(null, ys) - pad, y1 = Math.max.apply(null, ys) + pad;
    var w = Math.max(15000, x1 - x0), h = Math.max(w * ratio, y1 - y0); w = Math.max(w, h / ratio);
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var x = Math.min(Math.max(-400, cx - w / 2), W + 400 - w), y = Math.min(Math.max(-400, cy - h / 2), H + 400 - h);
    if (w > W + 800) x = -400 - (w - W - 800) / 2;
    if (h > H + 800) y = -400 - (h - H - 800) / 2;
    return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
  }

  /* ---------- animation ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(root, opts) {
    opts = opts || {};
    var on = opts.anim !== false && !reduce;
    var paths = root.querySelectorAll('path.leg'), total = opts.ms || 1300;
    var lens = [], sum = 0;
    paths.forEach(function (p) { var L = p.getTotalLength ? p.getTotalLength() : 0; lens.push(L); sum += L; });
    var stops = root.querySelectorAll('.stop'), walker = root.querySelector('.walker');
    if (!on) { stops.forEach(function (s) { s.style.opacity = 1; }); return; }
    var t0 = performance.now(), acc = 0, starts = [];
    lens.forEach(function (L) { starts.push(acc); acc += L; });
    paths.forEach(function (p, i) { p.style.strokeDasharray = lens[i] + ' ' + lens[i]; p.style.strokeDashoffset = lens[i]; });
    stops.forEach(function (s) { s.style.opacity = 0; });
    var stopAt = opts.stopAt || [];  // fraction of the drawing at which each stop appears
    function frame(now) {
      if (!root.isConnected) return;
      var f = Math.min(1, (now - t0) / total), done = f * sum;
      paths.forEach(function (p, i) { var d = Math.max(0, Math.min(lens[i], done - starts[i])); p.style.strokeDashoffset = lens[i] - d; });
      stops.forEach(function (s, i) { if (f >= (stopAt[i] != null ? stopAt[i] : 1)) { if (s.style.opacity !== '1') { s.style.opacity = 1; s.classList.add('pop'); } } });
      if (walker && paths[0] && lens[0]) { var pt = paths[0].getPointAtLength(Math.min(lens[0], done)); walker.setAttribute('cx', pt.x); walker.setAttribute('cy', pt.y); }
      if (f < 1) requestAnimationFrame(frame);
      else paths.forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
    }
    requestAnimationFrame(frame);
  }

  /* ---------- close-ups ---------- */
  // Front view of the bay, seen from the aisle: 4 levels, two positions.
  function bayFront(g) {
    var Wd = 240, Hd = 210, lvH = 44, x0 = 30, y0 = 18, pw = 95;
    var leftIsP1 = g.west;   // standing in the aisle facing a row on the west, the front aisle is on your left
    var s = '<svg class="closeup" viewBox="0 0 ' + Wd + ' ' + Hd + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="' + (x0 - 6) + '" y="' + (y0 - 6) + '" width="6" height="' + (lvH * 4 + 12) + '" fill="var(--map-rack)"/><rect x="' + (x0 + pw * 2) + '" y="' + (y0 - 6) + '" width="6" height="' + (lvH * 4 + 12) + '" fill="var(--map-rack)"/>';
    for (var lv = 3; lv >= 0; lv--) {
      var y = y0 + (3 - lv) * lvH;
      s += '<text x="' + (x0 - 12) + '" y="' + (y + lvH / 2) + '" font-size="11" text-anchor="end" dominant-baseline="central" fill="var(--muted)">L' + lv + '</text>';
      [0, 1].forEach(function (k) {
        var p = (k === 0) === leftIsP1 ? 1 : 2, hit = lv === g.level && p === g.pos;
        s += '<rect x="' + (x0 + k * pw + 3) + '" y="' + (y + 4) + '" width="' + (pw - 6) + '" height="' + (lvH - 10) + '" rx="4" class="' + (hit ? 'cu-hit' : 'cu-slot') + '"/>';
        if (hit) s += '<text x="' + (x0 + k * pw + pw / 2) + '" y="' + (y + lvH / 2 - 2) + '" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#fff">P' + p + '</text>';
      });
      s += '<rect x="' + (x0 - 2) + '" y="' + (y + lvH - 6) + '" width="' + (pw * 2 + 4) + '" height="4" fill="var(--map-rack)"/>';
    }
    var yb = y0 + lvH * 4 + 14;
    s += '<text x="' + (x0 + (leftIsP1 ? pw / 2 : pw * 1.5)) + '" y="' + yb + '" font-size="10" text-anchor="middle" fill="var(--muted)">P1 · front aisle side</text>';
    return s + '</svg>';
  }
  // Top view of a mixed pallet: S1 S2 at the aisle side, S3 S4 behind; parts 1-3 left to right.
  function palletTop(g) {
    var s = '<svg class="closeup" viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg">';
    var x0 = 20, y0 = 14, w = 160, h = 160;
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="6" fill="var(--map-office)" stroke="var(--map-rack)" stroke-width="2"/>';
    var Q = { 1: [0, 1], 2: [1, 1], 3: [0, 0], 4: [1, 0] };   // [col,row] with row 1 = aisle side (bottom)
    for (var sec = 1; sec <= 4; sec++) {
      var q = Q[sec], qx = x0 + q[0] * w / 2, qy = y0 + q[1] * h / 2, hit = sec === g.sec;
      if (hit && g.part) {
        s += '<rect x="' + (qx + 4) + '" y="' + (qy + 4) + '" width="' + (w / 2 - 8) + '" height="' + (h / 2 - 8) + '" rx="4" class="cu-slot"/>';
        var pwd = (w / 2 - 8) / 3;
        for (var k = 1; k <= 3; k++) {
          var on = k === g.part;
          s += '<rect x="' + (qx + 4 + (k - 1) * pwd + 1) + '" y="' + (qy + 6) + '" width="' + (pwd - 2) + '" height="' + (h / 2 - 12) + '" rx="3" class="' + (on ? 'cu-hit' : 'cu-part') + '"/>';
          s += '<text x="' + (qx + 4 + (k - .5) * pwd) + '" y="' + (qy + h / 4) + '" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="' + (on ? '#fff' : 'var(--muted)') + '">' + k + '</text>';
        }
      } else {
        s += '<rect x="' + (qx + 4) + '" y="' + (qy + 4) + '" width="' + (w / 2 - 8) + '" height="' + (h / 2 - 8) + '" rx="4" class="' + (hit ? 'cu-hit' : 'cu-slot') + '"/>';
        s += '<text x="' + (qx + w / 4) + '" y="' + (qy + h / 4) + '" font-size="15" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="' + (hit ? '#fff' : 'var(--muted)') + '">S' + sec + '</text>';
      }
    }
    s += '<text x="100" y="' + (y0 + h + 18) + '" font-size="10" text-anchor="middle" fill="var(--muted)">▼ aisle side (you stand here)</text>';
    return s + '</svg>';
  }

  // Front view of a chocolate-room shelving unit: 5 shelves, halves A (left) and B (right).
  function shelfFront(g) {
    var s = '<svg class="closeup" viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg">', x0 = 40, y0 = 10, w = 170, sh = 34;
    s += '<rect x="' + (x0 - 6) + '" y="' + y0 + '" width="6" height="' + (sh * 5 + 8) + '" fill="var(--map-rack)"/><rect x="' + (x0 + w) + '" y="' + y0 + '" width="6" height="' + (sh * 5 + 8) + '" fill="var(--map-rack)"/>';
    for (var n = 5; n >= 1; n--) {
      var y = y0 + (5 - n) * sh;
      s += '<text x="' + (x0 - 12) + '" y="' + (y + sh / 2) + '" font-size="11" text-anchor="end" dominant-baseline="central" fill="var(--muted)">' + n + '</text>';
      ['A', 'B'].forEach(function (hf, k) {
        var hit = n === g.shelf && hf === g.half;
        s += '<rect x="' + (x0 + k * w / 2 + 3) + '" y="' + (y + 4) + '" width="' + (w / 2 - 6) + '" height="' + (sh - 10) + '" rx="4" class="' + (hit ? 'cu-hit' : 'cu-slot') + '"/>';
        s += '<text x="' + (x0 + k * w / 2 + w / 4) + '" y="' + (y + sh / 2 - 1) + '" font-size="11" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="' + (hit ? '#fff' : 'var(--muted)') + '">' + hf + '</text>';
      });
      s += '<rect x="' + (x0 - 2) + '" y="' + (y + sh - 6) + '" width="' + (w + 4) + '" height="4" fill="var(--map-rack)"/>';
    }
    s += '<text x="' + (x0 + w / 2) + '" y="' + (y0 + sh * 5 + 24) + '" font-size="10" text-anchor="middle" fill="var(--muted)">Shelf 1 = bottom · A left, B right</text>';
    return s + '</svg>';
  }

  window.BMMAP = { W: W, H: H, PACK: PACK, STAGE: STAGE, geom: geom, leg: leg, legHome: legHome, spotPoint: spotPoint, plen: plen,
                   svg: svg, fit: fit, animate: animate, bayFront: bayFront, palletTop: palletTop, shelfFront: shelfFront };
})();
