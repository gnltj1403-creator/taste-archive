/* 카드형 · sig.js v2.0 — 무의존 classic script (file:// 더블클릭으로도 동작). </body> 바로 앞에서 읽는다.
   레퍼런스 Jack McEntee 의 동작을 아카이브 전체에 옮긴다. 타이밍 출처는 EXTRACTION.md §1.
   1) my-style.css 의 --my-* (+ 고유 --ca-auto) 를 읽어 <html> 클래스와 색(--ca-*)을 만든다
   2) 대표 제목(h1) 크기: 폰트 로드 후 가장 긴 어절 폭을 재서 칸을 넘으면 줄인다(어절 중간에서 끊지 않음)
   3) 카드 줄(.ca-track, 1장·3장·4장): 4열 위 연 카드 하나만 3열, 다음 카드가 넷째 열에 흐리게.
      진행 막대가 차면(기본 5초) .85초에 한 칸 밀림. 화면 밖·마우스 위·초점·상세 열림이면 멈춤. 걸린 카드를 누르면 그 카드로
   4) 카드(이름·사진·More)를 누르면 상세: 바탕색으로 .35초에 덮이고 큰 문장 + 원본 비율 사진 + Prev/Next. Return·Esc로 닫힘
   5) 하단 고정 메뉴: 지금 보고 있는 장 칸에 굵은 선(현재 위치)
   6) 2026-10-20 2차 학생 요청 네 가지: ① 3장 공간 — 장소 이름을 눌러 고르면 그 장소 사진 강조·나머지 흐림(390은 고른 장소 사진만 펼침)
      ② 상세 열기·닫기 — 목록 사진이 상세 사진 자리로 커졌다가 닫으면 원래 자리로 돌아옴(스크롤 위치 유지)
      ③ 상단 메뉴 — 지금 장 글자 아래 짧은 밑줄이 칸 사이를 미끄러짐(메뉴 이동은 부드럽게)
      ④ 첫 화면 — 대표 제목이 한 번 나타나고 `취향 둘러보기` 버튼이 1장으로 안내. 모든 움직임은 --my-motion 0 · 동작 줄이기에서 꺼진다
   스크롤을 가로채지 않는다(메뉴·버튼을 눌렀을 때만 부드럽게 따라간다). */
(function () {
  var D = document, R = D.documentElement;
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  var CS = getComputedStyle(R);
  function my(k, d) { var v = CS.getPropertyValue(k).trim().replace(/["']/g, ''); return v || d; }
  function pick(v, list, d) { return list.indexOf(v) > -1 ? v : d; }
  var TYPE = pick(my('--my-type', 'sans'), ['sans', 'serif', 'mono', 'hand'], 'sans');
  var MOTION = pick(my('--my-motion', '1'), ['0', '1', '2'], '1');
  var DENS = pick(my('--my-density', '1'), ['0', '1', '2'], '1');
  var IMG = pick(my('--my-image', 'native'), ['native', 'original', 'mono', 'tint'], 'native');
  var AUTO = parseFloat(my('--ca-auto', '5')); if (!(AUTO >= 0)) AUTO = 5; if (AUTO > 0 && AUTO < 3) AUTO = 3;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) MOTION = '0';
  if (MOTION === '0') AUTO = 0;
  R.classList.add('js', 't-' + TYPE, 'm' + MOTION, 'd' + DENS, 'i-' + IMG);
  R.style.setProperty('--ca-auto', AUTO + 's');
  var REPORT = [];
  /* ── 첫 화면 대표 제목 · 버튼: 한 번 부드럽게 나타남 (2026-10-20 2차 학생 요청) ──
     글꼴·첫 화면 사진이 준비된 뒤 html 에 hero-in 이 붙으면 CSS 가 한 번 재생한다. 아래 타이머는 안전장치(1.6초 뒤엔 무조건 보인다) */
  var heroInOn = false;
  function heroIn() { if (heroInOn) return; heroInOn = true; R.classList.add('hero-in'); }
  setTimeout(heroIn, 1600);
  /* ── 메뉴 언어 (my-style.css --my-menu-lang: ko | en · 7주 패치 2026-10-07) ──
     메뉴 다섯 칸의 말을 한글 세트(시선·사람·공간·물건·기준) ↔ 영문 세트(Gaze·People·Spaces·Objects·Criteria)로 바꾼다.
     줄이 없거나 값이 ko·en이 아니면 HTML 글자를 그대로 둔다. 영문이면 그 칸에 lang="en"(영문 자간·높이 값을 탄다) */
  (function () {
    var L = my('--my-menu-lang', '').toLowerCase(); if (L !== 'ko' && L !== 'en') return;
    var KO = ['시선', '사람', '공간', '물건', '기준'], EN = ['Gaze', 'People', 'Spaces', 'Objects', 'Criteria'];
    var TO = L === 'en' ? EN : KO;
    $$('.ca-menu a').forEach(function (a) {
      var w = D.createTreeWalker(a, 4), n, hit = false;
      while ((n = w.nextNode())) {
        var t = n.nodeValue.trim(), i = KO.indexOf(t); if (i < 0) i = EN.indexOf(t);
        if (i > -1) { n.nodeValue = n.nodeValue.replace(t, TO[i]); hit = true; }
      }
      if (hit) { if (L === 'en') a.setAttribute('lang', 'en'); else a.removeAttribute('lang'); }
    });
    R.classList.add('menu-' + L);
  })();


  /* ── 1. 색: --my-bg · --my-point → 종이 · 먹 · 포인트 ── */
  var cvs = D.createElement('canvas').getContext('2d');
  function rgb(s) {
    if (!s || s === 'none') return null;
    cvs.fillStyle = '#010203'; cvs.fillStyle = s; var f = cvs.fillStyle;
    if (f === '#010203' && s.toLowerCase() !== '#010203') return null;
    if (f[0] === '#') return [parseInt(f.substr(1, 2), 16), parseInt(f.substr(3, 2), 16), parseInt(f.substr(5, 2), 16)];
    var m = f.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : null;
  }
  function mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function lum(c) { return c.map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [.2126, .7152, .0722][i]; }, 0); }
  function con(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function css(c) { return 'rgb(' + c.join(',') + ')'; }
  var WHITE = [255, 255, 255], BLACK = [0, 0, 0];
  var REF_INK = rgb(my('--ca-ref-ink', '#292929')) || [41, 41, 41];
  var BG = rgb(my('--my-bg', '#FFFFFF')) || rgb(my('--ca-ref-paper', '#FFFFFF'));
  var PT = rgb(my('--my-point', 'none'));
  var light = con(BG, BLACK) >= con(BG, WHITE);   /* 바탕에 먹·흰 중 더 잘 읽히는 쪽 (중간 명도 바탕도 4.5:1 보장) */
  var INK = light ? REF_INK : mix(BG, WHITE, .9);
  if (con(INK, BG) < 4.5) { INK = light ? BLACK : WHITE; REPORT.push('대비 보정: 글자색을 바탕에 맞춰 더 진하게/밝게 바꿈(바탕은 그대로)'); }
  var POINT = PT || INK;
  var S = R.style;
  S.setProperty('--ca-paper', css(BG)); S.setProperty('--ca-ink', css(INK)); S.setProperty('--ca-point', css(POINT));
  S.setProperty('--ca-on-point', css(con(POINT, BG) > con(POINT, INK) ? BG : INK));
  S.setProperty('--ca-plane', css(mix(BG, INK, .06)));
  /* 흐린 글자(걸린 카드 캡션 · 작은 글)도 4.5:1 아래로 내려가지 않게: 바탕 위 먹을 얼마나 옅게 할지 대비로 정한다 */
  function dimFor(target) { var a = 1; for (var k = 100; k >= 20; k--) { if (con(mix(BG, INK, k / 100), BG) >= target) a = k / 100; else break; } return a; }
  /* 목표 7:1 — 13~15px 가는 글자는 화면에서 이론값보다 옅게 보여(실측 약 −30%) 4.5:1 을 넘기려면 계산값을 더 높게 잡는다 */
  var DIM = dimFor(7);
  S.setProperty('--ca-dim', String(Math.max(DIM, .5)));
  S.setProperty('--ca-soft', String(Math.max(DIM, .7)));

  /* ── 2. 사진 정리 · 대표 사진 비율 ── */
  $$('figure').forEach(function (f) { var im = $('img', f); if (im && !im.getAttribute('src')) f.parentNode.removeChild(f); });
  var hero = $('.ca-hero img');
  if (hero && !hero.parentNode.classList.contains('ca-hero--full') && (+hero.getAttribute('height') > +hero.getAttribute('width'))) hero.parentNode.classList.add('is-tall');
  $$('img').forEach(function (im) {
    im.addEventListener('error', function () { var f = im.closest('figure'); REPORT.push('사진 없음: ' + im.getAttribute('src')); if (f) f.parentNode.removeChild(f); relayout(); flush(); });
  });
  if (!$('main img, .ca-top img')) REPORT.push('사진 0장: 카드는 글만 섭니다');

  /* ── 2-1. 히어로 사진 위 글자 (§I-6): 글자 바로 뒤 사진 영역을 canvas 로 재서 먹/바탕색 중 대비가 높은 쪽.
     글자 뒤 픽셀의 아래 10%까지 4.5:1(24px 이상 3:1)을 넘지 못하거나 canvas 를 못 읽으면(file:// 등) 바탕색 판 ── */
  var hTop = $('.ca-top--hero'), hImg = hTop && $('.ca-hero--full img', hTop), hT = hTop && $('.ca-hero-t', hTop);
  var hH1 = hT && $('.ca-h1', hT);
  if (hH1 && !$('.ca-h1-in', hH1)) { var hin = D.createElement('span'); hin.className = 'ca-h1-in'; while (hH1.firstChild) hin.appendChild(hH1.firstChild); hH1.appendChild(hin); }
  var hCv = D.createElement('canvas'), hCx = hCv.getContext('2d', { willReadFrequently: true });
  function heroPix(rects) {
    var ir = hImg.getBoundingClientRect(), nw = hImg.naturalWidth, nh = hImg.naturalHeight; if (!nw || !nh) return null;
    var sc = Math.max(ir.width / nw, ir.height / nh), ox = (ir.width - nw * sc) / 2, oy = (ir.height - nh * sc) / 2, px = [];
    for (var k = 0; k < rects.length; k++) {
      var r = rects[k]; if (r.width < 1 || r.height < 1) continue;
      var w = Math.max(4, Math.min(240, Math.round(r.width / 2))), h = Math.max(4, Math.min(60, Math.round(r.height / 2)));
      hCv.width = w; hCv.height = h;
      hCx.drawImage(hImg, (r.left - ir.left - ox) / sc, (r.top - ir.top - oy) / sc, r.width / sc, r.height / sc, 0, 0, w, h);
      var d = hCx.getImageData(0, 0, w, h).data;   /* 타인트면 여기서 throw */
      for (var i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    }
    return px;
  }
  function heroPick(el, rects, big) {
    var need = big ? 3 : 4.5, px = null;
    try { px = heroPix(rects); } catch (e) { px = null; }
    if (!px || !px.length) return null;
    var best = null;
    [INK, BG].forEach(function (c) {
      var cs = px.map(function (q) { return con(c, q); }).sort(function (a, b) { return a - b; });
      var lo = cs[Math.floor(cs.length * .05)];   /* 글자 뒤 가장 나쁜 5% 픽셀까지 기준 통과 */
      if (!best || lo > best.lo) best = { c: c, lo: lo };
    });
    return best.lo >= need ? best.c : null;
  }
  function heroText() {
    if (!hTop || !hImg || !hT) return;
    var row = $('.ca-row', hT), parts = [];
    if (row) parts.push({ el: row, rects: [row.getBoundingClientRect()], big: false });
    if (hH1) { var rg = D.createRange(); rg.selectNodeContents($('.ca-h1-in', hH1) || hH1); parts.push({ el: hH1, rects: Array.prototype.slice.call(rg.getClientRects()), big: parseFloat(getComputedStyle(hH1).fontSize) >= 24 }); }
    var plate = false;
    parts.forEach(function (p) {
      p.el.classList.remove('is-plate'); p.el.style.removeProperty('--ca-hero-c');
      var c = hImg.complete ? heroPick(p.el, p.rects, p.big) : null;
      if (c) p.el.style.setProperty('--ca-hero-c', css(c)); else { p.el.classList.add('is-plate'); plate = true; }
    });
    hTop.dataset.heroText = plate ? 'plate' : 'auto';
  }
  if (hImg) hImg.addEventListener('load', function () { heroText(); gnbState(); });

  /* ── 2-2. 상단 고정 바(GNB): 첫 화면 사진 위면 면 없이 글자색을 사진 명도로(§I-6, 못 재거나 애매하면 면), 본문 위면 바탕 88% 면 + 흐림(§I-5).
     390: 이름 + Info 접기(누르면 펼침, Close ×·Esc·바깥 누르기로 닫힘) ── */
  var gnb = $('.ca-gnb'), gBtn = gnb && $('.ca-gnb-btn', gnb), gMore = gnb && $('.ca-gnb-more', gnb);
  function gnbH() { if (gnb) R.style.setProperty('--ca-gnb-h', Math.ceil(gnb.getBoundingClientRect().height) + 'px'); }
  function gnbOpen(on) {
    if (!gnb || !gBtn) return; gnb.classList.toggle('is-open', on); gBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    $('span', gBtn).textContent = on ? 'Close ×' : 'Info'; gnbState();
  }
  function gnbState() {
    if (!gnb) return;
    var on = false;
    if (hImg && hTop && !gnb.classList.contains('is-open') && !detailOn) {
      var hb = hTop.getBoundingClientRect().bottom, gr = gnb.getBoundingClientRect();
      if (hb >= gr.bottom) {
        var cells = $$('.ca-gnb-name, .ca-menu a', gnb).filter(function (k) { return k.offsetParent; }).map(function (k) { return k.getBoundingClientRect(); });
        var c = hImg.complete ? heroPick(gnb, cells, false) : null;
        if (c) { on = true; gnb.style.setProperty('--ca-gnb-c', css(c)); }
      }
    }
    gnb.classList.toggle('on-hero', on);
  }
  var gName = gnb && $('.ca-gnb-name a', gnb);
  if (gName) gName.addEventListener('click', function (e) {   /* 이름 = 메인(첫 화면)으로 — 상세가 열려 있으면 닫고 맨 위로 (2026-10-07 교수 지시) */
    e.preventDefault();
    var wasOpen = detailOn;
    if (detailOn) closeDetail(true);
    setTimeout(function () {   /* 상세를 닫은 직후의 포커스·위치 복귀가 끝난 뒤 맨 위로 */
      R.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); R.style.scrollBehavior = '';
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    }, wasOpen ? 60 : 0);
  });
  if (gBtn) {
    gBtn.addEventListener('click', function () { gnbOpen(!gnb.classList.contains('is-open')); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gnb.classList.contains('is-open')) { gnbOpen(false); gBtn.focus(); } });
    D.addEventListener('click', function (e) { if (gnb.classList.contains('is-open') && !gnb.contains(e.target)) gnbOpen(false); });
  }
  var gTick = false; addEventListener('scroll', function () { if (!gTick) { gTick = true; requestAnimationFrame(function () { gTick = false; gnbState(); }); } }, { passive: true });

  /* ── 3. 대표 제목 폭 맞춤 ── */
  function fitH1() {
    var h1 = $('.ca-h1'); if (!h1) return;
    h1.style.removeProperty('--ca-h1-fit');
    var base = parseFloat(getComputedStyle(h1).fontSize), W = h1.clientWidth;
    var words = h1.textContent.trim().split(/\s+/), probe = D.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
    h1.appendChild(probe); var widest = 0;
    words.forEach(function (w) { probe.textContent = w; widest = Math.max(widest, probe.getBoundingClientRect().width); });
    h1.removeChild(probe);
    if (widest > W && widest > 0) { var size = Math.floor(base * W / widest * 0.98); h1.style.setProperty('--ca-h1-fit', size + 'px'); h1.dataset.fit = size; }
  }

  /* ── 4. 카드 준비 (모든 장 공통) ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function txtOf(c, s) { var e = c.querySelector(s); return e ? e.textContent.trim() : ''; }
  var groups = $$('.ca-track, .ca-grid');
  groups.forEach(function (g) {
    $$('.ca-card', g).forEach(function (card, i) {
      $$('.ca-lead, .ca-why, .ca-when', card).forEach(function (el) { if (!el.textContent.trim()) el.parentNode.removeChild(el); });
      var body = $('.ca-body', card); if (!body) { body = D.createElement('div'); body.className = 'ca-body'; card.appendChild(body); }
      var figs = $$('.ca-fig', card);
      if (figs.length) { var fi = $('img', figs[0]); if (fi && +fi.getAttribute('width')) card.style.setProperty('--ca-ar', fi.getAttribute('width') + ' / ' + fi.getAttribute('height')); }
      if (figs.length && !$('.ca-figs', card)) { var w = D.createElement('div'); w.className = 'ca-figs'; body.insertBefore(w, body.firstChild); figs.forEach(function (f) { w.appendChild(f); }); }
      var shown = Math.min(figs.length, g.classList.contains('ca-grid') ? 1 : 2);
      card.style.setProperty('--ca-why-span', String(Math.max(1, 3 - shown)));
      if (!$('.ca-txt', body)) {
        var tx = D.createElement('div'); tx.className = 'ca-txt'; var wy = $('.ca-why', body); if (wy) tx.appendChild(wy);
        var m = D.createElement('button'); m.type = 'button'; m.className = 'ca-more'; m.textContent = 'More'; tx.appendChild(m); body.appendChild(tx);
      }
      var cap = $('.ca-cap', card);
      if (g.classList.contains('ca-track') && $$('.ca-card', g).length > 5 && cap && !$('.ca-timer', cap)) { var t = D.createElement('span'); t.className = 'ca-timer'; t.setAttribute('aria-hidden', 'true'); cap.appendChild(t); }
      var nm = $('.ca-name', card), sec = card.closest('section'), lab = sec && $('.ca-label', sec);
      if (!$('.ca-why', card)) REPORT.push('이유 칸이 비었습니다: ' + (lab ? lab.textContent.trim() + ' ' : '') + (i + 1));
    });
  });
  var cm = $$('.ca-state'); cm.forEach(function (s) { var t = $('.ca-state-t', s); if (!t || !t.textContent.trim()) s.parentNode.removeChild(s); });
  $$('.ca-lead').forEach(function (el) { if (!el.textContent.trim()) el.parentNode.removeChild(el); });

  /* ── 5. 카드 줄 엔진 ── */
  var mq = window.matchMedia('(max-width: 768px)');
  function stacked() { return mq.matches; }
  var detailOn = false, tracks = [];
  $$('.ca-track').forEach(function (track) {
    var cards = $$('.ca-card', track), N = cards.length, at = 0, inView = false, hover = false, focusIn = false;
    if (!N) return;
    /* 3장 공간(data-scatter) — W07-B 흩뿌림형 3장에서 이식(원 레퍼런스 lisovskiy.work).
       왼쪽 1–4단 = 공간 목록(이름 · 서브카피 · More), 오른쪽 5–12단 = 사진을 작은 정사각 칸에 흩어 둠(원 열 무늬, 390 = 3열).
       칸이 화면에 들어오면 가운데 점에서 펴짐(.3초, 열 번호 × 15ms 지연 — --my-motion 0·reduced-motion이면 없음), 호버 1.05배 + 그 공간 이름, 클릭 → 상세 */
    if (track.hasAttribute('data-scatter')) {
      var sec0 = track.closest('section'); sec0.classList.add('ca-scatter');
      var DPAT = [4, 5, 7, 8, 5, 6, 9, 6, 7, 8, 5, 6], MPAT = [[2, 1], [3, 1], [1, 2], [2, 2], [3, 3], [2, 4], [1, 5], [2, 5], [3, 6], [2, 7], [3, 7], [2, 8]];
      var COL12 = { 4: 1, 5: 2, 6: 4, 7: 5, 8: 7, 9: 8 };   /* 원 9열의 4~9열(오른쪽 2/3) → 오른쪽 8단 안 열 */
      var field = D.createElement('div'); field.className = 'ca-field'; field.setAttribute('aria-label', '공간 사진');
      var k = 0, cellsAll = [];
      /* 강조 두 가지 — 호버·초점(잠깐 미리보기)과 장소 이름을 눌러 고른 선택(2026-10-20 2차 학생 요청).
         선택이 있으면 선택이 우선: 고른 장소의 사진은 또렷하고 나머지는 흐리다(390은 고른 장소 사진만 모아 펼침). 같은 이름을 다시 누르거나 Esc 로 풀린다 */
      var selIdx = -1, hotIdx = -1;
      function paint() {
        var idx = selIdx > -1 ? selIdx : hotIdx;
        sec0.classList.toggle('is-linking', idx > -1); sec0.classList.toggle('has-sel', selIdx > -1);
        cards.forEach(function (c, j) {
          var h = idx === j, s = selIdx === j, nb = $('.ca-open', c);
          c.classList.toggle('is-hot', h); c.classList.toggle('is-sel', s);
          if (nb) nb.setAttribute('aria-pressed', s ? 'true' : 'false');
          (c._cells || []).forEach(function (x) { x.classList.toggle('is-hot', h); x.classList.toggle('is-sel', s); });
        });
      }
      function hot(i, on) { if (on) hotIdx = i; else if (hotIdx === i) hotIdx = -1; paint(); }
      function select(i) {
        var anchor = stacked() ? cards[i] : null, y0 = anchor ? anchor.getBoundingClientRect().top : 0;
        sec0.classList.add('sel-ready'); selIdx = selIdx === i ? -1 : i; paint();
        if (anchor) stillAt(anchor, y0);   /* 390: 다른 장소 사진이 접히고 펴져도 누른 이름은 화면에서 제자리 */
      }
      function clearSel() { if (selIdx > -1) { selIdx = -1; paint(); } }
      cards.forEach(function (c, i) {
        c.classList.add('is-on'); c._cells = [];
        var nm = txtOf(c, '.ca-name');
        $$('.ca-fig img', c).forEach(function (im, j) {
          var q = k % 12; k++;
          var b = D.createElement('button'); b.type = 'button'; b.className = 'ca-cell';
          b.style.setProperty('--dcs', COL12[DPAT[q]]); b.style.setProperty('--dc', DPAT[q]);
          /* 390: 공간마다 따로 묶으므로 흩어 놓는 무늬(원 390 무늬)도 공간 안에서 처음부터 다시 시작한다 (2026-10-20 학생 요청) */
          b.style.setProperty('--mcs', MPAT[j % 12][0]); b.style.setProperty('--mrs', MPAT[j % 12][1]);
          b.setAttribute('aria-label', nm + ' 사진 ' + (j + 1) + ' — 자세히'); b.setAttribute('aria-haspopup', 'dialog');
          var ci = D.createElement('img'); ci.src = im.getAttribute('src'); ci.alt = ''; ci.decoding = 'async'; b.appendChild(ci);
          var lb = D.createElement('span'); lb.className = 'ca-cell-t'; lb.textContent = nm; lb.setAttribute('aria-hidden', 'true'); b.appendChild(lb);
          b.addEventListener('click', function () { openDetail(cards, i, null, $('img', b)); });   /* 사진 = 바로 상세(누른 그 사진이 상세 사진 자리로 커진다) */
          b.addEventListener('mouseenter', function () { hot(i, true); }); b.addEventListener('mouseleave', function () { hot(i, false); });
          b.addEventListener('focus', function () { hot(i, true); }); b.addEventListener('blur', function () { hot(i, false); });
          c._cells.push(b); cellsAll.push(b); field.appendChild(b);
        });
        c.addEventListener('mouseenter', function () { hot(i, true); }); c.addEventListener('mouseleave', function () { hot(i, false); });
        /* 장소 이름·감상 = 그 장소 고르기, More·사진 = 상세. (이름이 곧바로 상세를 열던 2026-10-13 동작은 More 가 대신한다) */
        c.addEventListener('click', function (e) { if (e.target.closest('.ca-place')) return; if (e.target.closest('.ca-more')) openDetail(cards, i); else if (e.target.closest('.ca-cap')) select(i); });
        /* 390 묶음 자리 — 장소명(.ca-name) 바로 아래, 감상(.ca-when) 바로 위. 1280에서는 비어 있어 보이지 않는다.
           바깥 .ca-place = 접고 펴는 칸(고른 장소만 펴짐), 안쪽 .ca-place-in = 사진 3열 */
        var capEl = $('.ca-cap', c);
        if (capEl && c._cells.length) {
          var box = D.createElement('div'); box.className = 'ca-place'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', nm + ' 사진');
          var boxIn = D.createElement('div'); boxIn.className = 'ca-place-in'; box.appendChild(boxIn);
          var whenEl = $('.ca-when', capEl); capEl.insertBefore(box, whenEl && whenEl.parentNode === capEl ? whenEl : null);
          c._place = boxIn;
        }
      });
      if (cellsAll.length) track.parentNode.insertBefore(field, track.nextSibling);   /* 사진 0장이면 칸 밭 없음 — 목록만 */
      /* 사진 칸 자리 (2026-10-20 학생 요청): 1280 = 오른쪽 흩뿌린 칸 밭(.ca-field) 그대로, 390 = 공간마다 장소명 → 해당 사진 → 감상 순서로 카드 안에 묶음.
         같은 칸 요소를 옮겨 둘 뿐이라 사진·클릭·상세는 그대로. 크기가 바뀌어 기준(768)을 넘을 때만 다시 옮긴다 */
      var placed = false;   /* 처음엔 모두 칸 밭에 있다 */
      function arrange() {
        var m = stacked();
        if (m !== placed) {
          placed = m;
          if (m) cards.forEach(function (c) { if (c._place) c._cells.forEach(function (b) { c._place.appendChild(b); }); });
          else cellsAll.forEach(function (b) { field.appendChild(b); });
        }
        fitLabels();
      }
      /* 호버 때 사진 아래에 뜨는 장소 이름이 오른쪽 화면 밖으로 나가지 않게: 넘치는 칸만 이름을 칸 오른쪽 끝에 맞춘다 */
      function fitLabels() {
        var vw = R.clientWidth;
        cellsAll.forEach(function (b) {
          b.classList.remove('is-edge'); var t = $('.ca-cell-t', b); if (!t || !t.offsetWidth) return;
          if (b.getBoundingClientRect().left + t.offsetWidth > vw - 12) b.classList.add('is-edge');
        });
      }
      tracks.push({ layout: arrange, measure: fitLabels, arm: function () {}, clear: clearSel });
      if (MOTION !== '0' && 'IntersectionObserver' in window && cellsAll.length) {
        sec0.classList.add('is-armed');
        var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-in', e.isIntersecting); }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
        cellsAll.forEach(function (x) { io2.observe(x); });
      }
      return;
    }
    /* 항목 5개 이하(1장 · 3장 · 4장): 모두 열어 한 줄에 나란히. 가리거나 흐린 카드 없음, 자동 넘김 없음 (2026-10-07 교수 지시).
       번호 줄(data-index, 4장)이 있으면 장 머리 안 장 이름 옆에 두고, 탭 칸 1개 = 카드 1단(같은 세로선). 6개 이상만 아래 카드 줄 엔진 */
    if (N <= 5) {
      track.classList.add('is-all'); track.style.setProperty('--ca-n', String(N));
      /* 12단 배치: 1·2·3·4·6개는 12/N단씩, 5개는 2단씩 3단부터(4장: 장 이름 2단 | 다섯 × 2단) */
      track.style.setProperty('--ca-span', String(N === 5 ? 2 : 12 / N)); if (N === 5) track.classList.add('is-five');
      var tabs = [];
      function onTab(k) { tabs.forEach(function (b, j) { b.classList.toggle('is-on', j === k); b.setAttribute('aria-current', j === k ? 'true' : 'false'); }); }
      /* 4장 물건 탭 줄은 2026-10-07 삭제 — 카드 타이틀 앞 [01] 번호(CSS)로 대신 */
      cards.forEach(function (c, i) { c.classList.add('is-on');
        c.addEventListener('mouseenter', function () { if (tabs.length) onTab(i); });
        c.addEventListener('focusin', function () { if (tabs.length) onTab(i); });
        c.addEventListener('click', function (e) { if (e.target.closest('.ca-cap, .ca-fig, .ca-more')) { if (tabs.length) onTab(i); openDetail(cards, i); } }); });
      return;
    }
    function geom() { var W = track.clientWidth, g = parseFloat(getComputedStyle(track).columnGap) || parseFloat(getComputedStyle(R).getPropertyValue('--ca-gap')) || 12, col = (W - 3 * g) / 4; return { W: W, g: g, col: col, big: 3 * col + 2 * g }; }
    function place() {
      if (stacked()) { cards.forEach(function (c) { c.style.removeProperty('--x'); c.style.removeProperty('--w'); c._x = null; }); return; }
      var G = geom(), slide = MOTION === '0' ? 0 : 860;
      cards.forEach(function (c, i) {
        var rel = (i - at + N) % N, x, w = G.col, later = null;
        if (rel === 0) { x = 0; w = G.big; }
        else if (rel === N - 1 && N > 2) x = -(G.col + G.g);
        else x = G.big + G.g + (rel - 1) * (G.col + G.g);
        var was = c._x, jump = false;
        if (was != null && rel !== 0 && x > was + 1) { if (N === 2 && Math.abs(was) < 1) { later = x; x = -(G.col + G.g); } else jump = true; }
        c.classList.toggle('is-jump', jump);
        c.style.setProperty('--x', x + 'px'); c.style.setProperty('--w', w + 'px'); c._x = x;
        if (later != null) setTimeout(function () { if ((i - at + N) % N !== rel || stacked()) return; c.classList.add('is-jump'); c.style.setProperty('--x', later + 'px'); c._x = later; }, slide);
      });
    }
    function measure() {
      if (stacked()) { track.style.removeProperty('--ca-track-h'); return; }
      var G = geom(), h = 0;
      cards.forEach(function (c) {   /* 연 카드(3열 폭)와 '다음' 카드(1열 폭, 사진 한 장 + 글 전부) 둘 다 재서 큰 쪽 — 다음 카드가 잘리지 않게 */
        var keep = c.getAttribute('style') || '', on = c.classList.contains('is-on'), nx = c.classList.contains('is-next'), jp = c.classList.contains('is-jump');
        c.classList.add('is-jump'); c.style.transition = 'none'; c.classList.add('is-on'); c.classList.remove('is-next'); c.style.width = G.big + 'px'; h = Math.max(h, c.offsetHeight);
        c.classList.remove('is-on'); c.classList.add('is-next'); c.style.width = G.col + 'px'; h = Math.max(h, c.offsetHeight);
        c.classList.toggle('is-on', on); c.classList.toggle('is-next', nx); c.setAttribute('style', keep); void c.offsetWidth; c.classList.toggle('is-jump', jp); });   /* 재는 동안 폭 전환 없음 */
      track.style.setProperty('--ca-track-h', Math.ceil(h) + 'px');
    }
    function paused() { return !inView || hover || focusIn || detailOn || D.hidden || stacked() || AUTO === 0 || N < 2; }
    function arm() { track.classList.toggle('is-paused', paused()); }
    function mark() {
      cards.forEach(function (c, i) {
        var on = i === at, near = on || i === (at + 1) % N;
        c.classList.toggle('is-on', on);
        c.classList.toggle('is-next', !on && N > 1 && i === (at + 1) % N);   /* 넷째 열 '다음' 카드 = 흐리지 않고 사진 한 장 + 글 그대로 */
        if (!stacked()) c.setAttribute('aria-hidden', near ? 'false' : 'true'); else c.removeAttribute('aria-hidden');
        $$('button, a', c).forEach(function (el) { if (!stacked() && !near) el.setAttribute('tabindex', '-1'); else el.removeAttribute('tabindex'); });
        var tm = $('.ca-timer', c);
        if (tm) { tm.classList.remove('is-run'); if (on && AUTO > 0 && N > 1) { void tm.offsetWidth; tm.classList.add('is-run'); } }
        c.classList.toggle('is-still', on && (AUTO === 0 || N < 2));
      });
    }
    /* 번호 줄 (data-index 가 붙은 줄만 — 4장 물건) */
    var ix = [];
    if (track.hasAttribute('data-index')) {
      var ol = D.createElement('ol'); ol.className = 'ca-index'; ol.setAttribute('aria-label', '카드 목록');
      cards.forEach(function (c, i) {
        var li = D.createElement('li'), b = D.createElement('button'); b.type = 'button'; b.className = 'ca-ix';
        b.innerHTML = '<span class="ca-ix-t"></span><span class="ca-n">[' + pad(i + 1) + ']</span>';
        $('.ca-ix-t', b).textContent = txtOf(c, '.ca-name');
        b.addEventListener('click', function () { if (stacked()) { cards[i].scrollIntoView({ block: 'start', behavior: MOTION === '0' ? 'auto' : 'smooth' }); return; } go(i); }); li.appendChild(b); ol.appendChild(li); ix.push(b);
      });
      /* 번호 줄은 장 머리 줄 안, 장 이름 옆에 (단 하나 줄임 · 2026-10-07 교수 지시). 머리가 없으면 카드 줄 바로 위 */
      var hd = track.parentNode.querySelector(':scope > .ca-head');
      if (hd) { hd.classList.add('has-index'); hd.appendChild(ol); } else track.parentNode.insertBefore(ol, track);
    }
    function go(i) { at = (i + N) % N; place(); mark(); arm(); ix.forEach(function (b, k) { b.classList.toggle('is-on', k === at); b.setAttribute('aria-current', k === at ? 'true' : 'false'); }); }
    cards.forEach(function (c, i) {
      var tm = $('.ca-timer', c);
      if (tm) tm.addEventListener('animationend', function () { if (i === at && !paused()) go(at + 1); });
      c.addEventListener('click', function (e) {
        var hit = e.target.closest('.ca-cap, .ca-fig, .ca-more'); if (!hit) return;
        if (!stacked() && i !== at) { go(i); return; }
        openDetail(cards, i, function (j) { if (!stacked() && j !== at) go(j); });
      });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); arm(); }, { threshold: .35 }).observe(track);
    else inView = true;
    track.addEventListener('mouseenter', function () { hover = true; arm(); });
    track.addEventListener('mouseleave', function () { hover = false; arm(); });
    track.addEventListener('focusin', function () { focusIn = true; arm(); });
    track.addEventListener('focusout', function () { setTimeout(function () { focusIn = track.contains(D.activeElement); arm(); }, 0); });
    tracks.push({ layout: function () { measure(); go(at); }, measure: measure, arm: arm });
  });
  /* 2장 격자: 모두 열린 카드. 누르면 상세 */
  $$('.ca-grid').forEach(function (g) {
    var cards = $$('.ca-card', g);
    cards.forEach(function (c, i) { c.addEventListener('click', function (e) { if (e.target.closest('.ca-cap, .ca-fig, .ca-more')) openDetail(cards, i); }); });
  });
  D.addEventListener('visibilitychange', function () { tracks.forEach(function (t) { t.arm(); }); });

  /* ── 6. 상세 ── */
  var dl = D.createElement('div');
  dl.className = 'ca-detail'; dl.setAttribute('role', 'dialog'); dl.setAttribute('aria-modal', 'true'); dl.setAttribute('aria-labelledby', 'ca-d-t'); dl.tabIndex = -1;
  /* 상세 순서 = 사진(원본 비율) → [번호 이름] → 본 것·언제 → 해석·고른 이유(본문보다 한 단계 큰 글) → Prev/Next. Return 없음 — 닫기: Esc · 상단 바 제목 · 장 메뉴 · 뒤로가기 (2026-10-07) */
  dl.innerHTML = '<div class="ca-d-bar"><button type="button" class="ca-d-close">닫기 <span aria-hidden="true">×</span></button></div>'   /* 2026-10-20 학생 요청: 상세 맨 위에 늘 보이는 닫기 버튼 (Esc · 뒤로가기도 그대로) */
    + '<div class="ca-d-in"><div class="ca-d-grid ca-row"></div><div class="ca-d-txt"><div class="ca-d-head"><p class="ca-d-name"><span class="ca-n ca-d-n"></span><span class="ca-d-t" id="ca-d-t"></span></p>'
    + '<p class="ca-d-when"></p></div>'
    + '<p class="ca-d-why"></p></div>'
    + '</div>'
    /* 이전/다음 = 화면 좌·우 가장자리 버튼(두 바 사이 세로 전체). 마우스를 올렸을 때만 글자가 보인다. 터치는 좌우 스와이프 (2026-10-07) */
    + '<button type="button" class="ca-d-edge ca-d-prev"><span>← <b></b></span></button><button type="button" class="ca-d-edge ca-d-next"><span><b></b> →</span></button>';
  D.body.appendChild(dl);
  var dCards = [], dAt = 0, dDone = null, back = null;
  var openThumb = null, openIdx = -1, navigated = false, savedY = 0;   /* 열 때의 사진·카드·스크롤 위치 — 닫을 때 그 자리로 돌려보낸다 */
  function txt(c, s) { var e = $(s, c); return e ? e.textContent.trim() : ''; }
  function fill(i) {
    var N = dCards.length; dAt = (i + N) % N; var c = dCards[dAt];
    if (detailOn) navigated = true;   /* 상세 안에서 이전·다음으로 다른 카드로 옮겼다 */
    $('.ca-d-n', dl).textContent = '[' + pad(dAt + 1) + ']';
    $('.ca-d-t', dl).textContent = txt(c, '.ca-name');
    var dw = $('.ca-d-when', dl); dw.textContent = txt(c, '.ca-when'); dw.hidden = !dw.textContent;
    var dy = $('.ca-d-why', dl); var wyEl = $('.ca-why', c); dy.textContent = wyEl ? wyEl.textContent.replace(/^\s+|\s+$/g, '').replace(/\n\s+/g, '\n') : ''; dy.hidden = !wyEl;
    var grid = $('.ca-d-grid', dl); grid.innerHTML = '';
    $$('.ca-fig', c).forEach(function (f, k) {
      var im = $('img', f); if (!im) return;
      var nf = D.createElement('figure'), ni = D.createElement('img');
      ni.src = im.getAttribute('src'); ni.alt = im.getAttribute('alt') || '';
      var w = +im.getAttribute('width') || im.naturalWidth || 1, h = +im.getAttribute('height') || im.naturalHeight || 1; ni.width = w; ni.height = h;
      if (k === 0) { nf.classList.add('is-first'); if (w >= h) nf.classList.add('is-wide'); }
      nf.appendChild(ni);
      var fc = $('figcaption', f); if (fc && fc.textContent.trim()) { var nc = D.createElement('figcaption'); nc.textContent = fc.textContent.trim(); nf.appendChild(nc); }
      grid.appendChild(nf);
    });
    grid.hidden = !grid.children.length;
    var pv = $('.ca-d-prev', dl), nx = $('.ca-d-next', dl); pv.hidden = nx.hidden = N < 2;   /* 지금은 순환(첫↔끝) — 교수 확인 전까지 유지 */
    var pn = txt(dCards[(dAt - 1 + N) % N], '.ca-name'), nn = txt(dCards[(dAt + 1) % N], '.ca-name');
    $('b', pv).textContent = pn; $('b', nx).textContent = nn;
    pv.setAttribute('aria-label', '이전 항목: ' + pn); nx.setAttribute('aria-label', '다음 항목: ' + nn);
    dl.scrollTop = 0;
  }
  /* ── 6-1. 상세 열기·닫기 = 사진이 커졌다가 원래 자리로 돌아온다 (2026-10-20 2차 학생 요청) ──
     열 때: 누른 목록 사진을 복제해 상세 첫 사진 자리까지 늘려 보낸다(가로·세로·위치를 함께 — 4:5 칸에서 원본 비율로 자연스럽게 풀림).
     닫을 때: 상세 첫 사진이 그 목록 사진 자리로 줄어들어 돌아가고, 스크롤은 열기 전 그대로(다른 카드로 넘겼다면 그 사진이 화면에 오게).
     움직임 0 · 시스템의 동작 줄이기 설정이면 복제 사진 없이 기존처럼 바로 열리고 닫힌다. 장 메뉴·이름으로 닫을 때(quick)도 바로 닫힌다 */
  var flyEl = null, flyAnim = null, flyThumb = null, holdRaf = 0;
  var E2 = my('--ca-e2', 'cubic-bezier(.45,.22,0,.95)');
  function calm() { return MOTION === '0' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function seen(r) { return !!r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  function thumbOf(card) {   /* 그 카드의 목록 사진 — 3장은 사진 칸, 390 가로 넘김 줄은 지금 보이는 사진 */
    var list = card._cells && card._cells.length ? card._cells.map(function (b) { return $('img', b); }) : $$('.ca-fig img', card), first = null;
    for (var q = 0; q < list.length; q++) {
      var r = list[q].getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
      if (!first) first = list[q];
      if (r.left >= -1 && r.right <= innerWidth + 1) return list[q];
    }
    return first;
  }
  function detailFirst() {   /* 상세 첫 사진 자리(아직 안 그려졌으면 칸 폭과 사진 비율로 계산) */
    var im = $('.ca-d-grid figure.is-first img', dl); if (!im) return null;
    var r = im.getBoundingClientRect(); if (r.width > 4 && r.height > 4) return r;
    var fg = im.parentNode.getBoundingClientRect(), w = +im.getAttribute('width') || 0, h = +im.getAttribute('height') || 0; if (!w || !h || fg.width < 4) return null;
    var dh = Math.min(fg.width * h / w, innerHeight * .6);
    return { left: fg.left, top: fg.top, width: dh * w / h, height: dh, right: fg.left + dh * w / h, bottom: fg.top + dh };
  }
  function endFly() {
    if (flyAnim) { try { flyAnim.cancel(); } catch (e) {} flyAnim = null; }
    if (flyEl && flyEl.parentNode) flyEl.parentNode.removeChild(flyEl); flyEl = null;
    dl.classList.remove('is-fly');
    if (flyThumb) { flyThumb.style.removeProperty('visibility'); flyThumb = null; }
  }
  function flyImg(src, a, b, ms) {   /* a 자리에서 b 자리로 사진 한 장을 보낸다. 끝나면 endFly */
    var el = D.createElement('div'), im = D.createElement('img');
    el.className = 'ca-fly'; el.setAttribute('aria-hidden', 'true'); im.src = src; im.alt = ''; el.appendChild(im);
    function box(r) { return { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }; }
    var s = box(a); el.style.left = s.left; el.style.top = s.top; el.style.width = s.width; el.style.height = s.height;
    D.body.appendChild(el); flyEl = el;
    if (!el.animate) { endFly(); return; }
    var an = el.animate([s, box(b)], { duration: ms, easing: E2, fill: 'forwards' }); flyAnim = an;
    an.onfinish = function () { if (flyAnim === an) { flyAnim = null; endFly(); } };
    setTimeout(function () { if (flyAnim === an) { flyAnim = null; endFly(); } }, ms + 400);   /* 안전장치: 탭이 가려져 애니메이션이 멈춰도 사진·글은 반드시 돌아온다 */
  }
  function stillAt(el, y0) {   /* 390: 다른 장소 사진이 접히고 펴지는 동안 누른 카드가 화면에서 제자리에 있게 — 스크롤을 프레임마다 보정 */
    var t0 = performance.now(), stop = false;
    function off() { stop = true; }
    addEventListener('wheel', off, { passive: true }); addEventListener('touchstart', off, { passive: true });
    cancelAnimationFrame(holdRaf);
    (function step() {
      var d = el.getBoundingClientRect().top - y0;
      if (!stop && Math.abs(d) > .5) { R.style.scrollBehavior = 'auto'; scrollTo(0, scrollY + d); R.style.scrollBehavior = ''; }
      if (!stop && performance.now() - t0 < 520) holdRaf = requestAnimationFrame(step);
      else { removeEventListener('wheel', off); removeEventListener('touchstart', off); }
    })();
  }
  function openDetail(cards, i, done, origin) {
    endFly();
    var first = !detailOn, th = first ? (origin || thumbOf(cards[i])) : null, from = th ? th.getBoundingClientRect() : null, src = th ? (th.currentSrc || th.src) : '';
    dCards = cards; dDone = done || null; back = D.activeElement;
    if (first) { savedY = scrollY; openThumb = th; openIdx = i; }
    fill(i); if (first) navigated = false;
    detailOn = true; tracks.forEach(function (t) { t.arm(); });
    dl.classList.add('is-on'); R.classList.add('ca-lock');
    var to = first && seen(from) && !calm() ? detailFirst() : null;
    if (to && to.width > 4) { dl.classList.add('is-fly'); th.style.visibility = 'hidden'; flyThumb = th; flyImg(src, from, to, 460); }   /* 목록 사진 → 상세 첫 사진 자리 */
    setTimeout(function () { dl.focus({ preventScroll: true }); }, 30);
    if (history.pushState && !(history.state && history.state.caDetail)) history.pushState({ caDetail: 1 }, '');
  }
  function backTo(th) {   /* 닫은 뒤 스크롤: 열 때 그 카드면 열 때 위치 그대로, 다른 카드로 넘겼으면 그 사진이 화면 가운데 오게 */
    R.style.scrollBehavior = 'auto';
    if (!navigated && dAt === openIdx) { if (Math.abs(scrollY - savedY) > 1) scrollTo(0, savedY); }
    else if (th) {
      var r = th.getBoundingClientRect(), top = (gnb ? gnb.getBoundingClientRect().height : 0) + 12, bot = innerHeight - (menuEl ? menuEl.getBoundingClientRect().height : 0) - 12;
      if (r.top < top || r.bottom > bot) scrollBy(0, r.top + r.height / 2 - innerHeight / 2);
    }
    R.style.scrollBehavior = '';
  }
  function closeDetail(quick) {
    if (!detailOn) return;
    endFly();
    var card = dCards[dAt], th = (!navigated && dAt === openIdx && openThumb && openThumb.isConnected) ? openThumb : thumbOf(card);
    var fi = $('.ca-d-grid figure.is-first img', dl), from = fi ? fi.getBoundingClientRect() : null;
    var fly = quick !== true && !calm() && seen(from) && from.bottom > (gnb ? gnb.getBoundingClientRect().height : 0) + 8;
    dl.classList.remove('is-on'); R.classList.remove('ca-lock'); detailOn = false;
    if (dDone) dDone(dAt);
    backTo(th);
    var to = fly && th ? th.getBoundingClientRect() : null;
    if (to && seen(to)) { dl.classList.add('is-fly'); th.style.visibility = 'hidden'; flyThumb = th; flyImg(fi.currentSrc || fi.src, from, to, 380); }   /* 상세 첫 사진 → 원래 목록 사진 자리 */
    var t = $('.ca-open', card) || back; if (t && t.focus) t.focus({ preventScroll: true });
    tracks.forEach(function (t) { t.arm(); });
  }
  addEventListener('popstate', function () { if (detailOn) closeDetail(); });   /* 브라우저 뒤로가기 = 상세 닫기 */
  $('.ca-d-close', dl).addEventListener('click', function () { closeDetail(); });
  $('.ca-d-prev', dl).addEventListener('click', function () { fill(dAt - 1); });
  $('.ca-d-next', dl).addEventListener('click', function () { fill(dAt + 1); });
  /* 터치: 좌우 스와이프(가로 이동 50px 이상 · 세로보다 클 때만 — 세로 스크롤은 가로채지 않음) */
  var tx = null, ty = 0;
  dl.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
  dl.addEventListener('touchend', function (e) {
    if (tx == null || dCards.length < 2) return; var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) fill(dAt + (dx < 0 ? 1 : -1));
  }, { passive: true });
  D.addEventListener('keydown', function (e) {
    if (!detailOn) { if (e.key === 'Escape') tracks.forEach(function (t) { if (t.clear) t.clear(); }); return; }   /* 상세가 닫혀 있을 때 Esc = 3장에서 고른 장소 풀기 */
    if (e.key === 'Escape') { e.preventDefault(); closeDetail(); }
    else if (e.key === 'ArrowRight' && dCards.length > 1) fill(dAt + 1);
    else if (e.key === 'ArrowLeft' && dCards.length > 1) fill(dAt - 1);
    else if (e.key === 'Tab') {
      var f = $$('button:not([hidden])', dl); if (!f.length) return;
      if (e.shiftKey && D.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && D.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ── 7. 하단 메뉴: 현재 위치 ── */
  var links = $$('.ca-menu a'), secs = links.map(function (a) { var id = (a.getAttribute('href') || '').slice(1); return id ? D.getElementById(id) : null; });
  links.forEach(function (a, i) { if (!secs[i]) REPORT.push('메뉴 연결 없음: ' + a.textContent.trim()); a.innerHTML = '<span>' + a.innerHTML + '</span>'; });
  /* 상단 메뉴 현재 장 표시 (2026-10-20 2차 학생 요청): 지금 장 글자 아래에 짧은 밑줄 하나가 있고, 장이 바뀌면 그 밑줄이 칸 사이를 미끄러진다.
     스크롤로 장이 바뀔 때도, 메뉴를 눌러 옮길 때도 같다(메뉴를 누르면 밑줄이 곧바로 목적지로 가고 화면은 부드럽게 따라간다) */
  var mnav = $('.ca-gnb .ca-menu'), mark = null, curIdx = -1;
  if (mnav) { mark = D.createElement('i'); mark.className = 'ca-menu-mark'; mark.setAttribute('aria-hidden', 'true'); mnav.appendChild(mark); }
  function placeMark() {
    if (!mark) return;
    var a = links[curIdx], sp = a && $('span', a);
    if (!a || !a.offsetParent || !sp) { mark.classList.remove('is-on'); return; }
    var mr = mnav.getBoundingClientRect(), ar = a.getBoundingClientRect(), sr = sp.getBoundingClientRect(), first = !mark.classList.contains('is-set');
    if (first) mark.style.transition = 'none';   /* 처음 자리는 미끄러져 오지 않고 그 자리에 나타난다 */
    mark.style.transform = 'translate3d(' + (ar.left - mr.left) + 'px,' + (sr.bottom - mr.top + 3) + 'px,0)';
    mark.classList.add('is-on');
    if (first) { void mark.offsetWidth; mark.style.removeProperty('transition'); mark.classList.add('is-set'); }
  }
  var navLock = -1, navT = 0;   /* 메뉴를 눌러 부드럽게 가는 동안은 지나치는 장마다 밑줄이 깜박이지 않게 목적지에 고정 */
  function navFree() { navLock = -1; clearTimeout(navT); current(); }
  function navHold(i, ms) { navLock = i; clearTimeout(navT); navT = setTimeout(navFree, ms); }
  function current() {
    var y = innerHeight * .4, on = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) on = i; });
    if (innerHeight + scrollY >= D.documentElement.scrollHeight - 4) { for (var k = secs.length - 1; k >= 0; k--) if (secs[k]) { on = k; break; } }   /* 맨 끝 = 마지막 장 */
    if (navLock > -1) on = navLock;
    links.forEach(function (a, i) { a.classList.toggle('is-on', i === on); a.setAttribute('aria-current', i === on ? 'true' : 'false'); });
    if (on !== curIdx) { curIdx = on; placeMark(); }
  }
  var tick = false; addEventListener('scroll', function () {
    if (navLock > -1) { clearTimeout(navT); navT = setTimeout(navFree, 160); }   /* 화면이 멈추면 고정을 푼다 */
    if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; current(); }); }
  }, { passive: true });
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { if (navLock > -1) navFree(); }, { passive: true }); });
  /* 장 이동(메뉴 · 첫 화면 `취향 둘러보기` 버튼): 상세가 열려 있으면 닫고, 그 장 머리로 부드럽게 스크롤(동작 줄이기면 바로) */
  function goTo(s, i) {
    if (detailOn) closeDetail(true);
    if (i > -1) { navHold(i, 400); current(); }
    s.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState && s.id) history.replaceState(null, '', '#' + s.id);
    if (s.tagName !== 'A' && s.tagName !== 'BUTTON') { s.setAttribute('tabindex', '-1'); s.focus({ preventScroll: true }); }   /* 다음 Tab 이 그 장 안에서 시작 */
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {   /* 장 메뉴 = 상세 닫고 그 장으로 */
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!secs[i]) { if (detailOn) closeDetail(true); return; }
      e.preventDefault(); goTo(secs[i], i);
    });
  });
  var heroGo = $('.ca-hero-go');
  if (heroGo) heroGo.addEventListener('click', function (e) {
    var s = D.getElementById((heroGo.getAttribute('href') || '').slice(1)); if (!s || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); goTo(s, secs.indexOf(s));
  });

  /* ── 8. 스크롤 등장 (움직임 1·2) ── */
  if (MOTION !== '0' && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.ca-head, .ca-list li, .ca-grid > *, .ca-state, .ca-r, .ca-hero').forEach(function (el) { el.classList.add('ca-rv'); io.observe(el); });
    addEventListener('scroll', function () { if (scrollY + innerHeight >= R.scrollHeight - 4) $$('.ca-rv:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); }); }, { passive: true });
  }

  /* ── 8-1. 기준선 맞춤 (§I-7) — 칸마다 선이 따로 있는 줄(첫 화면 위 줄 · 끝줄 · 상세 머리 · 2장 격자 머리)은
     CSS baseline 으로 맞추면 선 높이가 어긋난다. 그래서 칸의 첫 줄 글자 기준선을 재서 작은 쪽 위 여백만 더한다(선은 그대로) ── */
  function baseOf(el) {
    el = $('.ca-d-t', el) || el;   /* 상세 머리: 번호 [01] 아래 이름 줄이 기준 */
    var tw = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = tw.nextNode())) { if (n.textContent.trim() && n.parentElement.offsetParent !== null && getComputedStyle(n.parentElement).display !== 'none') break; }
    if (!n) return null;
    var pr = D.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    n.parentNode.insertBefore(pr, n); var y = pr.getBoundingClientRect().top; pr.parentNode.removeChild(pr); return y;
  }
  function syncRow(kids) {
    kids.forEach(function (k) { k.style.removeProperty('padding-top'); });
    var rows = [], heads = [];   /* 세로로 겹치는 칸끼리 한 줄 */
    kids.forEach(function (k) {
      if (!k.offsetParent) return; var r = k.getBoundingClientRect(), gi = -1;
      heads.forEach(function (h, i) { if (gi < 0 && r.top < h.bottom - 2 && r.bottom > h.top + 2) gi = i; });
      if (gi < 0) { heads.push(r); rows.push([]); gi = heads.length - 1; } rows[gi].push(k);
    });
    rows.forEach(function (g) {
      if (g.length < 2) return;
      var b = g.map(function (k) { var y = baseOf(k); return y == null ? null : y - k.getBoundingClientRect().top; });
      var mx = Math.max.apply(null, b.filter(function (v) { return v != null; }));
      g.forEach(function (k, i) { if (b[i] == null) return; var add = mx - b[i]; if (add > .25) k.style.paddingTop = (parseFloat(getComputedStyle(k).paddingTop) + add) + 'px'; });
      /* 끝 정렬 칸은 여백을 더하면 위치가 다시 움직인다 → 남은 차이를 두 번까지 더 맞춘다 */
      for (var pass = 0; pass < 2; pass++) {
        var y = g.map(baseOf), m = Math.max.apply(null, y.filter(function (v) { return v != null; }));
        g.forEach(function (k, i) { if (y[i] == null) return; var d = m - y[i]; if (d > .25) k.style.paddingTop = (parseFloat(getComputedStyle(k).paddingTop) + d) + 'px'; });
      }
    });
  }
  function syncBase() {
    $$('.ca-top > .ca-row, .ca-d-head').forEach(function (r) { syncRow(Array.prototype.slice.call(r.children)); });
    /* 2장 격자: 사진이 먼저 서므로 About 블록과 카드는 윗변 맞춤(기준선 맞춤 없음, 2026-10-07) */
  }
  /* 메뉴 실제 높이 → body 아래 여백(본문 마지막 줄이 메뉴 뒤에 숨지 않게) */
  var menuEl = $('.ca-bar-b') || $('.ca-menu');   /* 하단 고정 바 높이 */
  function menuH() { if (menuEl) R.style.setProperty('--ca-menu-h', Math.ceil(menuEl.getBoundingClientRect().height) + 'px'); }

  /* ── 9. 시작 · 크기 변화 ── */
  function relayout() { fitH1(); tracks.forEach(function (t) { t.layout(); }); current(); placeMark(); menuH(); gnbH(); syncBase(); heroText(); if (gnb && !matchMedia('(max-width: 768px)').matches) gnbOpen(false); gnbState(); }
  /* 카드 서브카피 2~5줄(상한 5줄) — 자르지 않고 보고 줄만(COMMON_RULES §2) */
  function subLimit() {
    $$('.ca-card').forEach(function (c) {
      var sub = $('.ca-when', c) || $('.ca-why', c); if (!sub || !sub.offsetParent) return;
      var lh = parseFloat(getComputedStyle(sub).lineHeight) || 22, n = Math.round(sub.getBoundingClientRect().height / lh);
      if (n > 5) { var m = '상한 초과: 서브카피(' + sub.textContent.trim().length + '자 · ' + n + '줄/5줄) ' + txtOf(c, '.ca-name'); if (REPORT.indexOf(m) < 0) REPORT.push(m); }
    });
  }
  /* 격자 확인용 오버레이: 주소에 ?grid 를 붙였을 때만 */
  if (/[?&]grid\b/.test(location.search)) { var ov = D.createElement('div'); ov.className = 'ca-grid-ov'; ov.setAttribute('aria-hidden', 'true'); for (var gi = 0; gi < 12; gi++) ov.appendChild(D.createElement('i')); D.body.appendChild(ov);
    var ovf = function () { var n = parseInt(getComputedStyle(R).getPropertyValue('--ca-cols')) || 12; Array.prototype.forEach.call(ov.children, function (c, k) { c.style.display = k < n ? '' : 'none'; }); }; ovf(); addEventListener('resize', ovf); }
  function flush() { subLimit(); if (REPORT.length) R.setAttribute('data-ca-report', REPORT.join(' / ')); }
  relayout(); flush();
  requestAnimationFrame(function () { requestAnimationFrame(function () { R.classList.add('is-ready'); }); });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { fitH1(); tracks.forEach(function (t) { t.measure(); }); placeMark(); menuH(); gnbH(); syncBase(); heroText(); gnbState(); });
  /* 첫 화면 제목: 글꼴과 첫 화면 사진이 준비되면 한 번 나타난다(준비가 늦어도 위 안전장치가 1.6초에 켠다). 끝난 뒤 글자색을 한 번 더 잰다 */
  (function () {
    var need = 2, h1 = $('.ca-top--hero .ca-h1');
    function one() { if (--need === 0) heroIn(); }
    if (!hImg || hImg.complete) one(); else { hImg.addEventListener('load', one); hImg.addEventListener('error', one); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { (D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve()).then(one); }); });
    if (h1) h1.addEventListener('animationend', function () { heroText(); gnbState(); });
  })();
  $$('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', function () { tracks.forEach(function (t) { t.measure(); }); }); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  if (mq.addEventListener) mq.addEventListener('change', relayout);
})();
