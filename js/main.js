const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const themeButton = document.querySelector('.theme-toggle');
const mascotDock = document.querySelector('.mascot-dock');
const mascotButton = document.querySelector('.mascot-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateThemeButton = theme => {
  if (!themeButton) return;
  const lightTheme = theme === 'light';
  themeButton.setAttribute('aria-pressed', String(lightTheme));
  themeButton.setAttribute('aria-label', `Aktifkan mode ${lightTheme ? 'gelap' : 'terang'}`);
  themeButton.querySelector('.theme-label').textContent = lightTheme ? 'Gelap' : 'Terang';
  themeButton.querySelector('.theme-icon').textContent = lightTheme ? '\u263E' : '\u25D0';
};

updateThemeButton(document.documentElement.dataset.theme);

themeButton?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.add('theme-transition');
  document.documentElement.dataset.theme = theme;
  updateThemeButton(theme);
  try {
    localStorage.setItem('rahman-portfolio-theme', theme);
  } catch {
    document.documentElement.dataset.theme = theme;
  }
  window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 250);
});

const closeMenu = ({ restoreFocus = false } = {}) => {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Buka navigasi');
  navigation.classList.remove('is-open');
  if (restoreFocus) menuButton.focus();
};

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Buka navigasi' : 'Tutup navigasi');
    navigation.classList.toggle('is-open', !expanded);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu({ restoreFocus: true });
  });
  document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) closeMenu();
  });
}

const revealElements = document.querySelectorAll('.reveal');
if (motionPreference.matches || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('is-visible'));
} else {
  document.documentElement.classList.add('js-ready');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 80px 0px' });
  revealElements.forEach(element => revealObserver.observe(element));
  // Hardening: if the observer silently fails (e.g. in a headless screenshot),
  // force every reveal visible after a generous timeout so content is never
  // permanently hidden.
  window.setTimeout(() => {
    revealElements.forEach(element => {
      if (!element.classList.contains('is-visible')) element.classList.add('is-visible');
    });
  }, 4500);
}

// The engine only exports mount(); nothing self-initialises, so the
// data-sc-progress bar and hero parallax stay inert until this runs.
if (window.ScrollCraft) window.ScrollCraft.mount();

const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);

// --- Hero Stickers: Letter-Terrain Gravity & Block Physics Engine ---
const dragItems = Array.from(document.querySelectorAll('[data-draggable]'));
if (dragItems.length > 0) {
  const isDesktop = () => window.innerWidth > 720;
  const calmMotion = motionPreference.matches;

  const stickers = dragItems.map((el, index) => ({
    el,
    index,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tilt: 0,
    vRot: 0,
    baseCx: 0,
    baseCy: 0,
    hw: 0,
    hh: 0,
    isDragging: false,
    resting: false
  }));

  const updateBases = () => {
    stickers.forEach(s => {
      const rect = s.el.getBoundingClientRect();
      s.hw = rect.width / 2;
      s.hh = rect.height / 2;
      s.baseCx = (rect.left + s.hw) - s.x;
      s.baseCy = (rect.top + s.hh) - s.y;
    });
  };

  updateBases();

  // Terrain calculation directly upon the visible letterforms of "MUHAMMAD"
  const getLetterFloor = (xViewport) => {
    const h1 = document.querySelector('#hero-title');
    if (!h1 || !h1.firstChild) return { y: 250, slope: 0 };
    let wr;
    try {
      const range = document.createRange();
      range.setStart(h1.firstChild, 0);
      range.setEnd(h1.firstChild, Math.min(8, h1.firstChild.length || 8));
      wr = range.getBoundingClientRect();
    } catch (_) {
      wr = h1.getBoundingClientRect();
    }

    const hr = h1.getBoundingClientRect();
    // Top cap elevation of visible "MUHAMMAD" uppercase glyphs
    const capTop = hr.top + 18;

    if (xViewport < wr.left - 30 || xViewport > wr.right + 30) {
      return { y: capTop + 25, slope: 0 };
    }

    const u = clamp((xViewport - wr.left) / Math.max(1, wr.width), 0, 1);
    const letterIndex = Math.min(7, Math.floor(u * 8));
    const localU = (u * 8) - letterIndex;

    let dy = 0;
    let slope = 0;
    switch (letterIndex) {
      case 0: // M
      case 4: // M
      case 5: // M
        dy = Math.sin(localU * Math.PI) * 7.5;
        slope = Math.cos(localU * Math.PI) * 0.16;
        break;
      case 1: // U
        dy = Math.sin(localU * Math.PI) * 5.0;
        slope = Math.cos(localU * Math.PI) * 0.12;
        break;
      case 2: // H
        dy = Math.sin(localU * Math.PI) * 3.0;
        slope = Math.cos(localU * Math.PI) * 0.08;
        break;
      case 3: // A
      case 6: // A
        dy = -4.0 + Math.abs(localU - 0.5) * 8.0;
        slope = (localU > 0.5 ? 0.18 : -0.18);
        break;
      case 7: // D
        dy = Math.sin(localU * Math.PI) * 3.5;
        slope = (localU - 0.5) * 0.14;
        break;
    }

    return { y: capTop + dy, slope };
  };

  const GRAVITY = 1350;
  const RESTITUTION_FLOOR = 0.24; // Solid wooden/plastic block bounce
  const RESTITUTION_STICKER = 0.30;
  const FRICTION_FLOOR = 0.78;

  let physicsRunning = false;
  let lastTime = 0;

  const wakePhysics = () => {
    if (!physicsRunning) {
      physicsRunning = true;
      lastTime = performance.now();
      requestAnimationFrame(physicsStep);
    }
  };

  const applyStyle = (s) => {
    const px = Math.abs(s.x) < 0.05 ? '0px' : (Number.isInteger(s.x) ? `${s.x}px` : `${s.x.toFixed(1)}px`);
    const py = Math.abs(s.y) < 0.05 ? '0px' : (Number.isInteger(s.y) ? `${s.y}px` : `${s.y.toFixed(1)}px`);
    s.el.style.setProperty('--drag-x', px);
    s.el.style.setProperty('--drag-y', py);
    s.el.style.setProperty('--tilt', `${s.tilt.toFixed(1)}deg`);
  };

  const resolveStickerCollisions = () => {
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < stickers.length; i++) {
        for (let j = i + 1; j < stickers.length; j++) {
          const A = stickers[i];
          const B = stickers[j];
          const ax = A.baseCx + A.x;
          const ay = A.baseCy + A.y;
          const bx = B.baseCx + B.x;
          const by = B.baseCy + B.y;

          let dx = bx - ax;
          let dy = by - ay;
          if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) { dx = (j - i); dy = 1; }

          const rx = A.hw + B.hw;
          const ry = A.hh + B.hh;
          const nx = dx / rx;
          const ny = dy / ry;
          const distSq = nx * nx + ny * ny;

          if (distSq < 1.0) {
            const dist = Math.sqrt(distSq) || 0.001;
            const overlap = (1.0 - dist) * 0.5;
            const sepX = (nx / dist) * rx * overlap;
            const sepY = (ny / dist) * ry * overlap;

            // Positional separation
            if (A.isDragging) {
              B.x += sepX * 2;
              B.y += sepY * 2;
              B.resting = false;
            } else if (B.isDragging) {
              A.x -= sepX * 2;
              A.y -= sepY * 2;
              A.resting = false;
            } else {
              A.x -= sepX;
              A.y -= sepY;
              B.x += sepX;
              B.y += sepY;
              A.resting = false;
              B.resting = false;
            }

            // Impulse exchange
            const normX = dx / Math.hypot(dx, dy);
            const normY = dy / Math.hypot(dx, dy);
            const relVel = (A.vx - B.vx) * normX + (A.vy - B.vy) * normY;

            if (relVel > 0) {
              const impulse = (1 + RESTITUTION_STICKER) * relVel * 0.5;
              if (!A.isDragging) {
                A.vx -= impulse * normX;
                A.vy -= impulse * normY;
                A.vRot -= impulse * 0.15;
              }
              if (!B.isDragging) {
                B.vx += impulse * normX;
                B.vy += impulse * normY;
                B.vRot += impulse * 0.15;
              }
            }
          }
        }
      }
    }
  };

  const physicsStep = (now) => {
    if (!physicsRunning) return;
    const dt = Math.min((now - lastTime) / 1000, 0.035);
    lastTime = now;

    if (!isDesktop()) {
      // Mobile: keep in resting flow
      physicsRunning = false;
      return;
    }

    let allSleeping = true;

    stickers.forEach(s => {
      if (s.isDragging) {
        allSleeping = false;
        return;
      }

      // Apply gravity
      s.vy += GRAVITY * dt;
      s.vx *= Math.pow(0.96, dt * 60);
      s.vy *= Math.pow(0.98, dt * 60);
      s.vRot *= Math.pow(0.92, dt * 60);

      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.tilt += s.vRot * dt;

      // Letter terrain floor collision
      const curX = s.baseCx + s.x;
      const curY = s.baseCy + s.y;
      const terrain = getLetterFloor(curX);
      const bottomY = curY + s.hh;

      if (bottomY >= terrain.y) {
        // Rest on top of letter
        s.y = (terrain.y - s.hh) - s.baseCy;

        // Block-like thud bounce
        if (s.vy > 0) {
          if (s.vy > 60) {
            s.vy = -s.vy * RESTITUTION_FLOOR;
          } else {
            s.vy = 0;
            s.resting = true;
          }
          s.vx *= FRICTION_FLOOR;
          if (Math.abs(s.vx) < 1.0) s.vx = 0;

          // Align tilt with letter terrain slope
          const targetTilt = Math.atan2(terrain.slope, 1) * (180 / Math.PI) * 0.7;
          s.tilt += (targetTilt - s.tilt) * 0.3;
          s.vRot *= 0.5;
        }
      } else {
        s.resting = false;
      }

      // Horizontal boundary restraint
      const field = document.querySelector('.sticker-field');
      const maxDistX = field ? field.offsetWidth * 0.48 : 300;
      if (s.x < -maxDistX) { s.x = -maxDistX; s.vx = Math.abs(s.vx) * 0.3; }
      if (s.x > maxDistX) { s.x = maxDistX; s.vx = -Math.abs(s.vx) * 0.3; }

      // Sleep test
      if (Math.abs(s.vx) > 0.6 || Math.abs(s.vy) > 0.6 || Math.abs(s.vRot) > 0.8 || !s.resting) {
        allSleeping = false;
      }
    });

    resolveStickerCollisions();
    stickers.forEach(applyStyle);

    if (allSleeping) {
      physicsRunning = false;
    } else {
      requestAnimationFrame(physicsStep);
    }
  };

  // Initial Drop Entrance: start suspended in air, then drop onto "MUHAMMAD"
  if (isDesktop() && !calmMotion) {
    stickers.forEach((s, i) => {
      s.x = 0;
      s.y = -90 - (i % 3) * 35 - Math.random() * 15; // Suspended above
      s.vx = 0;
      s.vy = 25 + Math.random() * 35;
      s.tilt = (Math.random() - 0.5) * 12;
      s.vRot = (Math.random() - 0.5) * 18;
      applyStyle(s);
    });
    wakePhysics();
  }

  // Pointer Drag & Velocity Throwing
  stickers.forEach(s => {
    let pointerId = null;
    let startClient = { x: 0, y: 0 };
    let startOrigin = { x: 0, y: 0 };
    let lastTrackTime = 0;
    let lastTrackPos = { x: 0, y: 0 };

    s.el.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      updateBases();
      pointerId = event.pointerId;
      startClient = { x: event.clientX, y: event.clientY };
      startOrigin = { x: s.x, y: s.y };
      lastTrackPos = { x: event.clientX, y: event.clientY };
      lastTrackTime = performance.now();
      s.isDragging = true;
      s.resting = false;
      s.vx = 0;
      s.vy = 0;
      s.vRot = 0;
      s.el.setPointerCapture(pointerId);
      s.el.classList.add('is-dragging');
      wakePhysics();
    });

    s.el.addEventListener('pointermove', event => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastTrackTime) / 1000);

      s.x = startOrigin.x + (event.clientX - startClient.x);
      s.y = startOrigin.y + (event.clientY - startClient.y);

      // Track instantaneous toss velocity
      s.vx = (event.clientX - lastTrackPos.x) / dt;
      s.vy = (event.clientY - lastTrackPos.y) / dt;

      lastTrackPos = { x: event.clientX, y: event.clientY };
      lastTrackTime = now;

      applyStyle(s);
      resolveStickerCollisions();
    });

    const releasePointer = event => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      pointerId = null;
      s.isDragging = false;
      s.el.classList.remove('is-dragging');

      // Cap throw velocity so items don't fly offscreen
      s.vx = clamp(s.vx, -700, 700);
      s.vy = clamp(s.vy, -600, 600);
      s.vRot = clamp(s.vx * 0.18, -45, 45);

      wakePhysics();
    };

    s.el.addEventListener('pointerup', releasePointer);
    s.el.addEventListener('pointercancel', releasePointer);

    // Keyboard accessibility & Home reset
    s.el.addEventListener('keydown', event => {
      const dirs = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
      if (event.key === 'Home') {
        event.preventDefault();
        stickers.forEach(st => {
          st.x = 0;
          st.y = 0;
          st.vx = 0;
          st.vy = 0;
          st.tilt = 0;
          st.vRot = 0;
          st.resting = true;
          st.el.style.setProperty('--drag-x', '0px');
          st.el.style.setProperty('--drag-y', '0px');
          st.el.style.removeProperty('--tilt');
        });
        physicsRunning = false;
        return;
      }

      const [dx, dy] = dirs[event.key] ?? [];
      if (dx === undefined) return;
      event.preventDefault();
      updateBases();
      s.x += dx;
      s.y += dy;
      s.vx = 0;
      s.vy = 0;
      s.vRot = 0;
      s.resting = true;
      applyStyle(s);
      resolveStickerCollisions();
    });
  });

  window.addEventListener('resize', () => {
    updateBases();
    if (isDesktop()) {
      wakePhysics();
    }
  });
}

// Interactive Expressive Mascot Loop
const mascotEnv = document.querySelector('.mascot-environment');
const mascotToggleBtn = document.querySelector('.mascot-toggle');
const petEls = document.querySelectorAll('.walking-mascot');

let mascotPaused = motionPreference.matches;

const updateMascotToggle = () => {
  mascotDock?.classList.toggle('is-paused', mascotPaused);
  mascotDock?.classList.toggle('is-reduced', motionPreference.matches);
  if (mascotToggleBtn) {
    mascotToggleBtn.setAttribute('aria-pressed', String(mascotPaused));
    mascotToggleBtn.setAttribute('aria-label', `${mascotPaused ? 'Lanjutkan' : 'Jeda'} maskot`);
    mascotToggleBtn.textContent = mascotPaused ? 'Jalankan' : 'Jeda';
  }
  petEls.forEach(p => p.classList.toggle('is-paused', mascotPaused));
};
updateMascotToggle();

mascotToggleBtn?.addEventListener('click', () => {
  mascotPaused = !mascotPaused;
  updateMascotToggle();
});

motionPreference.addEventListener('change', event => {
  if (event.matches) mascotPaused = true;
  updateMascotToggle();
});

if (petEls.length === 2 && mascotEnv) {
  // Timers are seconds and speeds are px/second. Distinct personality speeds
  // and independent decision clocks stop the cast from walking or speaking in lockstep.
  const WALK_SPEED = 64;
  const SCARED_SPEED = 158;
  const START_GAP = 18;
  const TOUCH_GAP = 32;
  const SCARED_FOR = 1.15;
  const SPEECH_MS = 2500;
  const REACT_GAP = 0.5;

  const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // Call-and-response dialogues: Pet 1 leads, Pet 2 replies with organic continuity.
  const conversations = [
    {
      lead: ['Salam! 👋', 'Nice to meet you ✨', 'Yuk intip proyek 🚀', 'Halo developer! 💻'],
      reply: ['Hai, santai dulu ☕', 'Keren nih websitenya!', 'Lanjut scroll ya ✨', 'Siap eksplorasi! 🚀']
    },
    {
      lead: ['Cek CV-ku di atas 📄', 'Frontend-nya rapi ya ✨', 'Kode rapi, hati tenang 🧘', 'TypeScript mantap ⚡'],
      reply: ['Udah tak baca barusan! 👍', 'Animasi-nya mulus juga 🎯', 'Setuju banget! 💯', 'Full-stack ready! 🔥']
    },
    {
      lead: ['Ngantuk nih zZ 😴', 'Haus, butuh kopi ☕', 'Capek jalan terus 🐾'],
      reply: ['Istirahat dulu bentar~', 'Sama nih, rehat dulu', 'Semangat, bentar lagi! 💪']
    }
  ];

  const standaloneLines = {
    touch: [
      ['Eh, halo! 👋', 'Woy, kaget 😄', 'Hai, mampir ya? 👀', 'Sapa dong 😊', 'Iya, aku di sini!', 'Awas geli 😆'],
      ['Halo juga 😄', 'Jangan diusik zZ', 'Kenapa, bos? 😴', 'Ih, kaget aku!', 'Hmm, ada apa? 👀']
    ],
    cheer: [
      ['Halo juga! 🎉', 'Asyik! 🥳', 'Yeay, disapa! ✨', 'Semangat! 💪'],
      ['Hehe, halo 😄', 'Akhirnya diklik 🎉', 'Kaget tapi senang!', 'Makasih banyak! 😊']
    ],
    bump: [
      ['Permisi~ 👋', 'Eh, maaf ya 😅', 'Halo sobat ✨', 'Ups, tabrakan! 😆'],
      ['Aduh, kenapa? 😴', 'Minggir dulu ya~', 'Hai, lewat dulu! 👋', 'Sori-sori! 😅']
    ]
  };

  let globalSpeaker = null;
  let conversationChainTimer = 0;

  const pets = Array.from(petEls).map((el, index) => ({
    el,
    bubble: el.querySelector('.speech-bubble'),
    orbitIcon: el.querySelector('.orbit-icon'),
    voice: el.dataset.pet === '2' ? 1 : 0,
    w: 0,
    h: 0,
    x: 0,
    vx: 0,
    dir: index === 0 ? 1 : -1,
    // Personality: Pet 1 is an active explorer; Pet 2 is calmer and slightly slower.
    baseSpeed: index === 0 ? WALK_SPEED : WALK_SPEED * 0.9,
    state: 'IDLE',
    mood: 'idle',
    // Stagger initial thinking clocks so they never cycle at the same instant.
    timer: index === 0 ? 0.8 : 2.2,
    fear: 0,
    react: 0,
    said: [],
    queued: null,
    touched: false,
    speechHandle: 0,
    placed: false,
    // Pupil tracking interpolation
    targetPupilX: 0,
    targetPupilY: 0,
    curPupilX: 0,
    curPupilY: 0
  }));

  const speakSingle = (p, pool) => {
    const options = pool[p.voice] || pool[0];
    const fresh = options.filter(line => !p.said.includes(line));
    const chosen = fresh.length ? pick(fresh) : pick(options);
    p.said = [chosen, ...p.said].slice(0, Math.min(2, Math.max(0, options.length - 1)));
    return chosen;
  };

  let mouseX = -1000;
  let mouseY = -1000;
  let isMouseActive = false;
  let floorY = 0;
  let bumpCooldown = 0;
  let viewportWidth = window.innerWidth;
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;

  const measure = () => {
    floorY = mascotEnv.getBoundingClientRect().bottom;
    pets.forEach(p => {
      p.w = p.el.offsetWidth || (p.el.dataset.pet === '2' ? 72 : 86);
      p.h = p.el.offsetHeight || (p.el.dataset.pet === '2' ? 59 : 70);
    });
  };

  const keepInside = () => {
    pets.forEach((p, index) => {
      const reach = Math.max(0, viewportWidth - p.w);
      if (!p.placed) {
        p.x = reach * (index === 0 ? 0.22 : 0.78);
        p.placed = true;
      }
      p.x = clamp(p.x, 0, reach);
    });
  };

  const paint = () => {
    pets.forEach(p => {
      const facing = p.dir > 0 ? -1 : 1;
      p.el.style.left = `${p.x.toFixed(2)}px`;
      p.el.style.transform = `scaleX(${facing})`;
      p.el.style.setProperty('--facing', facing);

      // Smooth pupil interpolation following cursor
      if (isMouseActive) {
        const cx = p.x + p.w / 2;
        const cy = floorY - p.h * 0.72;
        const dx = clamp((mouseX - cx) / 140, -1, 1) * 3.5;
        const dy = clamp((mouseY - cy) / 140, -1, 1) * 3;
        p.targetPupilX = dx * facing * -1;
        p.targetPupilY = dy;
      } else {
        p.targetPupilX = 0;
        p.targetPupilY = scrollVelocity !== 0 ? clamp(scrollVelocity * -0.5, -2.5, 2.5) : 0;
      }

      p.curPupilX += (p.targetPupilX - p.curPupilX) * 0.25;
      p.curPupilY += (p.targetPupilY - p.curPupilY) * 0.25;

      p.el.style.setProperty('--pupil-x', `${p.curPupilX.toFixed(2)}px`);
      p.el.style.setProperty('--pupil-y', `${p.curPupilY.toFixed(2)}px`);
    });
  };

  const sayText = (p, text, mood) => {
    if (mascotPaused || !p.bubble) return false;
    if (p.react > 0 || globalSpeaker !== null) return false;

    globalSpeaker = p;
    p.react = SPEECH_MS / 1000 + REACT_GAP;
    p.bubble.textContent = text;
    p.el.classList.add('has-speech');
    setMood(p, mood);

    window.clearTimeout(p.speechHandle);
    p.speechHandle = window.setTimeout(() => {
      p.el.classList.remove('has-speech');
      p.el.classList.remove('is-jumping');
      setMood(p, p.state === 'SCARED' ? 'alarmed' : 'idle');
      globalSpeaker = null;

      if (p.queued) {
        const next = p.queued;
        p.queued = null;
        say(p, next.pool, next.mood);
      }
    }, SPEECH_MS);
    return true;
  };

  const say = (p, pool, mood) => {
    if (mascotPaused || !p.bubble) return false;
    if (p.react > 0 || globalSpeaker !== null) return false;
    return sayText(p, speakSingle(p, pool), mood);
  };

  // Organic conversational call-and-response between the pair
  const triggerConversation = (initiatorIndex = 0) => {
    if (mascotPaused || globalSpeaker !== null) return;
    const speaker = pets[initiatorIndex];
    const listener = pets[initiatorIndex === 0 ? 1 : 0];
    if (speaker.react > 0 || listener.react > 0) return;

    const topic = pick(conversations);
    const leadText = pick(topic.lead);
    const replyText = pick(topic.reply);

    if (sayText(speaker, leadText, 'happy')) {
      // Listener acknowledges by pausing and looking towards speaker
      listener.dir = speaker.x > listener.x ? 1 : -1;
      listener.state = 'IDLE';
      listener.vx = 0;
      setMood(listener, 'curious');

      window.clearTimeout(conversationChainTimer);
      conversationChainTimer = window.setTimeout(() => {
        if (!mascotPaused && listener.state !== 'SCARED') {
          sayText(listener, replyText, 'happy');
        }
      }, SPEECH_MS + 600);
    }
  };

  const moodGlyphs = {
    happy: ['</>', '{ }', '\u2726', '#'],
    alarmed: ['!', '\u26A0', '!?', '\u203C'],
    sleepy: ['zZ', '\u263E', '~', '. . .'],
    curious: ['?', '👀', '\u2726', '🔍'],
    excited: ['⚡', '🎉', '</>', '✨'],
    idle: ['</>', '{ }', '#', '\u25CB']
  };

  const setMood = (p, mood) => {
    if (p.mood === mood) return;
    p.mood = mood;
    p.el.dataset.mood = mood;
    if (p.orbitIcon) p.orbitIcon.textContent = pick(moodGlyphs[mood] || moodGlyphs.idle);
  };

  const walk = (p, seconds) => {
    p.state = 'WALK';
    p.timer = seconds;
    p.vx = p.dir * p.baseSpeed;
    if (p.mood !== 'alarmed') setMood(p, 'idle');
  };

  const pauseLook = (p, seconds) => {
    p.state = 'PAUSE_LOOK';
    p.timer = seconds;
    p.vx = 0;
    setMood(p, 'curious');
  };

  const startle = (p, pool, reverse = false) => {
    p.state = 'SCARED';
    p.timer = SCARED_FOR;
    p.fear = SCARED_FOR;
    p.dir = reverse ? (p.dir > 0 ? -1 : 1) : ((p.x + p.w / 2) > mouseX ? 1 : -1);
    p.vx = p.dir * SCARED_SPEED;
    const isCheer = pool === standaloneLines.cheer;
    const mood = isCheer ? 'excited' : 'alarmed';
    setMood(p, mood);
    if (!say(p, pool, mood)) p.queued = { pool, mood };
  };

  const pointerGap = (p, px, py) => {
    const dx = Math.max(p.x - px, 0, px - (p.x + p.w));
    const dy = Math.max((floorY - p.h) - py, 0, py - floorY);
    return Math.hypot(dx, dy);
  };

  const resolveBump = () => {
    const [a, b] = pets;
    const [near, far] = a.x <= b.x ? [a, b] : [b, a];
    if (near.x + near.w + START_GAP <= far.x) return;

    const span = near.w + START_GAP + far.w;
    const middle = (near.x + near.w / 2 + far.x + far.w / 2) / 2;
    const left = clamp(middle - span / 2, 0, Math.max(0, viewportWidth - span));
    near.x = left;
    far.x = left + near.w + START_GAP;

    const closing = near.dir > 0 && far.dir < 0;
    if (closing) {
      near.dir = -1;
      far.dir = 1;
      walk(near, 1.8 + Math.random() * 2);
      walk(far, 1.8 + Math.random() * 2);
    } else if (near.dir > 0 && far.dir > 0) {
      near.dir = -1;
      walk(near, 1.5 + Math.random());
    } else if (near.dir < 0 && far.dir < 0) {
      far.dir = 1;
      walk(far, 1.5 + Math.random());
    } else if (near.state === 'IDLE' && far.dir < 0) {
      far.dir = 1;
      walk(far, 1.5 + Math.random());
    } else if (far.state === 'IDLE' && near.dir > 0) {
      near.dir = -1;
      walk(near, 1.5 + Math.random());
    }

    if (bumpCooldown <= 0) {
      bumpCooldown = 3.5;
      say(Math.random() < 0.5 ? near : far, standaloneLines.bump, 'happy');
    }
  };

  let scrollDecayTimer = 0;
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    scrollVelocity = (currentY - lastScrollY) * 0.12;
    lastScrollY = currentY;
    window.clearTimeout(scrollDecayTimer);
    scrollDecayTimer = window.setTimeout(() => { scrollVelocity = 0; }, 100);
  }, { passive: true });

  const update = dt => {
    bumpCooldown = Math.max(0, bumpCooldown - dt);

    pets.forEach((p, idx) => {
      p.fear = Math.max(0, p.fear - dt);
      p.react = Math.max(0, p.react - dt);
      p.timer -= dt;

      if (p.timer <= 0) {
        if (p.state === 'IDLE') {
          // 40% chance to look around before continuing walk
          if (Math.random() < 0.4) {
            pauseLook(p, 1.2 + Math.random() * 1.5);
          } else {
            if (Math.random() > 0.35) p.dir *= -1;
            walk(p, p.voice === 0 ? (3 + Math.random() * 4) : (2 + Math.random() * 3));
          }
        } else if (p.state === 'PAUSE_LOOK') {
          // Finished looking around, now step forward
          if (Math.random() > 0.45) p.dir *= -1;
          walk(p, 2.5 + Math.random() * 3.5);
        } else {
          // Finished walking: enter rest or snooze
          p.state = 'IDLE';
          p.vx = 0;

          // Pet 2 occasionally snoozes; Pet 1 starts a friendly conversation
          if (p.voice === 1 && Math.random() < 0.3) {
            p.timer = 3.5 + Math.random() * 3;
            setMood(p, 'sleepy');
          } else {
            p.timer = p.voice === 0 ? (2 + Math.random() * 2.5) : (3 + Math.random() * 3);
            setMood(p, 'idle');
            // Trigger conversation occasionally when calm
            if (globalSpeaker === null && Math.random() < 0.4) {
              triggerConversation(idx);
            }
          }
        }
      }

      // Proximity panic
      const withinReach = isMouseActive && pointerGap(p, mouseX, mouseY) <= TOUCH_GAP;
      if (withinReach && !p.touched && p.fear <= 0 && p.state !== 'SCARED') {
        startle(p, standaloneLines.touch);
      }
      p.touched = withinReach;

      // Curious gaze when cursor is in vicinity
      const curiousReach = isMouseActive && !withinReach && pointerGap(p, mouseX, mouseY) <= TOUCH_GAP * 3.5;
      if (curiousReach && p.state !== 'SCARED' && (p.mood === 'idle' || p.mood === 'sleepy')) {
        setMood(p, 'curious');
      } else if (!curiousReach && p.mood === 'curious' && p.state !== 'PAUSE_LOOK') {
        setMood(p, 'idle');
      }

      p.x += p.vx * dt;

      if (p.x <= 0) {
        p.x = 0;
        p.dir = 1;
        p.vx = p.state === 'IDLE' ? 0 : Math.abs(p.vx);
      } else if (p.x >= viewportWidth - p.w) {
        p.x = Math.max(0, viewportWidth - p.w);
        p.dir = -1;
        p.vx = p.state === 'IDLE' ? 0 : -Math.abs(p.vx);
      }

      p.el.classList.toggle('is-scared', p.state === 'SCARED');
      p.el.classList.toggle('is-running', Math.abs(p.vx) > WALK_SPEED * 1.5);
    });

    resolveBump();
    paint();
  };

  window.addEventListener('pointermove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    isMouseActive = true;
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', event => {
    if (!event.relatedTarget) isMouseActive = false;
  });
  window.addEventListener('blur', () => { isMouseActive = false; });

  pets.forEach(p => {
    p.el.addEventListener('pointerenter', () => {
      if (isMouseActive && p.state !== 'SCARED') startle(p, standaloneLines.touch);
    });
    p.el.addEventListener('focus', () => {
      if (p.fear <= 0) startle(p, standaloneLines.cheer, true);
    });
    p.el.addEventListener('click', () => {
      p.fear = 0;
      startle(p, standaloneLines.cheer, true);
    });
  });

  window.addEventListener('resize', () => {
    const ratio = viewportWidth ? window.innerWidth / viewportWidth : 1;
    viewportWidth = window.innerWidth;
    measure();
    pets.forEach(p => { p.x *= ratio; });
    keepInside();
    resolveBump();
    paint();
  });

  let lastAt = 0;
  const loop = now => {
    const dt = lastAt ? Math.min((now - lastAt) / 1000, 0.05) : 0;
    lastAt = now;
    if (!mascotPaused) update(dt);
    requestAnimationFrame(loop);
  };

  measure();
  keepInside();
  pets.forEach(p => setMood(p, 'idle'));
  paint();
  requestAnimationFrame(loop);
}

// Case Studies Data & Modal Logic
const CASE_STUDIES = {
  zadify: {
    kicker: 'WEB APP \u00B7 ARCHITECTURE',
    title: 'Zadify: Islamic Super-App Workspace',
    problem: 'Pengalaman belajar dan beribadah digital sering kali terfragmentasi di berbagai aplikasi terpisah (audio murottal, panduan fikih/lifestyle, dan kompas kiblat).',
    contribution: 'Merancang arsitektur web terpadu berbasis Next.js dan TypeScript, menghitung arah kiblat dari rumus great-circle terhadap koordinat Makkah, serta memakai Web Audio API untuk efek suara antarmuka.',
    architecture: 'Next.js 16, React 19, dan TypeScript dengan state Zustand serta dukungan PWA offline. Audio Murottal diputar lewat HTMLAudioElement, efek suara memakai Web Audio API, dan asisten AI dipanggil melalui route handler Next.js yang memanggil Gemini AI.',
    diagram: `
      <svg viewBox="0 0 540 120" class="arch-diagram" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="35" width="100" height="50" rx="8" class="node-box" />
        <text x="60" y="65" class="node-text">UI Layer (Next)</text>
        <path d="M 110 60 L 160 60" class="wire" marker-end="url(#arrow)" />
        <rect x="160" y="10" width="130" height="45" rx="8" class="node-box" />
        <text x="225" y="38" class="node-text">Murottal Audio</text>
        <rect x="160" y="65" width="130" height="45" rx="8" class="node-box" />
        <text x="225" y="93" class="node-text">Qibla Bearing</text>
        <path d="M 290 32 L 350 32" class="wire" marker-end="url(#arrow)" />
        <path d="M 290 87 L 350 87" class="wire" marker-end="url(#arrow)" />
        <rect x="350" y="35" width="160" height="50" rx="8" class="node-box active" />
        <text x="430" y="65" class="node-text">Gemini AI REST</text>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
          </marker>
        </defs>
      </svg>
    `,
    actions: `
      <a class="button button-primary" href="https://zadify.vercel.app" target="_blank" rel="noreferrer">Live Demo \u2197</a>
      <a class="button button-quiet" href="https://github.com/RahmannCH/Zadify" target="_blank" rel="noreferrer">GitHub Repo \u2197</a>
    `
  },
  codechrome: {
    kicker: 'BROWSER DASHBOARD \u00B7 UX',
    title: 'CodeChrome: Keyboard-First Interface',
    problem: 'Sebagian besar dashboard browser mengandalkan navigasi kursor mouse yang memperlambat alur kerja developer yang terbiasa dengan terminal/Vim.',
    contribution: 'Mengonsep dan membangun navigasi keyboard-first dengan feedback suara mechanical sintetis dan asisten AI yang merespons secara streaming.',
    architecture: 'React 19, TypeScript, dan Framer Motion. Efek suara keyboard disintesis dengan Web Audio Oscillator, sementara asisten AI dilayani route handler yang menulis respons secara streaming lewat ReadableStream.',
    diagram: `
      <svg viewBox="0 0 540 100" class="arch-diagram" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="25" width="120" height="50" rx="8" class="node-box" />
        <text x="70" y="55" class="node-text">Keydown Capture</text>
        <path d="M 130 50 L 190 50" class="wire" marker-end="url(#arrow)" />
        <rect x="190" y="25" width="140" height="50" rx="8" class="node-box" />
        <text x="260" y="55" class="node-text">Sound Synth / Osc</text>
        <path d="M 330 50 L 390 50" class="wire" marker-end="url(#arrow)" />
        <rect x="390" y="25" width="130" height="50" rx="8" class="node-box active" />
        <text x="455" y="55" class="node-text">UI Route Switch</text>
      </svg>
    `,
    actions: `
      <a class="button button-quiet" href="https://github.com/RahmannCH/CodeChrome" target="_blank" rel="noreferrer">GitHub Repo \u2197</a>
    `
  },
  gamefarm: {
    kicker: 'GAME ENGINE \u00B7 SIMULATION',
    title: 'Game Farm 2.0: Pure Canvas 2D Engine',
    problem: 'Membangun game simulasi interaktif di browser tanpa engine pihak ketiga, sehingga game loop, rendering, dan penyimpanan state tetap dikontrol penuh.',
    contribution: 'Menulis game simulasi 2D dari nol dengan JavaScript dan Canvas 2D, mencakup game loop requestAnimationFrame dengan perhitungan delta-time, deteksi tabrakan berbasis bounding box, serta state inventaris dan siklus tanaman.',
    architecture: 'Game loop digerakkan requestAnimationFrame dan waktu delta dihitung lewat TimeManager. State disimpan sebagai JSON di localStorage, mulai dari slot simpan sampai preferensi volume audio.',
    diagram: `
      <svg viewBox="0 0 540 100" class="arch-diagram" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="25" width="110" height="50" rx="8" class="node-box" />
        <text x="65" y="55" class="node-text">rAF Game Loop</text>
        <path d="M 120 50 L 170 50" class="wire" marker-end="url(#arrow)" />
        <rect x="170" y="25" width="140" height="50" rx="8" class="node-box" />
        <text x="240" y="55" class="node-text">Grid Collision Math</text>
        <path d="M 310 50 L 360 50" class="wire" marker-end="url(#arrow)" />
        <rect x="360" y="25" width="150" height="50" rx="8" class="node-box active" />
        <text x="435" y="55" class="node-text">Canvas 2D Painter</text>
      </svg>
    `,
    actions: `
      <a class="button button-primary" href="https://game-farm-2-0.vercel.app" target="_blank" rel="noreferrer">Mainkan Game \u2197</a>
      <a class="button button-quiet" href="https://github.com/RahmannCH/Game-Farm-2.0" target="_blank" rel="noreferrer">GitHub Repo \u2197</a>
    `
  },
  virtualpet: {
    kicker: 'ACADEMIC \u00B7 FORMAL AUTOMATA',
    title: 'VirtualPet TeKom: 5-Tuple DFA Simulator',
    problem: 'Konsep teoritis Deterministic Finite Automaton (DFA) sering kali sulit dipahami jika hanya dipelajari dalam bentuk tabel transisi matematika abstrak.',
    contribution: 'Menerjemahkan model formal otomata 5-tupel (Q, \u03A3, \u03B4, q0, F) menjadi simulasi interaktif kehidupan mahasiswa, dengan state awal dipilih acak sekali sebelum seluruh aksi berikutnya berjalan deterministik.',
    architecture: 'State machine deterministik berbasis transisi ketat tanpa indeterminisme (NFA). State saat ini, alfabet masukan, dan fungsi transisi dipetakan ke alur visual UI responsif.',
    diagram: `
      <svg viewBox="0 0 540 100" class="arch-diagram" xmlns="http://www.w3.org/2000/svg">
        <circle cx="52" cy="50" r="30" class="node-circle" />
        <text x="52" y="54" class="node-text">NORMAL</text>
        <path d="M 82 50 L 158 50" class="wire" marker-end="url(#arrow)" />
        <text x="120" y="42" class="wire-label">feed</text>
        <circle cx="188" cy="50" r="30" class="node-circle" />
        <text x="188" y="54" class="node-text">HAPPY</text>
        <path d="M 218 50 L 294 50" class="wire" marker-end="url(#arrow)" />
        <text x="256" y="42" class="wire-label">play</text>
        <circle cx="324" cy="50" r="30" class="node-circle" />
        <text x="324" y="54" class="node-text">SICK</text>
        <path d="M 354 50 L 428 50" class="wire" marker-end="url(#arrow)" />
        <text x="391" y="42" class="wire-label">sleep</text>
        <circle cx="466" cy="50" r="32" class="node-circle final-outer" />
        <circle cx="466" cy="50" r="26" class="node-circle final-inner" />
        <text x="466" y="54" class="node-text">DEAD</text>
      </svg>
    `,
    actions: `
      <a class="button button-primary" href="https://virtual-pet-tekom.vercel.app" target="_blank" rel="noreferrer">Buka Simulator \u2197</a>
      <a class="button button-quiet" href="https://github.com/RahmannCH/VirtualPet_TeKom" target="_blank" rel="noreferrer">GitHub Repo \u2197</a>
    `
  }
};
const modal = document.getElementById('case-study-modal');
const closeBtn = modal?.querySelector('.modal-close');
const backdrop = modal?.querySelector('.modal-backdrop');
let lastFocusedElement = null;

function openCaseStudy(key) {
  const data = CASE_STUDIES[key];
  if (!data || !modal) return;
  
  lastFocusedElement = document.activeElement;
  
  document.getElementById('modal-kicker').textContent = data.kicker;
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-problem').textContent = data.problem;
  document.getElementById('modal-contribution').textContent = data.contribution;
  document.getElementById('modal-architecture').textContent = data.architecture;
  const diagramContainer = document.getElementById('modal-architecture-diagram');
  if (diagramContainer) {
    if (data.diagram) {
      diagramContainer.innerHTML = data.diagram;
      diagramContainer.style.display = 'block';
    } else {
      diagramContainer.style.display = 'none';
    }
  }
  document.getElementById('modal-actions').innerHTML = data.actions;
  
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }
  closeBtn?.focus();
}

function closeCaseStudy() {
  if (!modal) return;
  if (typeof modal.close === 'function') {
    modal.close();
  } else {
    modal.removeAttribute('open');
  }
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

document.querySelectorAll('.button-case-study').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-project');
    openCaseStudy(key);
  });
});

closeBtn?.addEventListener('click', closeCaseStudy);
backdrop?.addEventListener('click', closeCaseStudy);
modal?.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeCaseStudy();
});

document.querySelector('#current-year').textContent = new Date().getFullYear();

// SnapDOM integration for quick export
const snapBtn = document.getElementById('snap-btn');
const snapLabel = snapBtn?.querySelector('.snap-label');
if (snapBtn) {
  const snapOriginal = snapLabel?.textContent ?? '';
  const setSnapLabel = text => { if (snapLabel) snapLabel.textContent = text; };

  snapBtn.addEventListener('click', async () => {
    if (!window.snapdom) {
      setSnapLabel('Belum siap');
      setTimeout(() => setSnapLabel(snapOriginal), 2000);
      return;
    }
    try {
      snapBtn.disabled = true;
      setSnapLabel('Menyusun...');
      const captureResult = await window.snapdom(document.querySelector('#main'), {
        exclude: ['.mascot-dock', '.mascot-environment', '.project-image', '.all-projects', '.text-link', '.project-links'],
        backgroundColor: document.documentElement.dataset.theme === 'light' ? '#F6F8FA' : '#0B0D10'
      });
      await captureResult.download({ format: 'jpg', filename: 'MuhammadNurRahman_Portfolio' });
      setSnapLabel('Selesai');
    } catch (e) {
      setSnapLabel('Gagal');
    } finally {
      snapBtn.disabled = false;
      setTimeout(() => setSnapLabel(snapOriginal), 2000);
    }
  });
}

// Print / Save as PDF. The page is the CV: css/print.css turns it into a
// document, so there is no PDF file to host or go stale.
document.querySelectorAll('[data-print]').forEach(control => {
  control.addEventListener('click', () => window.print());
});

// Local time in WITA, the timezone of Banjarmasin. Rendered server-side as a
// fallback string so the row is never blank if Intl is unavailable.
const localTimeSlot = document.getElementById('local-time');
if (localTimeSlot) {
  const fallback = localTimeSlot.dataset.fallback || 'WITA';
  const paintLocalTime = () => {
    try {
      // hourCycle h23 rather than hour12:false, because the latter emits 24:xx
      // at midnight in some ICU builds and prints a dot separator under id-ID.
      localTimeSlot.textContent = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).format(new Date());
    } catch {
      localTimeSlot.textContent = fallback;
    }
  };
  paintLocalTime();
  setInterval(paintLocalTime, 30000);
}

// CLI Terminal Logic
const cliDrawer = document.getElementById('cli-drawer');
const cliClose = cliDrawer?.querySelector('.cli-close');
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');
const cliTrigger = document.getElementById('footer-cli-btn');

function toggleCli({ restoreFocus = false } = {}) {
  if (!cliDrawer) return;
  const isOpen = cliDrawer.classList.toggle('is-open');
  cliDrawer.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) {
    cliInput?.focus();
  } else if (restoreFocus) {
    cliTrigger?.focus();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cliDrawer?.classList.contains('is-open')) {
    toggleCli({ restoreFocus: true });
    return;
  }
  if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    toggleCli();
  }
});

cliClose?.addEventListener('click', () => toggleCli({ restoreFocus: true }));
cliTrigger?.addEventListener('click', () => toggleCli({ restoreFocus: true }));

const cliHistory = [];
let historyIndex = -1;
let currentDraft = '';

cliInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cliHistory.length === 0) return;
    if (historyIndex === -1) {
      currentDraft = cliInput.value;
      historyIndex = cliHistory.length - 1;
    } else if (historyIndex > 0) {
      historyIndex -= 1;
    }
    cliInput.value = cliHistory[historyIndex] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex === -1) return;
    if (historyIndex < cliHistory.length - 1) {
      historyIndex += 1;
      cliInput.value = cliHistory[historyIndex];
    } else {
      historyIndex = -1;
      cliInput.value = currentDraft;
    }
  } else if (e.key === 'Enter') {
    const rawCmd = cliInput.value.trim();
    const cmd = rawCmd.toLowerCase();
    cliInput.value = '';
    historyIndex = -1;
    currentDraft = '';
    if (!cmd) return;

    cliHistory.push(rawCmd);
    if (cliHistory.length > 50) cliHistory.shift();

    const pCmd = document.createElement('p');
    pCmd.className = 'cli-cmd';
    pCmd.textContent = `~ $ ${rawCmd}`;
    cliOutput.appendChild(pCmd);

    const pRes = document.createElement('p');
    const [action, ...args] = cmd.split(' ');

    switch (action) {
      case 'help':
        pRes.innerHTML = 'Perintah: <strong>whoami</strong>, <strong>projects</strong>, <strong>skills</strong>, <strong>theme [dark|light|toggle]</strong>, <strong>contact</strong>, <strong>print</strong>, <strong>pet</strong>, <strong>clear</strong>, <strong>exit</strong>';
        break;
      case 'whoami':
        pRes.textContent = 'Muhammad Nur Rahman — Mahasiswa S1 Ilmu Komputer ULM & Full-stack Developer.';
        break;
      case 'projects':
        pRes.innerHTML = '1. Zadify (Al-Quran Workspace & AI)<br>2. CodeChrome (Keyboard-first Browser Dashboard)<br>3. Game Farm 2.0 (Canvas 2D Engine)<br>4. VirtualPet TeKom (DFA Automata Simulator)';
        break;
      case 'skills':
      case 'capabilities':
        pRes.innerHTML = '• Web: TypeScript, JavaScript, React, Next.js, PHP, UI/UX<br>• Systems: Jaringan Komputer, Infrastruktur, Keamanan Siber<br>• Media: HTML5 Canvas, 3D Web, Web Audio, Desain Grafis';
        break;
      case 'theme': {
        const target = args[0];
        const current = document.documentElement.dataset.theme;
        const nextTheme = (target === 'light' || target === 'dark') ? target : (current === 'dark' ? 'light' : 'dark');
        document.documentElement.classList.add('theme-transition');
        document.documentElement.dataset.theme = nextTheme;
        updateThemeButton(nextTheme);
        try { localStorage.setItem('rahman-portfolio-theme', nextTheme); } catch (_) {}
        setTimeout(() => document.documentElement.classList.remove('theme-transition'), 250);
        pRes.textContent = `Tema website dialihkan ke: ${nextTheme}`;
        break;
      }
      case 'cv':
      case 'print':
        pRes.textContent = 'Membuka dialog cetak / simpan CV ke PDF...';
        setTimeout(() => window.print(), 250);
        break;
      case 'pet':
      case 'mascot': {
        const petEl = document.getElementById('pet-1');
        if (petEl) {
          petEl.click();
          pRes.textContent = 'Menyapa maskot! ✨';
        } else {
          pRes.textContent = 'Maskot sedang tidak aktif.';
        }
        break;
      }
      case 'contact':
        pRes.textContent = 'Email: Rahmannch19@gmail.com | GitHub: github.com/RahmannCH | Instagram: @mangch._';
        break;
      case 'clear':
        cliOutput.innerHTML = '';
        return;
      case 'exit':
        toggleCli();
        return;
      default:
        pRes.textContent = `Perintah tidak dikenal: ${cmd}. Ketik 'help' untuk panduan.`;
    }
    cliOutput.appendChild(pRes);
    const body = cliDrawer.querySelector('.cli-body');
    if (body) body.scrollTop = body.scrollHeight;
  }
});



// Stacked activity gallery. The deck is an ordered array of cards whose render
// slot is derived from its position, so one source of truth drives the stack, the
// counter, and the arrows.
document.querySelectorAll('[data-stack-gallery]').forEach(gallery => {
  const cards = Array.from(gallery.querySelectorAll('.stack-card'));
  const counterCurrent = gallery.querySelector('.stack-current');
  const prevButton = gallery.querySelector('[data-stack-prev]');
  const nextButton = gallery.querySelector('[data-stack-next]');
  if (cards.length < 2) return;

  const SWIPE_COMMIT = 60;
  const FLIP_MS = 300;
  const MAX_BACKLOG = 3;

  let order = cards.slice();
  let dragCard = null;
  let startX = 0;
  let travelled = 0;
  let backlog = 0;
  let timer = 0;

  // A card shows its photo when one exists and says so when it does not, so the
  // deck is usable before the real documentation photos exist.
  //
  // The intended path lives in data-photo, not src. A src pointing at a file that
  // is not on disk yet makes the browser log a failed request on every page load,
  // and a shipped page must not 404. Adding a photo is one step: drop the file at
  // the path, then move it from data-photo into src.
  const flagPhoto = card => {
    const image = card.querySelector('img');
    const source = image && (image.getAttribute('data-photo') || image.getAttribute('src'));
    if (!image || !source || !image.getAttribute('src')) {
      card.setAttribute('data-missing', 'true');
      return;
    }
    const settle = () => {
      const loaded = image.complete && image.naturalWidth > 0;
      card.setAttribute('data-missing', loaded ? 'false' : 'true');
    };
    image.addEventListener('load', settle);
    image.addEventListener('error', settle);
    settle();
  };
  cards.forEach(flagPhoto);

  const writeCounter = () => {
    if (!counterCurrent) return;
    const front = order[0].dataset.activity || '';
    const position = cards.findIndex(card => card.dataset.activity === front) + 1;
    counterCurrent.textContent = String(position || 1);
  };

  // Applies the resting layout for the current order. Only the front card is
  // exposed to assistive tech, otherwise one visible card would announce six
  // captions stacked on top of each other.
  const paint = () => {
    order.forEach((card, slot) => {
      card.dataset.slot = String(slot);
      card.style.removeProperty('--swipe-x');
      card.style.removeProperty('--swipe-rot');
      if (slot === 0) {
        card.removeAttribute('aria-hidden');
      } else {
        card.setAttribute('aria-hidden', 'true');
      }
    });
    writeCounter();
  };

  // Slides the front card out and promotes the next one.
  //
  // Forward: the front card leaves to the right and goes to the back of the deck.
  // Backward: the *last* card is the one that comes forward, and the card that
  // leaves is the one that was in front. Promoting `outgoing` on the way back
  // would put the departing card straight back in front, which is why the back
  // arrow used to do nothing visible.
  const flip = direction => {
    const leaving = direction > 0 ? order[0] : order[order.length - 1];
    const staying = direction > 0 ? order.slice(1) : order.slice(0, -1);

    // `staying` is already in the order it should render once the leaving card is
    // out of the way, so the waiting cards take their new slots immediately and
    // the incoming front card is in place underneath while the old one leaves.
    staying.forEach((card, slot) => {
      card.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${FLIP_MS}ms ease`;
      card.dataset.slot = String(slot);
      if (slot === 0) {
        card.removeAttribute('aria-hidden');
      } else {
        card.setAttribute('aria-hidden', 'true');
      }
    });

    leaving.setAttribute('aria-hidden', 'true');
    leaving.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${FLIP_MS}ms ease`;
    leaving.style.setProperty('--swipe-x', `${direction > 0 ? 340 : -340}px`);
    leaving.style.setProperty('--swipe-rot', `${direction > 0 ? 12 : -12}deg`);
    leaving.style.opacity = '0';

    // The offset is cleared only after the transition ends. Clearing it in the
    // same frame snapped the card back and the deck looked like it did nothing.
    timer = window.setTimeout(() => {
      timer = 0;
      order = direction > 0 ? [...staying, leaving] : [leaving, ...staying];
      order.forEach(card => {
        card.style.transition = '';
        card.style.opacity = '';
      });
      paint();

      if (backlog !== 0) {
        const next = backlog > 0 ? 1 : -1;
        backlog -= next;
        flip(next);
      }
    }, FLIP_MS);
  };

  const request = direction => {
    // Bounded so a held-down arrow cannot queue an unbounded backlog.
    backlog = Math.max(-MAX_BACKLOG, Math.min(MAX_BACKLOG, backlog + direction));
    if (!timer) {
      const next = backlog > 0 ? 1 : -1;
      backlog -= next;
      flip(next);
    }
  };

  const beginDrag = event => {
    // Only a gesture that starts on a card may drag the deck. Without this, a
    // press on the arrow buttons bubbled up here, captured the pointer, and the
    // button's own click was swallowed, so the arrows looked dead.
    if (timer || event.button !== 0) return;
    if (event.target.closest('.stack-toolbar')) return;
    dragCard = order[0];
    startX = event.clientX;
    travelled = 0;
    dragCard.style.transition = 'none';
    try { dragCard.setPointerCapture(event.pointerId); } catch (error) { /* capture unsupported */ }
  };

  const moveDrag = event => {
    if (!dragCard) return;
    travelled = event.clientX - startX;
    dragCard.style.setProperty('--swipe-x', `${travelled.toFixed(1)}px`);
    dragCard.style.setProperty('--swipe-rot', `${(travelled * 0.045).toFixed(2)}deg`);
  };

  const endDrag = () => {
    if (!dragCard) return;
    const card = dragCard;
    dragCard = null;
    card.style.transition = '';
    if (Math.abs(travelled) > SWIPE_COMMIT) {
      request(travelled > 0 ? 1 : -1);
      return;
    }
    card.style.removeProperty('--swipe-x');
    card.style.removeProperty('--swipe-rot');
  };

  gallery.addEventListener('pointerdown', beginDrag);
  gallery.addEventListener('pointermove', moveDrag);
  gallery.addEventListener('pointerup', endDrag);
  gallery.addEventListener('pointercancel', endDrag);
  gallery.addEventListener('lostpointercapture', endDrag);

  prevButton?.addEventListener('click', () => request(-1));
  nextButton?.addEventListener('click', () => request(1));

  // Left and right drive the deck from anywhere inside it, which also gives the
  // arrows a keyboard path through the same code the pointer uses.
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      request(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      request(1);
    }
  });

  paint();
});
const lanyardAnchor = document.getElementById('id-card-anchor');
const lanyardPivot = document.getElementById('id-card-pendulum');
const lanyardCard = document.querySelector('[data-physics-lanyard]');

if (lanyardAnchor && lanyardPivot && lanyardCard) {
  const lanyardRun = lanyardPivot.querySelector('.lanyard-run');
  const lanyardElastic = lanyardPivot.querySelector('.lanyard-elastic');
  const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Local geometry, in pixels, measured down from the top of the card box.
  const HOOK_Y = -300;
  const GRIP_Y = -55;
  const CARD_HALF = 187.5;
  const CORD_SPAN = GRIP_Y - HOOK_Y;
  const HANGING_LENGTH = CARD_HALF - HOOK_Y;

  const GRAVITY = 1800;
  const CORD_STIFFNESS = 200;
  const RADIAL_DAMPING = 6.5;
  const ANGULAR_DAMPING = 1.4;
  const MAX_STRETCH = 54;
  const MAX_COMPRESSION = 34;
  const ANGLE_LIMIT = 1.08;
  const ANGLE_SLEEP = 0.0015;
  const EDGE_GAP = 8;
  const STEP = 1 / 240;
  const MAX_ELAPSED = 0.05;
  const SWING_IMPULSE = 1.5;
  const STEPPED_ANGLE = 0.16;

  // The cord's unstretched length is shorter than the hanging distance by
  // exactly the amount gravity stretches it, so the card settles at the same
  // place the stylesheet draws it instead of sagging below the layout.
  const REST_LENGTH = HANGING_LENGTH - GRAVITY / CORD_STIFFNESS;
  const NEAREST_LENGTH = HANGING_LENGTH - MAX_COMPRESSION;
  const FARTHEST_LENGTH = HANGING_LENGTH + MAX_STRETCH;

  const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);
  const blend = (from, to, ratio) => from + (to - from) * ratio;

  let angle = 0;
  let angleRate = 0;
  let length = HANGING_LENGTH;
  let lengthRate = 0;

  let hookX = 0;
  let hookY = 0;
  let held = false;
  let pointerAt = 0;
  let clock = 0;
  let accumulator = 0;
  let frame = 0;

  const measureHook = () => {
    const rect = lanyardAnchor.getBoundingClientRect();
    hookX = rect.left + rect.width / 2;
    hookY = rect.top + HOOK_Y;
  };

  const reading = () => (calmMotion.matches
    ? { radial: RADIAL_DAMPING * 14, swing: ANGULAR_DAMPING * 14 }
    : { radial: RADIAL_DAMPING, swing: ANGULAR_DAMPING });

  // A card that swings wide must stay inside the sheet at every viewport, so
  // the cord is only allowed to reach as far as the bottom edge allows at that
  // angle. Never below HANGING_LENGTH, or the card would jump up out of its
  // own layout on a short screen before the user touched anything.
  const reachAt = angleNow => {
    const room = window.innerHeight - EDGE_GAP - CARD_HALF - hookY;
    const byScreen = room / Math.max(0.4, Math.cos(angleNow));
    return Math.min(FARTHEST_LENGTH, Math.max(HANGING_LENGTH, byScreen));
  };

  const readPointer = event => {
    const offsetX = event.clientX - hookX;
    const offsetY = Math.max(event.clientY - hookY, 1);
    const angleNow = clamp(Math.atan2(offsetX, offsetY), -ANGLE_LIMIT, ANGLE_LIMIT);
    const distance = Math.hypot(offsetX, offsetY);
    return { angle: angleNow, length: clamp(distance, NEAREST_LENGTH, reachAt(angleNow)) };
  };

  const render = () => {
    const drop = clamp(length - HANGING_LENGTH, -MAX_COMPRESSION, MAX_STRETCH);
    lanyardPivot.style.transform = `rotate(${-angle}rad)`;
    lanyardRun.style.transform = `rotate(${angle}rad)`;
    lanyardElastic.style.height = `${CORD_SPAN + drop}px`;
    lanyardElastic.style.setProperty('--stretch', (drop / MAX_STRETCH).toFixed(3));
    lanyardPivot.style.setProperty('--drop', `${drop.toFixed(2)}px`);
  };

  const settle = () => {
    angle = 0;
    angleRate = 0;
    length = HANGING_LENGTH;
    lengthRate = 0;
  };

  const resting = () => Math.abs(angle) < ANGLE_SLEEP
    && Math.abs(angleRate) < 0.0015
    && Math.abs(length - HANGING_LENGTH) < 0.2
    && Math.abs(lengthRate) < 1.2;

  // Spherical pendulum with an elastic cord, one mass unit so every constant is
  // a per-unit-mass rate. Two coupled degrees of freedom:
  //   r_ddot = r*theta_dot^2 + g*cos(theta) - k*(r - rest) - c_r*r_dot
  //   theta_ddot = -(g/r)*sin(theta) - c_t*theta_dot - 2*(r_dot/r)*theta_dot
  // The cross term is why a real lanyard feels rubbery: every radial snap-back
  // bleeds angular energy too, so the swing settles instead of ringing.
  // Angular damping is set so a full-limit fling decays over about ten seconds
  // with three visible swings, then sleeps instead of drifting for half a minute.
  const integrate = dt => {
    const stiffness = (length - REST_LENGTH) * CORD_STIFFNESS;
    const lengthAccel = length * angleRate * angleRate
      + GRAVITY * Math.cos(angle)
      - stiffness
      - RADIAL_DAMPING * lengthRate;
    const angleAccel = -(GRAVITY / length) * Math.sin(angle)
      - ANGULAR_DAMPING * angleRate
      - 2 * (lengthRate / length) * angleRate;

    lengthRate += lengthAccel * dt;
    angleRate += angleAccel * dt;
    length += lengthRate * dt;
    angle += angleRate * dt;

    if (length > FARTHEST_LENGTH) {
      length = FARTHEST_LENGTH;
      if (lengthRate > 0) lengthRate = 0;
    } else if (length < NEAREST_LENGTH) {
      length = NEAREST_LENGTH;
      if (lengthRate < 0) lengthRate = 0;
    }
    if (angle > ANGLE_LIMIT) {
      angle = ANGLE_LIMIT;
      if (angleRate > 0) angleRate = 0;
    } else if (angle < -ANGLE_LIMIT) {
      angle = -ANGLE_LIMIT;
      if (angleRate < 0) angleRate = 0;
    }
  };

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const wake = () => {
    if (frame) return;
    clock = performance.now();
    accumulator = 0;
    frame = requestAnimationFrame(advance);
  };

  function advance(now) {
    frame = requestAnimationFrame(advance);
    const elapsed = (now - clock) / 1000;
    clock = now;
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;

    measureHook();
    accumulator = Math.min(accumulator + elapsed, MAX_ELAPSED);
    while (accumulator >= STEP) {
      integrate(STEP);
      accumulator -= STEP;
    }

    if (!held && resting()) {
      settle();
      render();
      stop();
      return;
    }
    render();
  }

  lanyardCard.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    measureHook();
    held = true;
    angleRate = 0;
    lengthRate = 0;
    pointerAt = performance.now();
    lanyardCard.classList.add('is-held');
    try { lanyardCard.setPointerCapture(event.pointerId); } catch (error) { /* capture unsupported */ }
    wake();
  });

  lanyardCard.addEventListener('pointermove', event => {
    if (!held) return;
    measureHook();
    const target = readPointer(event);
    const now = performance.now();
    const dt = Math.max(0.008, (now - pointerAt) / 1000);
    pointerAt = now;
    angleRate = clamp(blend(angleRate, (target.angle - angle) / dt, 0.55), -6, 6);
    lengthRate = clamp(blend(lengthRate, (target.length - length) / dt, 0.55), -680, 980);
    angle = target.angle;
    length = target.length;
    render();
  });

  const letGo = event => {
    if (!held) return;
    held = false;
    lanyardCard.classList.remove('is-held');
    try { lanyardCard.releasePointerCapture(event.pointerId); } catch (error) { /* already released */ }
    wake();
  };

  lanyardCard.addEventListener('pointerup', letGo);
  lanyardCard.addEventListener('pointercancel', letGo);
  lanyardCard.addEventListener('lostpointercapture', letGo);

  lanyardCard.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let handled = true;

    switch (event.key) {
      case 'ArrowLeft':
        angle -= STEPPED_ANGLE;
        angleRate = -0.25;
        break;
      case 'ArrowRight':
        angle += STEPPED_ANGLE;
        angleRate = 0.25;
        break;
      case 'ArrowUp':
        length = Math.max(NEAREST_LENGTH, length - 24);
        lengthRate = -160;
        break;
      case 'ArrowDown':
        length = Math.min(FARTHEST_LENGTH, length + 14);
        lengthRate = 320;
        break;
      case 'Enter':
      case ' ':
        length = Math.max(NEAREST_LENGTH, length - 30);
        lengthRate = -240;
        break;
      case 'Home':
      case '0':
        settle();
        render();
        return void event.preventDefault();
      case 'Escape':
        angleRate = 0;
        lengthRate = 0;
        break;
      default:
        handled = false;
    }

    if (!handled) return;
    event.preventDefault();
    angle = clamp(angle, -ANGLE_LIMIT, ANGLE_LIMIT);
    length = clamp(length, NEAREST_LENGTH, reachAt(angle));
    if (calmMotion.matches) {
      render();
      return;
    }
    wake();
  });

  window.addEventListener('resize', () => {
    measureHook();
    wake();
  });

  calmMotion.addEventListener('change', () => {
    stop();
    settle();
    render();
  });

  measureHook();
  render();
}