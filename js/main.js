(function () {
  if (location.search.indexOf('static') > -1) {
    document.documentElement.classList.add('is-static');
    window.addEventListener('load', function () {
      var ids = ['why','homes','street','system','proof','stats','showhome','tour','who','about','faqs','contact','footer'];
      var offs = ids.map(function (id) { var el = document.getElementById(id); return id + '=' + (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : -1); });
      document.title = 'OFFS ' + offs.join(' ') + ' H=' + document.documentElement.scrollHeight;
    });
  }
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    nav.classList.toggle('is-solid', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    nav.classList.toggle('is-menu-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A' && links.classList.contains('is-open')) burger.click();
  });

  /* hero video: the still carries the hero, the loop is an upgrade that
     only loads once the page is painted and only where it is worth the bytes */
  var heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    var conn = navigator.connection || {};
    var frugal = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    // idle without a timeout can be starved forever on a busy phone, which is
    // exactly how the hero loop ends up never starting on mobile
    var idle = function (fn) {
      if (window.requestIdleCallback) return window.requestIdleCallback(fn, { timeout: 1200 });
      return setTimeout(fn, 600);
    };

    // reveal on whichever fires first: 'playing' can be skipped on some mobile
    // engines, 'timeupdate' proves frames are actually flowing
    var reveal = function () { heroVideo.classList.add('is-playing'); };
    heroVideo.addEventListener('playing', reveal);
    heroVideo.addEventListener('timeupdate', reveal, { once: true });

    // a real failure (404, codec) drops the video entirely and leaves the still
    heroVideo.addEventListener('error', function () {
      heroVideo.classList.remove('is-playing');
      heroVideo.removeAttribute('src');
      heroVideo.load();
    }, true);

    var startHero = function () {
      var small = window.matchMedia('(max-width: 720px)').matches;
      heroVideo.src = heroVideo.dataset[small ? 'mobile' : 'desktop'];
      heroVideo.load();
      // the autoplay attribute does the work; this is belt and braces. a rejection
      // (iOS Low Power Mode) is not an error, we just keep showing the still
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    };

    if (reduced || frugal) {
      heroVideo.remove();
    } else if (document.readyState === 'complete') {
      idle(startHero);
    } else {
      window.addEventListener('load', function () { idle(startHero); });
    }
  }

  /* ---------- hero house-type spec panel ---------- */
  var TYPES = [
    { area: 40, name: '1 Bed Apartment', meta: 'Type A2 · Single storey' },
    { area: 51, name: '1 Bed Apartment', meta: 'Type B3 · Single storey' },
    { area: 70, name: '2 Bed Apartment', meta: 'Type D3 · Single storey' },
    { area: 79, name: '2 Bed House', meta: 'Two storeys · 4 person' },
    { area: 101, name: '3 Bed House', meta: 'Two storeys · 5 person' },
    { area: 112, name: '4 Bed House', meta: 'Two storeys · 6 person' }
  ];
  var tIdx = 5;
  var spec = document.querySelector('.spec');
  var elArea = document.getElementById('specArea');
  var elName = document.getElementById('specName');
  var elMeta = document.getElementById('specMeta');

  function setType(next) {
    tIdx = (next + TYPES.length) % TYPES.length;
    spec.classList.add('is-switching');
    setTimeout(function () {
      elArea.textContent = TYPES[tIdx].area;
      elName.textContent = TYPES[tIdx].name;
      elMeta.textContent = TYPES[tIdx].meta;
      spec.classList.remove('is-switching');
    }, 290);
  }
  document.getElementById('specPrev').addEventListener('click', function () { setType(tIdx - 1); });
  document.getElementById('specNext').addEventListener('click', function () { setType(tIdx + 1); });

  /* ---------- range scroller ---------- */
  var scroller = document.getElementById('rangeScroller');
  function step() {
    var card = scroller.querySelector('.plan');
    return card ? card.getBoundingClientRect().width + 20 : 320;
  }
  document.getElementById('rangePrev').addEventListener('click', function () {
    scroller.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  document.getElementById('rangeNext').addEventListener('click', function () {
    scroller.scrollBy({ left: step(), behavior: 'smooth' });
  });

  /* ---------- show home walkthrough ---------- */
  var FLOORS = ['Ground floor', 'First floor', 'Loft'];
  var STOPS = [
    { room: 'Living room', floor: 0, size: '14 m²', shots: ['g-lounge-1', 'g-lounge', 'g-lounge-2'], dot: [61.1, 74.3] },
    { room: 'Kitchen & dining', floor: 0, size: '16 m²', shots: ['g-dining', 'g-kitchen', 'g-kitchen-2'], dot: [48.1, 20.2] },
    { room: 'Downstairs WC', floor: 0, size: '2 m²', shots: ['g-wc'], dot: [68.5, 45.5] },
    { room: 'Main bedroom', floor: 1, size: '15 m²', shots: ['g-bedroom', 'g-bedroom-2'], dot: [48.1, 22.0] },
    { room: 'Bathroom', floor: 1, size: '4 m²', shots: ['g-bath'], dot: [65.6, 51.4] },
    { room: 'Bedroom 2', floor: 1, size: '7 m²', shots: ['g-bedroom-3'], dot: [65.6, 72.5] },
    { room: 'The loft', floor: 2, size: 'boarded storage · Bedroom 3 + en-suite in this type', shots: ['g-loft', 'g-attic'], dot: [57.4, 62.4] }
  ];
  var wIdx = 0, wShot = 0;
  var imgsWrap = document.getElementById('walkImgs');
  var imgEls = {};
  STOPS.forEach(function (s, si) {
    s.shots.forEach(function (name, ni) {
      var im = document.createElement('img');
      // loading + decoding must be set before src or the browser fetches eagerly
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = s.room + ', show home photo ' + (ni + 1);
      im.src = 'assets/img/interiors/' + name + '.jpg';
      im.dataset.key = name;
      imgsWrap.appendChild(im);
      imgEls[name] = im;
    });
  });

  var roomsList = document.getElementById('walkRooms');
  STOPS.forEach(function (s, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.innerHTML = '<i>' + (i + 1) + '</i>' + s.room + '<small>' + ['G', '1', 'L'][s.floor] + '</small>';
    b.addEventListener('click', function () { goTo(i, 0); });
    li.appendChild(b);
    roomsList.appendChild(li);
  });

  var dot = document.getElementById('walkDot');
  var planImgs = Array.prototype.slice.call(document.querySelectorAll('.walk__planview img'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.walk__tabs button'));
  var elIndex = document.getElementById('walkIndex');
  var elRoom = document.getElementById('walkRoom');
  var elFloorline = document.getElementById('walkFloorline');
  var elProgress = document.getElementById('walkProgress');
  var shotsBtn = document.getElementById('walkShots');
  var elShotN = document.getElementById('walkShotN');
  var elShotT = document.getElementById('walkShotT');

  function showFloor(f) {
    planImgs.forEach(function (im) { im.classList.toggle('is-active', +im.dataset.floor === f); });
    tabs.forEach(function (t) { t.classList.toggle('is-active', +t.dataset.floor === f); });
  }

  var caption = document.getElementById('walkCaption');
  function render() {
    var s = STOPS[wIdx];
    var key = s.shots[wShot];
    if (caption) {
      caption.classList.add('is-changing');
      setTimeout(function () { caption.classList.remove('is-changing'); }, 330);
    }
    Object.keys(imgEls).forEach(function (k) {
      var on = k === key;
      imgEls[k].classList.toggle('is-active', on);
      if (on && reduced) imgEls[k].style.transform = 'none';
    });
    setTimeout(function () {
      elIndex.textContent = ('0' + (wIdx + 1)).slice(-2);
      elRoom.textContent = s.room;
      elFloorline.textContent = FLOORS[s.floor] + ' · ' + s.size;
    }, 160);
    elProgress.style.width = ((wIdx + 1) / STOPS.length * 100) + '%';
    showFloor(s.floor);
    dot.style.left = s.dot[0] + '%';
    dot.style.top = Math.min(s.dot[1] * (545 / 460), 95) + '%';
    Array.prototype.forEach.call(roomsList.children, function (li, i) {
      li.classList.toggle('is-active', i === wIdx);
    });
    if (s.shots.length > 1) {
      shotsBtn.hidden = false;
      elShotN.textContent = wShot + 1;
      elShotT.textContent = s.shots.length;
    } else {
      shotsBtn.hidden = true;
    }
  }

  function goTo(i, shot) {
    wIdx = (i + STOPS.length) % STOPS.length;
    wShot = shot || 0;
    render();
  }
  document.getElementById('walkNext').addEventListener('click', function () { goTo(wIdx + 1, 0); });
  document.getElementById('walkPrev').addEventListener('click', function () { goTo(wIdx - 1, 0); });
  shotsBtn.addEventListener('click', function () {
    wShot = (wShot + 1) % STOPS[wIdx].shots.length;
    render();
  });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var f = +t.dataset.floor;
      var target = STOPS.findIndex(function (s) { return s.floor === f; });
      if (target > -1) goTo(target, 0);
    });
  });
  var frame = document.getElementById('walkFrame');
  frame.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(wIdx + 1, 0); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(wIdx - 1, 0); }
  });
  document.getElementById('walkStage').addEventListener('click', function (e) {
    if (e.target.closest('button')) return;
    if (STOPS[wIdx].shots.length > 1) {
      wShot = (wShot + 1) % STOPS[wIdx].shots.length;
      render();
    }
  });
  render();

  /* ---------- tour video ---------- */
  var tourPlayer = document.getElementById('tourPlayer');
  document.getElementById('tourPlay').addEventListener('click', function () {
    var v = document.createElement('video');
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.src = 'assets/media/showhome-tour.mp4';
    tourPlayer.appendChild(v);
    tourPlayer.classList.add('is-playing');
  });

  /* ---------- reveals ---------- */
  var isStatic = document.documentElement.classList.contains('is-static');
  document.querySelectorAll('section, aside, footer').forEach(function (scope) {
    var kids = scope.querySelectorAll('.reveal');
    kids.forEach(function (el, i) { el.style.setProperty('--d', Math.min(i * 0.09, 0.45) + 's'); });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- gentle parallax (proof-of-care layer) ---------- */
  var plxEls = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  if (plxEls.length && !reduced && !isStatic) {
    var ticking = false;
    var applyPlx = function () {
      ticking = false;
      var vh = window.innerHeight;
      plxEls.forEach(function (el) {
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var centreOffset = (r.top + r.height / 2 - vh / 2) / vh;
        var f = parseFloat(el.dataset.plx) || 0.12;
        el.style.transform = 'translateY(' + (centreOffset * f * 100).toFixed(2) + 'px)';
      });
    };
    var onPlxScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(applyPlx); }
    };
    window.addEventListener('scroll', onPlxScroll, { passive: true });
    window.addEventListener('resize', onPlxScroll, { passive: true });
    applyPlx();
  }


  /* ---------- floor plan viewer ---------- */
  var PLANS = [
    { src: 'assets/img/plans/t1.jpg', title: '1 Bed Apartment', spec: 'Type A2 \u00b7 1B2P', area: 'GIA 40 m\u00b2' },
    { src: 'assets/img/plans/t2.jpg', title: '1 Bed Apartment', spec: 'Type B3 \u00b7 1B2P', area: 'GIA 51 m\u00b2' },
    { src: 'assets/img/plans/t3.jpg', title: '2 Bed Apartment', spec: 'Type D3 \u00b7 2B4P', area: 'GIA 70 m\u00b2' },
    { src: 'assets/img/plans/t4.jpg', title: '2 Bed House', spec: 'Two storeys \u00b7 2B4P', area: 'GIA 79 m\u00b2' },
    { src: 'assets/img/plans/t5.jpg', title: '3 Bed House', spec: 'Two storeys \u00b7 3B5P', area: 'GIA 101 m\u00b2' },
    { src: 'assets/img/plans/t6.jpg', title: '4 Bed House', spec: 'Two storeys \u00b7 4B6P', area: 'GIA 112 m\u00b2' }
  ];
  var viewer = document.getElementById('planViewer');
  var vStage = document.getElementById('viewerStage');
  var vImg = document.getElementById('viewerImg');
  var vTitle = document.getElementById('viewerTitle');
  var vSpec = document.getElementById('viewerSpec');
  var vArea = document.getElementById('viewerArea');
  var vIdx = 0;
  var lastTrigger = null;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function fillViewer(i) {
    var p = PLANS[i];
    vImg.src = p.src;
    vImg.alt = p.title + ', floor plan, ' + p.area;
    vTitle.textContent = p.title;
    vSpec.textContent = p.spec;
    vArea.textContent = p.area;
  }

  function openViewer(i, trigger) {
    vIdx = i;
    lastTrigger = trigger || null;
    fillViewer(vIdx);
    viewer.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () {
      viewer.classList.add('is-open');
      if (!reduced && trigger) {
        var from = trigger.getBoundingClientRect();
        var to = vStage.getBoundingClientRect();
        var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
        var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
        var s = Math.max(from.width / to.width, 0.1);
        vStage.style.transition = 'none';
        vStage.style.opacity = '0';
        vStage.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')';
        vStage.getBoundingClientRect();
        vStage.style.transition = 'transform 0.62s ' + EASE + ', opacity 0.42s ease';
        vStage.style.transform = 'none';
        vStage.style.opacity = '1';
      }
      viewer.focus();
    });
  }

  function closeViewer() {
    viewer.classList.remove('is-open');
    var done = function () {
      viewer.hidden = true;
      vStage.style.transition = 'none';
      vStage.style.transform = 'none';
      vStage.style.opacity = '1';
      document.body.classList.remove('is-locked');
      if (lastTrigger) lastTrigger.focus();
    };
    if (reduced) return done();
    if (lastTrigger) {
      var from = lastTrigger.getBoundingClientRect();
      var to = vStage.getBoundingClientRect();
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      var s = Math.max(from.width / to.width, 0.1);
      vStage.style.transition = 'transform 0.44s ' + EASE + ', opacity 0.36s ease';
      vStage.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')';
      vStage.style.opacity = '0';
    } else {
      vStage.style.transition = 'opacity 0.3s ease';
      vStage.style.opacity = '0';
    }
    setTimeout(done, 440);
  }

  function stepViewer(dir) {
    vIdx = (vIdx + dir + PLANS.length) % PLANS.length;
    vStage.style.transition = 'opacity 0.2s ease';
    vStage.style.opacity = '0';
    setTimeout(function () {
      fillViewer(vIdx);
      lastTrigger = document.querySelector('.plan__img[data-plan="' + vIdx + '"]');
      vStage.style.transition = 'opacity 0.4s ease';
      vStage.style.opacity = '1';
    }, 200);
  }

  document.querySelectorAll('.plan__img[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () { openViewer(+btn.dataset.plan, btn); });
  });
  document.getElementById('viewerClose').addEventListener('click', closeViewer);
  document.getElementById('viewerScrim').addEventListener('click', closeViewer);
  document.getElementById('viewerPrev').addEventListener('click', function () { stepViewer(-1); });
  document.getElementById('viewerNext').addEventListener('click', function () { stepViewer(1); });
  document.addEventListener('keydown', function (e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeViewer(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepViewer(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepViewer(-1); }
  });

  /* ---------- contact form (design preview) ---------- */
  var form = document.getElementById('contactForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('formOk').hidden = false;
  });
})();
