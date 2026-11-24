(function () {
  "use strict";

  /* ============ แก้ข้อความตรงนี้ ============ */
  var NAME = "ฟ้าใส";                 // ชื่อที่เรียกแฟน
  var FROM = "Ainthat";                      // ชื่อผู้ส่ง (เว้นว่างได้)
  var MESSAGE = "Love You Chanetti";
  var DEFAULT_WISH = "love you";   // ใช้เมื่อเธอไม่ได้พิมพ์คำอธิษฐาน
  var MUSIC_SRC = "music.mp3";        // ไฟล์เพลง วางไว้โฟลเดอร์เดียวกับ index.html (ใส่ "" ถ้าไม่ต้องการเพลง)
  var MUSIC_VOLUME = 0.7;             // 0 ถึง 1
  /* ========================================== */

  var TAU = Math.PI * 2;
  var RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var SPEED = RM ? 0.35 : 1;

  /* ---------- ตัวเลือกกระทง ---------- */
  var SHAPES = [
    { name: "บัวบาน" },
    { name: "ใบตองพับ" },
    { name: "ทรงหัวใจ" }
  ];
  var FLOWERS = [
    { name: "บัวชมพู", kind: "pointed", p: ["#f2a9c6", "#f9cfe0", "#fff1f6"], center: "#ffd25e", dot: "#f2a9c6" },
    { name: "ดาวเรือง", kind: "round", p: ["#e08a1f", "#f2b035", "#ffd56a"], center: "#b8560a", dot: "#f2b035" },
    { name: "กล้วยไม้ม่วง", kind: "pointed", p: ["#8a5fd6", "#b58ae8", "#e6d4fa"], center: "#ffe9a8", dot: "#9d72e0" },
    { name: "มะลิขาว", kind: "small", p: ["#dedbd0", "#f3f0e6", "#ffffff"], center: "#e9d66b", dot: "#f3f0e6" }
  ];
  var LIGHTS = [
    { name: "เทียน ๑ ธูป ๓", candles: 1, incense: 3, big: false },
    { name: "เทียนคู่", candles: 2, incense: 0, big: false },
    { name: "เทียนใหญ่ ธูป ๒", candles: 1, incense: 2, big: true }
  ];
  var TABS = [
    { key: "shape", label: "ลักษณะ", list: SHAPES },
    { key: "flower", label: "ดอกไม้", list: FLOWERS },
    { key: "light", label: "ธูปเทียน", list: LIGHTS }
  ];

  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function byId(id) { return document.getElementById(id); }

  /* ---------- วาดกระทง (หน่วย: รัศมีฐาน = 60) ---------- */
  function petal(c, px, py, lean, hgt, wid, col, kind) {
    c.beginPath();
    if (kind === "pointed") {
      c.moveTo(px - wid / 2, py);
      c.quadraticCurveTo(px - wid / 2 + lean * 0.5, py - hgt * 0.62, px + lean, py - hgt);
      c.quadraticCurveTo(px + wid / 2 + lean * 0.5, py - hgt * 0.62, px + wid / 2, py);
      c.closePath();
    } else {
      var rh = hgt * (kind === "small" ? 0.38 : 0.5);
      var rw = wid * (kind === "small" ? 0.4 : 0.55);
      c.ellipse(px + lean * 0.5, py - rh, rw, rh, 0, 0, TAU);
    }
    c.fillStyle = col; c.fill();
    c.strokeStyle = "rgba(70,25,45,0.22)"; c.lineWidth = 0.8; c.stroke();
  }

  var RINGS = [
    { n: 11, r: 46, h: 26, w: 24, ci: 0, off: 0.0 },
    { n: 9, r: 33, h: 30, w: 22, ci: 1, off: 0.3 },
    { n: 7, r: 19, h: 32, w: 20, ci: 2, off: 0.1 }
  ];
  function petalsHalf(c, s, F, front) {
    var nf = F.kind === "pointed" ? 1 : (F.kind === "round" ? 1.5 : 1.8);
    var hf = F.kind === "pointed" ? 1 : 0.8;
    for (var k = 0; k < RINGS.length; k++) {
      var R = RINGS[k], n = Math.round(R.n * nf);
      for (var i = 0; i < n; i++) {
        var a = (i / n + R.off) * TAU, sn = Math.sin(a);
        if ((sn >= 0) !== front) continue;
        petal(c, Math.cos(a) * R.r * s, sn * R.r * 0.36 * s - 2 * s,
          Math.cos(a) * 8 * s, R.h * hf * s, R.w * s, F.p[R.ci], F.kind);
      }
    }
  }

  // ดอกไม้ดอกเล็กที่วางบนฐานใบตอง/หัวใจ
  function blossom(c, x, y, r, F) {
    var kind = F.kind, n = kind === "round" ? 9 : (kind === "small" ? 5 : 6);
    var ry = kind === "pointed" ? 0.2 : (kind === "round" ? 0.3 : 0.34);
    c.save();
    c.translate(x, y); c.scale(1, 0.62);
    for (var ring = 0; ring < 2; ring++) {
      var rr = ring === 0 ? r : r * 0.62;
      for (var i = 0; i < n; i++) {
        c.save();
        c.rotate(i / n * TAU + ring * 0.4);
        c.fillStyle = F.p[ring === 0 ? 0 : 1];
        c.strokeStyle = "rgba(60,20,40,0.22)"; c.lineWidth = 0.7;
        c.beginPath(); c.ellipse(rr * 0.55, 0, rr * 0.5, rr * ry * 1.4, 0, 0, TAU);
        c.fill(); c.stroke();
        c.restore();
      }
    }
    c.fillStyle = F.center;
    c.beginPath(); c.arc(0, 0, r * 0.2, 0, TAU); c.fill();
    c.restore();
  }
  function drawBlossoms(c, list, F) {
    list.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < list.length; i++) blossom(c, list[i].x, list[i].y, list[i].r, F);
  }

  function leafBlossoms(s) {
    var back = [], front = [], i, a, sn;
    for (i = 0; i < 7; i++) {
      a = i / 7 * TAU + 0.2; sn = Math.sin(a);
      (sn < 0 ? back : front).push({ x: Math.cos(a) * 28 * s, y: sn * 28 * 0.36 * s - 5 * s, r: 15 * s });
    }
    for (i = 0; i < 3; i++) {
      a = i / 3 * TAU + 0.9;
      front.push({ x: Math.cos(a) * 11 * s, y: Math.sin(a) * 11 * 0.36 * s - 11 * s, r: 14 * s });
    }
    return { back: back, front: front };
  }
  function heartPt(tt, k, s) {
    var hx = 16 * Math.pow(Math.sin(tt), 3);
    var hv = 13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt);
    return { x: hx * 3.9 * k * s, y: -hv * 3.9 * 0.42 * k * s - 3 * s };
  }
  function heartPath(c, s, k) {
    c.beginPath();
    for (var i = 0; i <= 60; i++) {
      var p = heartPt(i / 60 * TAU, k, s);
      if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.closePath();
  }
  function heartBlossoms(s) {
    var back = [], front = [], i, p;
    for (i = 0; i < 9; i++) {
      p = heartPt((i + 0.5) / 9 * TAU, 0.7, s);
      (p.y < -3 * s ? back : front).push({ x: p.x, y: p.y, r: 14 * s });
    }
    for (i = 0; i < 4; i++) {
      p = heartPt((i + 0.2) / 4 * TAU, 0.34, s);
      front.push({ x: p.x, y: p.y, r: 13 * s });
    }
    return { back: back, front: front };
  }

  function leafTips(c, s, front) {
    var n = 14;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU + 0.15;
      if ((Math.sin(a) >= 0) !== front) continue;
      var a1 = a - 0.17, a2 = a + 0.17;
      var b1x = Math.cos(a1) * 36 * s, b1y = Math.sin(a1) * 36 * 0.36 * s;
      var b2x = Math.cos(a2) * 36 * s, b2y = Math.sin(a2) * 36 * 0.36 * s;
      var tx = Math.cos(a) * 68 * s, ty = Math.sin(a) * 68 * 0.36 * s - 10 * s;
      var mx = Math.cos(a) * 54 * s, my = Math.sin(a) * 54 * 0.36 * s - 9 * s;
      c.beginPath();
      c.moveTo(b1x, b1y);
      c.quadraticCurveTo(mx + (b1x - b2x) * 0.9, my + (b1y - b2y) * 0.9, tx, ty);
      c.quadraticCurveTo(mx - (b1x - b2x) * 0.9, my - (b1y - b2y) * 0.9, b2x, b2y);
      c.closePath();
      c.fillStyle = i % 2 ? "#3a7c46" : "#2b6039"; c.fill();
      c.strokeStyle = "rgba(255,255,255,0.14)"; c.lineWidth = 0.8; c.stroke();
    }
  }

  function flame(c, s, x, fy, k, t, seed, fl) {
    var sway = RM ? 0 : Math.sin(t * 5 + seed) * 1.4;
    c.globalCompositeOperation = "lighter";
    var rad = 46 * s * k;
    var fg = c.createRadialGradient(x, fy - 5 * s, 0, x, fy - 5 * s, rad);
    fg.addColorStop(0, "rgba(255,175,70," + (0.5 * fl) + ")");
    fg.addColorStop(1, "rgba(255,175,70,0)");
    c.fillStyle = fg;
    c.beginPath(); c.arc(x, fy - 5 * s, rad, 0, TAU); c.fill();
    c.globalCompositeOperation = "source-over";
    var q = s * k;
    var bg = c.createLinearGradient(0, fy + 3 * q, 0, fy - 15 * q);
    bg.addColorStop(0, "#ff9a2e"); bg.addColorStop(0.5, "#ffd76a"); bg.addColorStop(1, "#fff6cf");
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(x, fy + 3 * q);
    c.bezierCurveTo(x - 6 * q, fy - 1 * q, x - 3 * q + sway * q * 0.3, fy - 8 * q, x + sway * q, fy - 15 * q * fl);
    c.bezierCurveTo(x + 3 * q + sway * q * 0.3, fy - 8 * q, x + 6 * q, fy - 1 * q, x, fy + 3 * q);
    c.fill();
  }

  function core(c, s, L, t, seed, fl) {
    var i;
    // ธูป
    var sticks = L.incense === 3 ? [[-12, -8, -27, -58], [12, -8, 27, -60], [7, -8, 15, -64]]
      : (L.incense === 2 ? [[-12, -8, -25, -56], [12, -8, 25, -56]] : []);
    c.lineCap = "round";
    for (i = 0; i < sticks.length; i++) {
      var d = sticks[i];
      c.strokeStyle = "#c9a36a"; c.lineWidth = 1.6 * s;
      c.beginPath(); c.moveTo(d[0] * s, d[1] * s); c.lineTo(d[2] * s, d[3] * s); c.stroke();
      c.fillStyle = "rgba(255,130,50," + (0.7 + 0.3 * fl) + ")";
      c.beginPath(); c.arc(d[2] * s, d[3] * s, 1.8 * s, 0, TAU); c.fill();
    }
    // เทียน
    var list = L.candles === 2
      ? [{ x: -15, h: 36, w: 6, k: 0.95 }, { x: 15, h: 30, w: 6, k: 0.95 }]
      : [{ x: 0, h: L.big ? 36 : 38, w: L.big ? 11 : 7, k: L.big ? 1.35 : 1 }];
    for (i = 0; i < list.length; i++) {
      var cd = list[i];
      c.fillStyle = "#fff1d0";
      c.fillRect((cd.x - cd.w / 2) * s, -(cd.h + 4) * s, cd.w * s, cd.h * s);
      c.fillStyle = "rgba(255,200,120,0.35)";
      c.fillRect((cd.x + cd.w * 0.15) * s, -(cd.h + 4) * s, cd.w * 0.35 * s, cd.h * s);
      flame(c, s, cd.x * s, -(cd.h + 5) * s, cd.k, t, seed + i * 1.7, fl);
    }
  }

  function drawKrathong(c, x, y, s, cfg, t, seed) {
    var F = FLOWERS[cfg.flower], L = LIGHTS[cfg.light], bl;
    var fl = 0.88 + 0.12 * Math.sin(t * 9 + seed) + 0.05 * Math.sin(t * 17 + seed * 3);
    if (RM) fl = 0.92;
    var gm = L.candles === 2 ? 1.3 : (L.big ? 1.25 : 1);
    c.save();
    c.translate(x, y);

    // แสงเทียนบนผิวน้ำ
    c.globalCompositeOperation = "lighter";
    c.save();
    c.scale(1, 0.32);
    var g = c.createRadialGradient(0, 0, 0, 0, 0, 100 * s * gm);
    g.addColorStop(0, "rgba(255,185,90," + Math.min(0.45, 0.34 * fl * gm) + ")");
    g.addColorStop(1, "rgba(255,185,90,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, 100 * s * gm, 0, TAU); c.fill();
    c.restore();
    c.globalCompositeOperation = "source-over";

    if (cfg.shape === 0) {
      // บัวบาน: กลีบตั้งเป็นชั้น
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.beginPath(); c.ellipse(0, 8 * s, 62 * s, 19 * s, 0, 0, TAU); c.fill();
      c.fillStyle = "#2d6a3e";
      c.beginPath(); c.ellipse(0, 1 * s, 60 * s, 19 * s, 0, 0, TAU); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, 1 * s, 52 * s, 15 * s, 0, 0, TAU); c.stroke();
      petalsHalf(c, s, F, false);
      core(c, s, L, t, seed, fl);
      petalsHalf(c, s, F, true);
    } else if (cfg.shape === 1) {
      // ใบตองพับ: ปลายใบตองรอบฐาน ดอกไม้วางด้านบน
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.beginPath(); c.ellipse(0, 8 * s, 64 * s, 19 * s, 0, 0, TAU); c.fill();
      c.fillStyle = "#245a34";
      c.beginPath(); c.ellipse(0, 1 * s, 56 * s, 17 * s, 0, 0, TAU); c.fill();
      leafTips(c, s, false);
      leafTips(c, s, true);
      bl = leafBlossoms(s);
      drawBlossoms(c, bl.back, F);
      core(c, s, L, t, seed, fl);
      drawBlossoms(c, bl.front, F);
    } else {
      // ทรงหัวใจ
      c.save();
      c.translate(0, 7 * s);
      heartPath(c, s, 1.04);
      c.fillStyle = "rgba(0,0,0,0.35)"; c.fill();
      c.restore();
      heartPath(c, s, 1);
      c.fillStyle = "#2d6a3e"; c.fill();
      c.strokeStyle = "rgba(255,255,255,0.16)"; c.lineWidth = 1; c.stroke();
      heartPath(c, s, 0.82);
      c.strokeStyle = "rgba(255,255,255,0.1)"; c.stroke();
      bl = heartBlossoms(s);
      drawBlossoms(c, bl.back, F);
      core(c, s, L, t, seed, fl);
      drawBlossoms(c, bl.front, F);
    }
    c.restore();
  }

  /* ---------- ฉากแม่น้ำ ---------- */
  var cv = byId("scene");
  var cx = cv.getContext("2d");
  var W = 0, H = 0, hy = 0, U = 1;
  var shore = [], i;

  var rs = rng(7), stars = [];
  for (i = 0; i < 110; i++) stars.push({ x: rs(), y: rs(), r: 0.4 + rs() * 1.1, ph: rs() * TAU });
  var rl = rng(33), lights = [];
  for (i = 0; i < 16; i++) lights.push({ x: rl(), ph: rl() * TAU });
  var rw = rng(52), glints = [];
  for (i = 0; i < 80; i++) glints.push({ x: rw(), y: rw(), len: 8 + rw() * 26, ph: rw() * TAU });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hy = H * 0.4;
    U = Math.min(W, 820) * 0.18 / 60;
    var r = rng(21);
    shore = [];
    for (var x = -10; x <= W + 20; x += 9) shore.push({ x: x, h: 10 + r() * 16 + Math.sin(x * 0.01) * 6 });
  }

  var ambient = [], ra = rng(91);
  for (i = 0; i < 7; i++) {
    ambient.push({
      d: 0.05 + ra() * 0.9, x: ra(), dir: ra() < 0.5 ? -1 : 1, seed: ra() * 20,
      cfg: { shape: Math.floor(ra() * 3), flower: Math.floor(ra() * 4), light: Math.floor(ra() * 3) }
    });
  }
  var lanterns = [], rn = rng(5);
  for (i = 0; i < 14; i++) lanterns.push({ x: rn(), y: rn(), vy: 9 + rn() * 14, s: 0.7 + rn() * 0.8, ph: rn() * TAU, fresh: true });

  var ripples = [];
  function ripple(x, y, max) { ripples.push({ x: x, y: y, r: 2, max: max || 60, a: 0.5 }); }

  var floaters = [];
  var cfg = { shape: 0, flower: 0, light: 0 };

  function chedi(x, base, h) {
    var w = h * 0.5;
    cx.beginPath();
    cx.moveTo(x - w / 2, base);
    cx.lineTo(x - w / 2, base - 0.1 * h);
    cx.lineTo(x - w * 0.4, base - 0.1 * h);
    cx.bezierCurveTo(x - w * 0.42, base - 0.45 * h, x - w * 0.14, base - 0.6 * h, x - w * 0.07, base - 0.66 * h);
    cx.lineTo(x - w * 0.03, base - 0.66 * h);
    cx.lineTo(x, base - h);
    cx.lineTo(x + w * 0.03, base - 0.66 * h);
    cx.lineTo(x + w * 0.07, base - 0.66 * h);
    cx.bezierCurveTo(x + w * 0.14, base - 0.6 * h, x + w * 0.42, base - 0.45 * h, x + w * 0.4, base - 0.1 * h);
    cx.lineTo(x + w / 2, base - 0.1 * h);
    cx.lineTo(x + w / 2, base);
    cx.closePath();
    cx.fill();
  }

  function floaterPos(f, t) {
    var age = t - f.t0;
    var p = clamp(age / 20, 0, 1);
    var e = 1 - (1 - p) * (1 - p);
    var x = f.x0 * W + Math.sin(age * 0.5 + f.seed) * 0.015 * W + e * 0.08 * W * f.dir + (age > 20 ? (age - 20) * 3 * f.dir : 0);
    var y = H * lerp(0.8, f.yEnd, e);
    var k = lerp(1, 0.62, e);
    var a = age > 55 ? clamp(1 - (age - 55) / 8, 0, 1) : 1;
    return { x: x, y: y, s: U * k, a: a, p: p, age: age };
  }

  var previewCtx = byId("preview").getContext("2d");
  var last = 0;

  function frame(ms) {
    var t = ms / 1000;
    var dt = Math.min(0.05, t - last) * SPEED; last = t;
    var c = cx, k, o;

    // ท้องฟ้า
    var sg = c.createLinearGradient(0, 0, 0, hy);
    sg.addColorStop(0, "#060a22"); sg.addColorStop(0.7, "#101a4a"); sg.addColorStop(1, "#2a2f6a");
    c.fillStyle = sg; c.fillRect(0, 0, W, hy + 1);

    for (k = 0; k < stars.length; k++) {
      o = stars[k];
      c.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.2 + o.ph));
      c.fillStyle = "#e9ecff";
      c.beginPath(); c.arc(o.x * W, o.y * hy * 0.92, o.r, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;

    // พระจันทร์เต็มดวง
    var mx = W * 0.76, my = hy * 0.38, mr = Math.min(W, H) * 0.06;
    var mg = c.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 5);
    mg.addColorStop(0, "rgba(255,240,200,0.30)"); mg.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = mg; c.beginPath(); c.arc(mx, my, mr * 5, 0, TAU); c.fill();
    c.fillStyle = "#fff4d6"; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
    c.fillStyle = "rgba(200,185,150,0.28)";
    c.beginPath(); c.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 0, TAU); c.fill();
    c.beginPath(); c.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.16, 0, TAU); c.fill();

    // โคมลอย
    c.globalCompositeOperation = "lighter";
    for (k = 0; k < lanterns.length; k++) {
      o = lanterns[k];
      if (o.fresh) { o.y = o.y * hy; o.fresh = false; }
      o.y -= o.vy * dt;
      if (o.y < -30) { o.y = hy - 4; o.x = Math.random(); }
      var lx = o.x * W + Math.sin(t * 0.4 + o.ph) * 12;
      var la = clamp((hy - o.y) / 30, 0, 1) * clamp(o.y / (hy * 0.25) + 0.4, 0, 1);
      var ls = o.s * (0.7 + 0.5 * (1 - o.y / hy));
      var lg = c.createRadialGradient(lx, o.y, 0, lx, o.y, 24 * ls);
      lg.addColorStop(0, "rgba(255,170,70," + (0.55 * la) + ")"); lg.addColorStop(1, "rgba(255,170,70,0)");
      c.fillStyle = lg; c.beginPath(); c.arc(lx, o.y, 24 * ls, 0, TAU); c.fill();
      c.fillStyle = "rgba(255,200,110," + (0.9 * la) + ")";
      c.fillRect(lx - 3 * ls, o.y - 4 * ls, 6 * ls, 8 * ls);
    }
    c.globalCompositeOperation = "source-over";

    // ฝั่งตรงข้าม: แนวต้นไม้ เจดีย์ แสงไฟ
    c.fillStyle = "#050919";
    c.beginPath(); c.moveTo(-10, hy + 2);
    for (k = 0; k < shore.length; k++) {
      o = shore[k];
      c.quadraticCurveTo(o.x, hy - o.h, o.x + 4.5, hy - o.h * 0.55);
    }
    c.lineTo(W + 20, hy + 2); c.closePath(); c.fill();
    var ch = Math.min(H * 0.14, 120);
    chedi(W * 0.2, hy - 2, ch);
    c.fillStyle = "rgba(255,210,120,0.9)";
    c.beginPath(); c.arc(W * 0.2, hy - 2 - ch, 1.8, 0, TAU); c.fill();
    for (k = 0; k < lights.length; k++) {
      o = lights[k];
      c.fillStyle = "rgba(255,205,120,0.85)";
      c.fillRect(o.x * W, hy - 4, 2, 2);
    }

    // ผิวน้ำ
    var wg = c.createLinearGradient(0, hy, 0, H);
    wg.addColorStop(0, "#14336a"); wg.addColorStop(1, "#070d26");
    c.fillStyle = wg; c.fillRect(0, hy, W, H - hy);
    var wh = H - hy;
    for (k = 0; k < lights.length; k++) {
      o = lights[k];
      c.fillStyle = "rgba(255,205,120," + (0.12 + 0.06 * Math.sin(t * 1.5 + o.ph)) + ")";
      c.fillRect(o.x * W - 0.5 + Math.sin(t + o.ph) * 1.5, hy + 2, 2, 20 + 14 * Math.sin(t * 0.7 + o.ph));
    }
    for (k = 0; k < 44; k++) {
      var mw = mr * (0.9 + 0.5 * Math.sin(t * 1.3 + k * 0.9)) * (1 - k / 56);
      c.fillStyle = "rgba(255,238,196," + (0.24 * (1 - k / 44)) + ")";
      c.fillRect(mx - mw / 2 + Math.sin(t + k) * 4, hy + 2 + k * (wh / 62), mw, 2);
    }
    for (k = 0; k < glints.length; k++) {
      o = glints[k];
      c.fillStyle = "rgba(200,220,255," + (0.05 + 0.06 * Math.sin(t * 0.8 + o.ph)) + ")";
      c.fillRect(o.x * W, hy + o.y * wh, o.len * (0.5 + o.y), 1);
    }

    // กระทงลอยอยู่ไกลๆ
    ambient.sort(function (a, b) { return a.d - b.d; });
    for (k = 0; k < ambient.length; k++) {
      o = ambient[k];
      o.x += o.dir * (6 + 14 * o.d) * dt / W;
      if (o.x < -0.1) o.x = 1.1; else if (o.x > 1.1) o.x = -0.1;
      var ay = hy + (0.12 + 0.55 * o.d) * wh + Math.sin(t * 0.8 + o.seed) * 1.2;
      c.globalAlpha = 0.85;
      drawKrathong(c, o.x * W, ay, U * (0.22 + 0.4 * o.d), o.cfg, t, o.seed);
    }
    c.globalAlpha = 1;

    // ระลอกน้ำ
    for (k = ripples.length - 1; k >= 0; k--) {
      o = ripples[k];
      o.r += 26 * dt; o.a -= 0.2 * dt;
      if (o.a <= 0 || o.r > o.max) { ripples.splice(k, 1); continue; }
      c.strokeStyle = "rgba(255,232,190," + o.a + ")"; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(o.x, o.y, o.r, o.r * 0.3, 0, 0, TAU); c.stroke();
    }

    // กระทงของเธอ
    for (k = floaters.length - 1; k >= 0; k--) {
      var f = floaters[k], ps = floaterPos(f, t);
      if (ps.age > 63) { floaters.splice(k, 1); continue; }
      if (t > f.nextRipple) {
        ripple(ps.x, ps.y + 6 * ps.s, 40 * ps.s + 20);
        f.nextRipple = t + (ps.p < 1 ? 0.9 : 2.2);
      }
    }
    floaters.slice().sort(function (a, b) { return floaterPos(a, t).y - floaterPos(b, t).y; }).forEach(function (f2) {
      var q = floaterPos(f2, t);
      c.globalAlpha = q.a;
      drawKrathong(c, q.x, q.y, q.s, f2.cfg, t, f2.seed);
    });
    c.globalAlpha = 1;

    // ตัวอย่างกระทงในแผงตกแต่ง
    previewCtx.setTransform(2, 0, 0, 2, 0, 0);
    previewCtx.clearRect(0, 0, 180, 108);
    drawKrathong(previewCtx, 90, 76, 1, cfg, t, 1.7);

    requestAnimationFrame(frame);
  }

  /* ---------- แผงตกแต่ง ---------- */
  var tab = 0;
  var tabBtns = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var optsEl = byId("opts");

  function renderTabs() {
    tabBtns.forEach(function (b, idx) { b.setAttribute("aria-pressed", idx === tab ? "true" : "false"); });
  }
  function renderOpts() {
    var T = TABS[tab];
    optsEl.textContent = "";
    optsEl.setAttribute("aria-label", T.label);
    T.list.forEach(function (opt, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", cfg[T.key] === idx ? "true" : "false");
      if (opt.dot) {
        var d = document.createElement("span");
        d.className = "dot";
        d.style.background = opt.dot;
        b.appendChild(d);
      }
      b.appendChild(document.createTextNode(opt.name));
      b.addEventListener("click", function () { cfg[T.key] = idx; renderOpts(); });
      optsEl.appendChild(b);
    });
  }
  tabBtns.forEach(function (b, idx) {
    b.addEventListener("click", function () { tab = idx; renderTabs(); renderOpts(); });
  });

  byId("toName").textContent = "ถึง " + NAME;
  byId("msgText").textContent = MESSAGE;
  if (FROM) byId("msgFrom").textContent = "จาก " + FROM;

  var wishEl = byId("wish");
  var countEl = byId("count");
  wishEl.addEventListener("input", function () { countEl.textContent = wishEl.value.length + "/80"; });

  var makePanel = byId("makePanel");
  var msgPanel = byId("msgPanel");
  var cap = byId("cap");
  var msgTimer = 0;

  function showPanel(el) {
    el.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove("out"); }); });
  }
  function hidePanel(el) {
    el.classList.add("out");
    setTimeout(function () { if (el.classList.contains("out")) el.hidden = true; }, RM ? 0 : 520);
  }

  /* ---------- เพลง ---------- */
  var song = byId("song");
  var musicBtn = byId("music");
  var musicLabel = byId("musicLabel");
  var musicOn = false, userMuted = false, musicOK = !!MUSIC_SRC, fadeTimer = 0;

  function setMusicUI() {
    musicBtn.setAttribute("aria-pressed", musicOn ? "true" : "false");
    if (musicOK) musicLabel.textContent = musicOn ? "ปิดเพลง" : "เปิดเพลง";
  }
  function fadeTo(v, ms) {
    clearInterval(fadeTimer);
    var from = song.volume, n = 0, steps = 20;
    fadeTimer = setInterval(function () {
      n++;
      song.volume = clamp(from + (v - from) * n / steps, 0, 1);
      if (n >= steps) { clearInterval(fadeTimer); if (v === 0) song.pause(); }
    }, ms / steps);
  }
  function startMusic() {
    if (!musicOK) return;
    var p;
    try { song.volume = 0; p = song.play(); } catch (e) { return; }
    var ok = function () { musicOn = true; setMusicUI(); fadeTo(MUSIC_VOLUME, 2000); };
    var fail = function () { musicOn = false; setMusicUI(); };
    if (p && p.then) p.then(ok, fail); else ok();
  }
  function stopMusic() { musicOn = false; setMusicUI(); fadeTo(0, 600); }

  if (!MUSIC_SRC) {
    musicBtn.hidden = true;
  } else {
    song.src = MUSIC_SRC;
    song.addEventListener("error", function () {
      musicOK = false; musicOn = false;
      musicBtn.disabled = true;
      musicBtn.setAttribute("aria-pressed", "false");
      musicLabel.textContent = "ไม่พบไฟล์เพลง";
    });
    musicBtn.addEventListener("click", function () {
      if (musicOn) { userMuted = true; stopMusic(); } else { userMuted = false; startMusic(); }
    });
  }

  /* ---------- ลอยกระทง ---------- */
  byId("launch").addEventListener("click", function () {
    var wish = wishEl.value.trim() || DEFAULT_WISH;
    var now = performance.now() / 1000;
    var f = {
      cfg: { shape: cfg.shape, flower: cfg.flower, light: cfg.light },
      t0: now, seed: Math.random() * 20,
      x0: 0.5 + (Math.random() - 0.5) * 0.2,
      dir: Math.random() < 0.5 ? -1 : 1,
      yEnd: 0.56 + Math.random() * 0.06,
      nextRipple: now + 0.9
    };
    floaters.push(f);
    if (floaters.length > 6) floaters.shift();
    var ps = floaterPos(f, now);
    ripple(ps.x, ps.y + 6 * ps.s, 90); ripple(ps.x, ps.y + 6 * ps.s, 70);
    byId("wishShown").textContent = "“" + wish + "”";
    cap.classList.add("show");
    hidePanel(makePanel);
    if (!musicOn && !userMuted) startMusic();
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { showPanel(msgPanel); }, RM ? 800 : 7500);
  });

  byId("again").addEventListener("click", function () {
    hidePanel(msgPanel);
    cap.classList.remove("show");
    wishEl.value = ""; countEl.textContent = "0/80";
    showPanel(makePanel);
  });

  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest(".panel, button")) return;
    if (e.clientY > hy) ripple(e.clientX, e.clientY, 80);
  });

  window.addEventListener("resize", resize);
  renderTabs();
  renderOpts();
  setMusicUI();
  resize();
  requestAnimationFrame(frame);
})();