/**
 * ============================================================
 *  LUXURY BIRTHDAY EXPERIENCE — script.js  [FIXED]
 *  Single-file orchestrator. core.js / navbar.js / animation.js
 *  / slider.js are NOT loaded — all logic lives here.
 * ============================================================
 */

/* ============================================================
   GSAP PLUGIN REGISTRATION  (once, here only)
============================================================ */
gsap.registerPlugin(ScrollTrigger, TextPlugin, CustomEase);

CustomEase.create('luxuryIn',   '0.25, 0.1, 0.25, 1');
CustomEase.create('cinematic',  '0.76, 0, 0.24, 1');
CustomEase.create('softBounce', '0.34, 1.56, 0.64, 1');

/* ============================================================
   LENIS SMOOTH SCROLL
============================================================ */
let lenis;

function initLenis() {
  lenis = new Lenis({
    duration:        1.6,
    easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth:          true,
    smoothTouch:     false,   // native touch scroll is smoother on mobile
    syncTouch:       false,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Stop Lenis immediately — intro is active, scroll must be locked
  // This prevents Lenis from fighting overflow:hidden on iOS Safari
  lenis.stop();
}

/* ============================================================
   MAGNETIC BUTTONS
============================================================ */
function initMagneticButtons() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.28;
      const dy   = (e.clientY - cy) * 0.28;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'softBounce' });
    });
  });
}

/* ============================================================
   GLOBAL BACKGROUND CANVAS
============================================================ */
function initBgCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  // Skip on mobile — canvas particle loops are the #1 scroll lag cause
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d');
  let W, H;

  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Reduced from 55 → 30 particles on desktop
  for (let i = 0; i < 30; i++) {
    particles.push({
      x:    Math.random() * 1920,
      y:    Math.random() * 1080,
      r:    Math.random() * 2.5 + 0.5,
      vx:   (Math.random() - 0.5) * 0.15,
      vy:   (Math.random() - 0.5) * 0.1 - 0.06,
      life: Math.random(),
      spd:  Math.random() * 0.003 + 0.001,
      col:  Math.random() > 0.5 ? [196, 99, 122] : [201, 169, 110],
    });
  }

  function drawBg() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.life += p.spd;
      if (p.life > 1) { p.life = 0; p.x = Math.random() * W; p.y = H + 20; }
      const alpha = Math.sin(p.life * Math.PI) * 0.35;
      const [r, g, b] = p.col;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.5})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
    }
    requestAnimationFrame(drawBg);
  }
  drawBg();
}

/* ============================================================
   HERO BOKEH CANVAS
============================================================ */
function initHeroBokeh() {
  const canvas = document.getElementById('heroBokeh');
  if (!canvas) return;

  // Skip on mobile — this RAF loop fights the scroll compositor
  if (window.matchMedia('(max-width: 768px)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const bokeh = Array.from({ length: 18 }, () => ({
    x:    Math.random() * 1920,
    y:    Math.random() * 900,
    r:    Math.random() * 60 + 20,
    vx:   (Math.random() - 0.5) * 0.3,
    vy:   -(Math.random() * 0.25 + 0.1),
    a:    Math.random() * 0.12 + 0.04,
    col:  Math.random() > 0.5 ? '79,195,247' : '144,202,249',
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bokeh) {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,   `rgba(${b.col},${b.a})`);
      g.addColorStop(0.5, `rgba(${b.col},${b.a * 0.4})`);
      g.addColorStop(1,   `rgba(${b.col},0)`);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -b.r * 2) { b.y = H + b.r; b.x = Math.random() * W; }
      if (b.x < -b.r * 2 || b.x > W + b.r * 2) b.x = Math.random() * W;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   INTRO CANVAS — Star field
============================================================ */
function initIntroCanvas() {
  const canvas = document.getElementById('introCanvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const W = canvas.width  = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const starCount = isMobile ? 60 : 140;

  const stars = Array.from({ length: starCount }, () => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    r:    Math.random() * 1.5 + 0.3,
    a:    Math.random(),
    spd:  Math.random() * 0.008 + 0.002,
  }));

  let running = true;
  let rafId;

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.a += s.spd;
      const alpha = (Math.sin(s.a) * 0.5 + 0.5) * 0.6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }
  draw();

  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

/* ============================================================
   FINALE CANVAS — Confetti burst
============================================================ */
function initFinaleCanvas() {
  const canvas = document.getElementById('finaleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const W = () => canvas.width;
  const H = () => canvas.height;
  const confetti = [];
  const cols = ['#4fc3f7', '#90caf9', '#b3e5fc', '#e1f5fe', '#5c6bc0', '#ffffff'];

  function burst() {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      confetti.push({
        x:    W() / 2 + (Math.random() - 0.5) * 300,
        y:    H() / 2 + (Math.random() - 0.5) * 200,
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed - 2,
        r:    Math.random() * 3 + 1,
        col:  cols[Math.floor(Math.random() * cols.length)],
        life: 1,
        fade: Math.random() * 0.015 + 0.008,
        rot:  Math.random() * 360,
        rotS: (Math.random() - 0.5) * 4,
        kind: Math.random() > 0.6 ? 'rect' : 'circle',
      });
    }
  }

  ScrollTrigger.create({
    trigger: '.finale-section',
    start: 'top 70%',
    onEnter: () => {
      const id = setInterval(burst, 300);
      setTimeout(() => clearInterval(id), 6000);
    },
    once: true,
  });

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.08;
      p.vx  *= 0.99;
      p.life -= p.fade;
      p.rot  += p.rotS;
      if (p.life <= 0) { confetti.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.col;
      if (p.kind === 'rect') {
        ctx.fillRect(-p.r, -p.r * 2, p.r * 2, p.r * 4);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   HERO PARTICLES
============================================================ */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  const frag = document.createDocumentFragment();

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const particleCount = isMobile ? 20 : 50;

  for (let i = 0; i < particleCount; i++) {
    const p     = document.createElement('div');
    const size  = Math.random() * 2.5 + 0.5;
    const left  = Math.random() * 100;
    const bot   = Math.random() * 80;
    const dur   = Math.random() * 10 + 7;
    const delay = Math.random() * 12;
    const drift = (Math.random() - 0.5) * 100;
    const isHeart = Math.random() > 0.82;

    p.classList.add('particle');
    if (isHeart) {
      p.style.cssText = `
        left:${left}%;bottom:${bot}%;
        font-size:${Math.random() * 10 + 7}px;
        --drift:${drift}px;
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        width:auto;height:auto;background:none;border-radius:0;opacity:0;
        animation-name:particleFloat;
      `;
      p.textContent = Math.random() > 0.5 ? '♡' : '✦';
      p.style.color = Math.random() > 0.5 ? 'var(--rose)' : 'var(--gold)';
    } else {
      p.style.cssText = `
        width:${size}px;height:${size}px;
        left:${left}%;bottom:${bot}%;
        background:${Math.random() > 0.5 ? 'var(--rose)' : 'var(--gold-light)'};
        --drift:${drift}px;
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        opacity:0;
      `;
    }
    frag.appendChild(p);
  }
  container.appendChild(frag);
}

/* ============================================================
   CINEMATIC INTRO — luxury reveal sequence
============================================================ */
function initIntro() {
  const intro    = document.getElementById('intro');
  const logo     = document.getElementById('introLogo');
  const line1    = document.getElementById('iLine1');
  const line3    = document.getElementById('iLine3');
  const rule     = document.getElementById('introRule');
  const dateLine = document.getElementById('introDateLine');

  if (!intro) return;

  document.body.classList.add('intro-active');

  if (dateLine) {
    dateLine.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  const stopStars = initIntroCanvas();

  setTimeout(() => logo  && logo.classList.add('show'),  400);
  setTimeout(() => line1 && line1.classList.add('show'), 1100);
  setTimeout(() => line3 && line3.classList.add('show'), 2000);
  setTimeout(() => rule  && rule.classList.add('show'),  2500);
  setTimeout(() => dateLine && dateLine.classList.add('show'), 3000);

  // Safety net: force-unlock scroll after 7s in case GSAP onComplete never fires
  const scrollSafetyTimer = setTimeout(() => {
    document.body.classList.remove('intro-active');
    document.body.style.overflow = '';
    if (lenis) { lenis.start(); requestAnimationFrame(() => ScrollTrigger.refresh()); }
    if (intro && !intro.classList.contains('hidden')) {
      intro.classList.add('hidden');
    }
  }, 7000);

  setTimeout(() => {
    if (stopStars) stopStars();

    gsap.to(intro, {
      opacity: 0,
      filter:  'blur(12px)',
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        clearTimeout(scrollSafetyTimer);
        intro.classList.add('hidden');
        document.body.classList.remove('intro-active');
        document.body.style.overflow = ''; // explicit reset in case CSS cascade conflict

        // Re-enable Lenis now that scroll lock is lifted
        if (lenis) {
          lenis.start();
          // Refresh ScrollTrigger AFTER Lenis starts so all trigger positions
          // are calculated against the correct scroll position (not 0 during intro)
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }

        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.add('visible');

        initScrollAnimations();
        initTypewriter();
        initFloatingHearts();
      },
    });
  }, 4500);
}

/* ============================================================
   NAVBAR
============================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = navLinks ? Array.from(navLinks.querySelectorAll('.nav-link')) : [];

  if (!navbar) return;

  ScrollTrigger.create({
    start: 'top -80',
    onEnter:     () => navbar.classList.add('scrolled'),
    onLeaveBack: () => navbar.classList.remove('scrolled'),
  });

  if (hamburger && navLinks) {
    const toggleMenu = (open) => {
      hamburger.classList.toggle('open', open);
      navLinks.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    };

    hamburger.addEventListener('click', () => toggleMenu(!hamburger.classList.contains('open')));
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu(!hamburger.classList.contains('open'));
      }
    });

    links.forEach(l => l.addEventListener('click', () => toggleMenu(false)));

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') &&
          !navLinks.contains(e.target) &&
          !hamburger.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = navLinks
          ? navLinks.querySelector(`[href="#${entry.target.id}"]`)
          : null;
        if (match) match.classList.add('active');
      }
    });
  }, {
    rootMargin: `${-Math.floor(window.innerHeight * 0.25)}px 0px ${-Math.floor(window.innerHeight * 0.55)}px 0px`,
    threshold: 0,
  });

  sections.forEach(s => io.observe(s));
}

/* ============================================================
   NAVBAR SMOOTH SCROLL (Lenis)
============================================================ */
function initNavScroll() {
  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
  ) || 80;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id     = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;   // ← null check: anchors pointing to deleted sections won't crash

      if (lenis) {
        lenis.scrollTo(target, {
          offset:   -(navH + 16),
          duration: 2,
          easing:   (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   SWIPER GALLERY — Dynamic Image System
   ─────────────────────────────────────────────────────────────
   CARA PAKAI:
   1. Taruh foto di assets/images/ dengan nama img1.jpeg, dst.
   2. Edit array galleryData di bawah sesuai nama & judul foto.
   3. Simpan & refresh — foto langsung muncul di slider.
============================================================ */
function initGallery() {

  const galleryData = [
    {
      img:     './assets/images/img1.jpeg',
      num:     '01',
      title:   'Effortlessly Beautiful',
      quote:   '"Even the simplest moment turns perfect with you in it."',
      fallback:'linear-gradient(135deg,#030810 0%,#0a1f3d 40%,#0d3060 70%,#1a5f8a 100%)',
      icon:    '❄️',
      iconBg1: 'rgba(79,195,247,0.2)',
      iconBg2: 'rgba(79,195,247,0.12)',
    },
    {
      img:     './assets/images/img2.jpeg',
      num:     '02',
      title:   'A Face Like a Dream',
      quote:   '"Somehow, you make reality look better than imagination."',
      fallback:'linear-gradient(135deg,#050d1a 0%,#0d2040 40%,#1a3a6b 70%,#2d5fa8 100%)',
      icon:    '⭐',
      iconBg1: 'rgba(92,107,192,0.25)',
      iconBg2: 'rgba(144,202,249,0.15)',
    },
    {
      img:     './assets/images/img3.jpeg',
      num:     '03',
      title:   'Pure Elegance',
      quote:   '"There’s a quiet grace in you that speaks louder than words."',
      fallback:'linear-gradient(135deg,#030a18 0%,#061828 40%,#0a2d4f 70%,#0d5080 100%)',
      icon:    '💎',
      iconBg1: 'rgba(79,195,247,0.22)',
      iconBg2: 'rgba(144,202,249,0.14)',
    },
    {
      img:     './assets/images/img4.jpeg',
      num:     '04',
      title:   'Captured Perfection',
      quote:   '"No filter could ever match what you naturally are."',
      fallback:'linear-gradient(135deg,#040d1f 0%,#082240 40%,#0e3a6e 70%,#1a6aaa 100%)',
      icon:    '🌸',
      iconBg1: 'rgba(144,202,249,0.2)',
      iconBg2: 'rgba(179,229,252,0.12)',
    },
    {
      img:     './assets/images/img5.jpeg',
      num:     '05',
      title:   'Simply Irresistible',
      quote:   '"It’s impossible not to stop and admire you."',
      fallback:'linear-gradient(135deg,#04091a 0%,#0a1535 40%,#122060 70%,#2038a0 100%)',
      icon:    '✨',
      iconBg1: 'rgba(92,107,192,0.25)',
      iconBg2: 'rgba(144,202,249,0.18)',
    },
  ];

  const total   = galleryData.length;
  const wrapper = document.querySelector('#gallerySwiper .swiper-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = galleryData.map((d, i) => `
    <div class="swiper-slide gallery-slide">
      <div class="slide-inner">
        <div class="slide-img-wrap">
          <a href="${d.img}" class="glightbox slide-lightbox-link" data-gallery="birthday-gallery" data-title="${d.title}" data-description="${d.quote.replace(/"/g,'&quot;')}" aria-label="View ${d.title} fullscreen">
          <div class="slide-img" id="slideImg${i}" style="background:${d.fallback};">
            <img
              src="${d.img}"
              alt="${d.title}"
              loading="lazy"
              onerror="this.style.display='none';"
              onload="this.style.opacity='1';"
              style="opacity:0;transition:opacity 0.6s ease;"
            />
            <div class="slide-img-overlay"></div>
            <div class="slide-placeholder-art" aria-hidden="true">
              <div class="art-circle art-c1" style="background:${d.iconBg1}"></div>
              <div class="art-circle art-c2" style="background:${d.iconBg2}"></div>
              <span class="art-icon">${d.icon}</span>
            </div>
            <div class="slide-ken-burns"></div>
            <div class="slide-lightbox-hint" aria-hidden="true"><span>⤢</span></div>
          </div>
          </a>
        </div>
        <div class="slide-caption">
          <p class="slide-num">${d.num} / ${String(total).padStart(2,'0')}</p>
          <h3 class="slide-title">${d.title}</h3>
          <p class="slide-quote">${d.quote}</p>
        </div>
        <div class="slide-ambient-glow"></div>
      </div>
    </div>
  `).join('');

  new Swiper('#gallerySwiper', {
    effect:           'slide',
    grabCursor:       true,
    centeredSlides:   false,
    loop:             true,
    speed:            750,
    slidesPerView:    1,
    spaceBetween:     20,
    touchRatio:       1,
    touchAngle:       45,
    simulateTouch:    true,
    longSwipesRatio:  0.2,
    followFinger:     true,
    threshold:        4,
    autoplay: {
      delay:                4500,
      disableOnInteraction: false,
      pauseOnMouseEnter:    true,
      waitForTransition:    true,
    },
    pagination: {
      el:        '.gallery-pagination',
      clickable: true,
    },
    navigation: {
      prevEl: '.gallery-prev',
      nextEl: '.gallery-next',
    },
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: {
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
    },
    breakpoints: {
      600: {
        slidesPerView:  1.25,
        spaceBetween:   24,
        centeredSlides: true,
      },
      900: {
        slidesPerView:  2,
        spaceBetween:   28,
        centeredSlides: false,
      },
      1100: {
        slidesPerView:  3,
        spaceBetween:   32,
        centeredSlides: false,
      },
    },
  });
}

/* ============================================================
   SCROLL ANIMATIONS — GSAP + ScrollTrigger
============================================================ */
function initScrollAnimations() {
  gsap.utils.toArray('.section-header').forEach(el => {
    gsap.fromTo(Array.from(el.children),
      { y: 50, opacity: 0 },
      {
        scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' },
        y: 0, opacity: 1, stagger: 0.18, duration: 1.1, ease: 'power3.out',
        clearProps: 'transform,opacity',
      }
    );
  });

  // FIX: Remove data-aos from reason cards (handled entirely by GSAP below)
  document.querySelectorAll('.reason-card').forEach(card => {
    card.removeAttribute('data-aos');
    card.removeAttribute('data-aos-delay');
  });

  gsap.utils.toArray('.reason-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 40, opacity: 0, scale: 0.97 },
      {
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
        y: 0, opacity: 1, scale: 1,
        duration: 0.85,
        delay: i * 0.07,
        ease: 'power2.out',
        clearProps: 'transform,opacity,scale',
      }
    );
  });

  // FIX: guard with element existence check before animating
  if (document.querySelector('.finale-title')) {
    gsap.from('.finale-title', {
      scrollTrigger: { trigger: '.finale-section', start: 'top 75%' },
      y: 80, opacity: 0, duration: 1.5, ease: 'power4.out',
      clearProps: 'opacity,transform', // CRITICAL: release opacity after animation
    });
  }
  if (document.querySelector('.finale-pre')) {
    gsap.from(['.finale-pre', '.finale-icon', '.finale-quote', '.finale-wish'], {
      scrollTrigger: { trigger: '.finale-section', start: 'top 75%' },
      y: 40, opacity: 0, stagger: 0.2, duration: 1.2, delay: 0.3, ease: 'power3.out',
      clearProps: 'opacity,transform', // CRITICAL: release opacity after animation
    });
  }

  if (document.querySelector('.footer-content')) {
    gsap.from('.footer-content > *', {
      scrollTrigger: { trigger: '.footer', start: 'top 88%' },
      y: 30, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power2.out',
    });
  }

  if (document.querySelector('.hero-orb-1')) {
    gsap.to('.hero-orb-1', {
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      },
      y: -160, x: 60,
    });
  }
  if (document.querySelector('.hero-orb-2')) {
    gsap.to('.hero-orb-2', {
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      },
      y: -90, x: -40,
    });
  }

  gsap.utils.toArray('.message-card').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      scale: 0.97, opacity: 0, duration: 1.1, ease: 'power2.out',
      clearProps: 'opacity,scale,transform',
    });
  });
}

/* ============================================================
   TYPEWRITER
   FIX: element 'typewriterText' was deleted from HTML — 
   function now returns early with null check (no crash).
   If you add the element back, it will auto-work again.
============================================================ */
function initTypewriter() {
  const el = document.getElementById('typewriterText');
  if (!el) return;   // ← FIXED: graceful exit if element doesn't exist

  const messages = [
    'You are the most beautiful thing that has ever happened to me.',
    'Every day with you is a gift I never want to stop unwrapping.',
    'Happy Birthday to the one who makes my world infinitely brighter.',
    'You are extraordinary, and I hope you feel that today and always.',
    'In a world full of ordinary, you are the extraordinary one.',
    'I love you more today than I did yesterday — and tomorrow I will love you even more.',
    'Today the world celebrates you — and I celebrate you every single day.',
  ];

  let msgIdx   = 0;
  let charIdx  = 0;
  let deleting = false;
  let paused   = false;

  function type() {
    if (paused) return;
    const current = messages[msgIdx];

    if (deleting) {
      el.textContent = current.slice(0, charIdx--);
      if (charIdx < 0) {
        deleting = false;
        msgIdx   = (msgIdx + 1) % messages.length;
        setTimeout(type, 600);
        return;
      }
      setTimeout(type, 28);
    } else {
      el.textContent = current.slice(0, charIdx++);
      if (charIdx > current.length) {
        paused = true;
        setTimeout(() => {
          paused   = false;
          deleting = true;
          type();
        }, 3800);
        return;
      }
      setTimeout(type, 52);
    }
  }

  ScrollTrigger.create({
    trigger: '#message',
    start:   'top 70%',
    onEnter: type,
    once:    true,
  });
}

/* ============================================================
   FLOATING HEARTS
============================================================ */
function initFloatingHearts() {
  const container = document.getElementById('floatingHearts');
  if (!container) return;

  const chars = ['♡', '♥', '✦', '✿', '°', '·'];

  function spawn() {
    const h = document.createElement('span');
    h.classList.add('float-heart');
    h.textContent             = chars[Math.floor(Math.random() * chars.length)];
    h.style.left              = Math.random() * 100 + 'vw';
    h.style.fontSize          = (Math.random() * 14 + 7) + 'px';
    h.style.color             = Math.random() > 0.5 ? 'var(--rose)' : 'var(--gold)';
    h.style.animationDuration = (Math.random() * 9 + 7) + 's';
    container.appendChild(h);
    setTimeout(() => {
      if (h.parentNode) h.parentNode.removeChild(h);
    }, 18000);
  }

  spawn();
  const spawnInterval = window.matchMedia('(max-width: 768px)').matches ? 4000 : 1800;
  setInterval(spawn, spawnInterval);
}

/* ============================================================
   FINALE HEARTS BURST
============================================================ */
function initFinaleHearts() {
  const container = document.getElementById('finaleHearts');
  if (!container) return;

  ScrollTrigger.create({
    trigger: '.finale-section',
    start:   'top 60%',
    onEnter: () => {
      const intervalId = setInterval(() => {
        const h = document.createElement('span');
        h.className   = 'float-heart';
        h.textContent = Math.random() > 0.5 ? '♡' : '✦';
        h.style.left  = (20 + Math.random() * 60) + '%';
        h.style.fontSize        = (Math.random() * 20 + 10) + 'px';
        h.style.color           = Math.random() > 0.5 ? 'var(--rose)' : 'var(--gold-light)';
        h.style.animationDuration = (Math.random() * 5 + 4) + 's';
        container.appendChild(h);
        setTimeout(() => { if (h.parentNode) h.parentNode.removeChild(h); }, 10000);
      }, 300);
      setTimeout(() => clearInterval(intervalId), 8000);
    },
    once: true,
  });
}

/* ============================================================
   3D TILT CARDS
============================================================ */
function initTiltCards() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const rx   = ((e.clientY - rect.top  - rect.height / 2) / rect.height) * -12;
      const ry   = ((e.clientX - rect.left - rect.width  / 2) / rect.width)  *  12;
      gsap.to(card, {
        rotateX: rx, rotateY: ry,
        duration: 0.5, ease: 'power1.out',
        transformPerspective: 800,
        transformOrigin: 'center center',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'softBounce' });
    });
  });
}

/* ============================================================
   CLICK SPARKLE
============================================================ */
function initClickSparkle() {
  document.addEventListener('click', (e) => {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;

    for (let i = 0; i < 8; i++) {
      const s      = document.createElement('div');
      const isGold = Math.random() > 0.5;
      const color  = isGold ? 'var(--gold)' : 'var(--rose)';
      s.style.cssText = `
        position:fixed;
        left:${e.clientX}px;
        top:${e.clientY}px;
        width:5px;height:5px;
        border-radius:50%;
        pointer-events:none;
        z-index:99998;
        background:${color};
        box-shadow:0 0 8px ${color};
      `;
      document.body.appendChild(s);
      const angle = (i / 8) * Math.PI * 2;
      const dist  = Math.random() * 60 + 25;
      gsap.to(s, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: 0,
        duration: 0.65,
        ease: 'power2.out',
        onComplete: () => { if (s.parentNode) s.parentNode.removeChild(s); },
      });
    }
  });
}

/* ============================================================
   HERO DATE
============================================================ */
function initHeroDate() {
  const el = document.getElementById('heroDate');
  if (!el) return;
  el.textContent = '— ' + new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) + ' —';
}

/* ============================================================
   FOOTER PARTICLES
============================================================ */
function initFooterParticles() {
  const container = document.getElementById('footerParticles');
  if (!container) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 28; i++) {
    const p    = document.createElement('div');
    const size = Math.random() * 2 + 1;
    p.classList.add('particle');
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random() * 100}%;
      bottom:0;
      background:${Math.random() > 0.5 ? 'var(--rose)' : 'var(--gold)'};
      --drift:${(Math.random() - 0.5) * 70}px;
      animation-duration:${Math.random() * 8 + 4}s;
      animation-delay:${Math.random() * 7}s;
    `;
    frag.appendChild(p);
  }
  container.appendChild(frag);
}

/* ============================================================
   AOS INIT
============================================================ */
function initAOS() {
  AOS.init({
    duration: 950,
    easing:   'ease-out-quart',
    once:     true,
    offset:   60,
  });
}

/* ============================================================
   INIT ALL
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeroDate();
  initHeroParticles();
  initFooterParticles();
  initAOS();
  initNavbar();
  initGallery();
  initLenis();
  initNavScroll();
  initBgCanvas();
  initHeroBokeh();
  initMagneticButtons();
  initClickSparkle();
  initFinaleCanvas();
  initFinaleHearts();
  initIntro();
  setTimeout(initTiltCards, 200);
});

/* ============================================================
   RESIZE HANDLER
============================================================ */
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
}, { passive: true });
