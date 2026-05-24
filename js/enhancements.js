/**
 * ============================================================
 *  BIRTHDAY ENHANCEMENTS — enhancements.js
 *  Adds: Three.js 3D background · canvas-confetti · GLightbox
 *        GSAP hero entrance · navbar brand reveal
 *  Loaded AFTER script.js — all CDNs already available.
 * ============================================================
 */

/* ============================================================
   THREE.JS — Soft 3D Floating Particle Cloud
   Lightweight: ~300 particles, no heavy shaders.
   Sits behind everything via .three-canvas (z-index: 0)
============================================================ */
function initThreeBackground() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Three.js WebGL on mobile causes heavy GPU drain and scroll jank
  if (window.matchMedia('(max-width: 768px)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  /* --- Particle geometry --- */
  const COUNT   = 180; // reduced from 280
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);

  // Palette: rose, gold, soft purple, blush white
  const palette = [
    [0.310, 0.765, 0.969],  // ice blue #4fc3f7
    [0.565, 0.792, 0.976],  // ice blue-2 #90caf9
    [0.361, 0.420, 0.753],  // indigo #5c6bc0
    [0.882, 0.961, 0.996],  // ice mist #e1f5fe
  ];

  for (let i = 0; i < COUNT; i++) {
    // Spread particles in a soft sphere
    const theta  = Math.random() * Math.PI * 2;
    const phi    = Math.acos(2 * Math.random() - 1);
    const radius = 3.5 + Math.random() * 5;

    positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) - 2;

    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = col[0];
    colors[i * 3 + 1] = col[1];
    colors[i * 3 + 2] = col[2];

    sizes[i] = Math.random() * 3.5 + 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  /* --- Circular soft sprite texture --- */
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.3,  'rgba(255,255,255,0.6)');
    g.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const material = new THREE.PointsMaterial({
    size:           0.04,
    map:            sprite,
    vertexColors:   true,
    transparent:    true,
    opacity:        0.55,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
    sizeAttenuation:true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  /* --- Drift velocities per particle --- */
  const vel = Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 0.0006,
    y: (Math.random() - 0.5) * 0.0004 - 0.0002, // slight upward drift
    z: (Math.random() - 0.5) * 0.0003,
  }));

  /* --- Resize handler --- */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  /* --- Parallax on mouse move (desktop only) --- */
  let mouseX = 0, mouseY = 0;
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.2;
    }, { passive: true });
  }

  /* --- Animate --- */
  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);

    // Drift each particle
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += vel[i].x;
      pos[i * 3 + 1] += vel[i].y;
      pos[i * 3 + 2] += vel[i].z;

      // Wrap when they drift too far
      if (Math.abs(pos[i * 3])     > 9) vel[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 9) vel[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 9) vel[i].z *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    // Gentle rotation
    points.rotation.y += 0.0004;
    points.rotation.x += 0.0001;

    // Camera parallax following mouse
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  // Pause when tab is hidden to save GPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else animate();
  });
}


/* ============================================================
   CANVAS-CONFETTI — Elegant birthday burst
   Triggered on page load (gentle) + confetti button (full burst)
============================================================ */
function initConfetti() {
  if (typeof confetti === 'undefined') return;

  /* Palette matches the site's rose/gold/purple scheme */
  const colors = ['#4fc3f7', '#90caf9', '#5c6bc0', '#e1f5fe', '#b3e5fc', '#e3f2fd'];

  /* --- Page-load: soft gentle shower after intro fades --- */
  function gentleShower() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount:  2,
        angle:          60,
        spread:         55,
        origin:         { x: 0, y: 0.6 },
        colors,
        shapes:         ['circle', 'square'],
        scalar:         0.8,
        drift:          0.5,
        gravity:        0.6,
        ticks:          200,
      });
      confetti({
        particleCount:  2,
        angle:          120,
        spread:         55,
        origin:         { x: 1, y: 0.6 },
        colors,
        shapes:         ['circle', 'square'],
        scalar:         0.8,
        drift:          -0.5,
        gravity:        0.6,
        ticks:          200,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }

  /* --- Button: festive full burst from center --- */
  function celebrationBurst() {
    // First pop — wide spread
    confetti({
      particleCount: 80,
      spread:        100,
      origin:        { y: 0.55 },
      colors,
      shapes:        ['circle', 'square', 'star'],
      scalar:        1.1,
      gravity:       0.8,
      ticks:         300,
    });

    // Second pop — tight high burst with hearts-like big particles
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread:        60,
        origin:        { y: 0.6 },
        colors:        ['#4fc3f7', '#b3e5fc', '#e1f5fe'],
        shapes:        ['circle'],
        scalar:        1.4,
        gravity:       0.5,
        ticks:         350,
      });
    }, 180);

    // Third — golden rain from top
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle:         90,
        spread:        200,
        origin:        { x: 0.5, y: 0 },
        colors:        ['#90caf9', '#e3f2fd', '#f0f8ff'],
        shapes:        ['square'],
        scalar:        0.7,
        gravity:       1.2,
        ticks:         280,
        startVelocity: 20,
      });
    }, 350);
  }

  /* Trigger gentle shower after intro disappears (~3.8s) */
  setTimeout(gentleShower, 3800);

  /* Confetti button */
  const btn = document.getElementById('confettiBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      celebrationBurst();
      /* GSAP button pulse feedback */
      gsap.fromTo(btn,
        { scale: 0.92 },
        { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
      );
    });
  }
}


/* ============================================================
   GLIGHTBOX — Fullscreen image lightbox for gallery
   Initialised after gallery slides are injected by script.js
============================================================ */
function initLightbox() {
  if (typeof GLightbox === 'undefined') return;

  // Wait for gallery DOM to be injected by script.js
  const waitForGallery = setInterval(() => {
    if (document.querySelector('.glightbox')) {
      clearInterval(waitForGallery);

      const lightbox = GLightbox({
        selector:      '.glightbox',
        touchNavigation: true,
        loop:          true,
        autoplayVideos: false,
        openEffect:    'fade',
        closeEffect:   'fade',
        slideEffect:   'slide',
        moreLength:    0,
        cssEfects: {
          fade:  { in: 'fadeIn',  out: 'fadeOut'  },
          slide: { in: 'slideInRight', out: 'slideOutLeft' },
        },
        svg: {
          // Use elegant custom close / arrow icons
          close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          next:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>',
          prev:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="15 18 9 12 15 6"/></svg>',
        },
      });
    }
  }, 300);
}


/* ============================================================
   GSAP — Enhanced entrance animations
   Layered on top of existing AOS (runs on scroll / load)
============================================================ */
function initEnhancedAnimations() {
  if (typeof gsap === 'undefined') return;

  /* --- Navbar brand name letter-stagger reveal --- */
  const brandName = document.querySelector('.nav-brand-name');
  if (brandName) {
    // Split text into spans for letter animation
    const text = brandName.textContent;
    brandName.innerHTML = text.split('').map(ch =>
      ch === ' ' ? ' ' : `<span class="brand-letter" style="display:inline-block">${ch}</span>`
    ).join('');

    // Animate in after navbar becomes visible (~3.5s into intro)
    setTimeout(() => {
      gsap.from('.brand-letter', {
        y: 12, opacity: 0, rotateX: -40,
        duration: 0.6,
        stagger: 0.04,
        ease: 'back.out(1.7)',
      });
    }, 3600);
  }

  /* --- Hero eyebrow + title stagger (enhances existing) --- */
  // Uses a short delay to not collide with intro
  setTimeout(() => {
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const heroScript  = document.querySelector('.hero-script');
    const heroSerif   = document.querySelector('.hero-serif');
    const heroName    = document.querySelector('.hero-name');
    const heroCta     = document.querySelector('.hero-cta-wrap');

    const heroEls = [heroEyebrow, heroScript, heroSerif, heroName, heroCta].filter(Boolean);
    if (heroEls.length) {
      gsap.from(heroEls, {
        y: 30, opacity: 0,
        duration: 1.2,
        stagger: 0.18,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }
  }, 3400);

  /* --- Reason cards: gentle float-up on scroll --- */
  gsap.utils.toArray('.reason-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      y: 50,
      opacity: 0,
      duration: 0.85,
      delay: i * 0.08,
      ease: 'power2.out',
      clearProps: 'all',
    });
  });

  /* --- Message card: soft scale + fade --- */
  const msgCard = document.querySelector('.message-card');
  if (msgCard) {
    gsap.from(msgCard, {
      scrollTrigger: { trigger: msgCard, start: 'top 80%' },
      scale: 0.96,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      clearProps: 'all',
    });
  }

  /* --- Finale section: title pop + glow ---
     NOTE: Removed — script.js already registers a ScrollTrigger for .finale-title
     inside initScrollAnimations(). Having two gsap.from() on the same element
     creates conflicting animations that can leave opacity stuck at 0. --- */

  /* --- Confetti button: pulsing glow on scroll enter --- */
  const confettiBtn = document.getElementById('confettiBtn');
  if (confettiBtn) {
    ScrollTrigger.create({
      trigger: confettiBtn,
      start: 'top 85%',
      onEnter: () => {
        gsap.fromTo(confettiBtn,
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
        );
      },
    });
  }

  /* --- Gallery section header: split word reveal --- */
  const galleryTitle = document.querySelector('#gallery .section-title');
  if (galleryTitle) {
    const words = galleryTitle.textContent.split(' ');
    galleryTitle.innerHTML = words.map(w =>
      `<span class="word-wrap" style="display:inline-block;overflow:hidden;vertical-align:bottom">` +
      `<span class="word-inner" style="display:inline-block">${w}</span></span>`
    ).join(' ');

    gsap.from('#gallery .word-inner', {
      scrollTrigger: { trigger: galleryTitle, start: 'top 85%' },
      y: '100%',
      opacity: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }
}


/* ============================================================
   INIT ALL ENHANCEMENTS
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initThreeBackground();
  initConfetti();
  initLightbox();
  initEnhancedAnimations();
});
