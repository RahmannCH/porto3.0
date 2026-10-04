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

const dragItems = Array.from(document.querySelectorAll('[data-draggable]'));
if (dragItems.length > 0) {
  const stickers = dragItems.map(el => ({ el, x: 0, y: 0, flipX: 0, tilt: 0, baseCx: 0, baseCy: 0, hw: 0, hh: 0 }));

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
  window.addEventListener('resize', () => {
    updateBases();
    stickers.forEach(clampAndApply);
  });

  const getBounds = () => window.innerWidth > 720 ? { x: 260, yMin: -35, yMax: 50 } : { x: 100, yMin: -25, yMax: 40 };

  const clampAndApply = (s) => {
    const b = getBounds();
    s.x = Math.max(-b.x, Math.min(b.x, s.x));
    s.y = Math.max(b.yMin, Math.min(b.yMax, s.y));
    s.el.style.setProperty('--drag-x', `${s.x}px`);
    s.el.style.setProperty('--drag-y', `${s.y}px`);
    if (s.flipX) s.el.style.setProperty('--flip-x', `${s.flipX}deg`);
    if (s.tilt) s.el.style.setProperty('--tilt', `${s.tilt}deg`);
  };

  const resolveCollisions = (activeSticker) => {
    for (let iter = 0; iter < 4; iter++) {
      let hasCollision = false;
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

          const rx = A.hw + B.hw + 10;
          const ry = A.hh + B.hh + 10;
          const nx = dx / rx;
          const ny = dy / ry;
          const distSq = nx * nx + ny * ny;

          if (distSq < 1.0) {
            hasCollision = true;
            const dist = Math.sqrt(distSq);
            const overlap = 1.0 - dist;
            const sepX = (nx / dist) * rx * overlap;
            const sepY = (ny / dist) * ry * overlap;
            const impact = Math.hypot(sepX, sepY);

            if (A === activeSticker) {
              B.x += sepX;
              B.y += sepY;
              if (impact > 14) {
                B.flipX = (B.flipX || 0) + (Math.random() > 0.5 ? 180 : -180);
                B.tilt = (B.tilt || 0) + (sepX > 0 ? 15 : -15);
              }
              clampAndApply(B);
            } else if (B === activeSticker) {
              A.x -= sepX;
              A.y -= sepY;
              if (impact > 14) {
                A.flipX = (A.flipX || 0) + (Math.random() > 0.5 ? 180 : -180);
                A.tilt = (A.tilt || 0) + (sepX > 0 ? -15 : 15);
              }
              clampAndApply(A);
            } else {
              A.x -= sepX * 0.5;
              A.y -= sepY * 0.5;
              B.x += sepX * 0.5;
              B.y += sepY * 0.5;
              clampAndApply(A);
              clampAndApply(B);
            }
          }
        }
      }
      if (!hasCollision) break;
    }
  };

  stickers.forEach(s => {
    let pointer = null;
    let origin = { x: 0, y: 0 };

    s.el.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      updateBases();
      pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
      origin = { x: s.x, y: s.y };
      s.el.setPointerCapture(event.pointerId);
      s.el.classList.add('is-dragging');
    });

    s.el.addEventListener('pointermove', event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      s.x = origin.x + event.clientX - pointer.x;
      s.y = origin.y + event.clientY - pointer.y;
      clampAndApply(s);
      resolveCollisions(s);
    });

    const releasePointer = event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      pointer = null;
      s.el.classList.remove('is-dragging');
    };

    s.el.addEventListener('pointerup', releasePointer);
    s.el.addEventListener('pointercancel', releasePointer);

    s.el.addEventListener('keydown', event => {
      const dirs = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
      if (event.key === 'Home') {
        event.preventDefault();
        stickers.forEach(st => {
          st.x = 0; st.y = 0; st.flipX = 0; st.tilt = 0;
          st.el.style.removeProperty('--flip-x');
          st.el.style.removeProperty('--tilt');
          clampAndApply(st);
        });
        resolveCollisions(null);
        return;
      }
      const [dx, dy] = dirs[event.key] ?? [];
      if (dx === undefined) return;
      event.preventDefault();
      updateBases();
      s.x += dx;
      s.y += dy;
      clampAndApply(s);
      resolveCollisions(s);
    });
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
  // Timers are seconds and speeds are px/second, not frames and px/frame. The
  // old frame counters meant the whole cast walked, sprinted and finished
  // speaking 2.4 times faster on a 144Hz display than on a 60Hz one.
  const WALK_SPEED = 62;
  const SCARED_SPEED = 150;
  const START_GAP = 14;
  const TOUCH_GAP = 26;
  const SCARED_FOR = 1.1;
  // A message is on screen for SPEECH_MS, then the pet waits REACT_GAP before it
  // may speak again. Together they hold the pair to one bubble per three seconds,
  // so a line can never flicker in and out or repeat back to back.
  const SPEECH_MS = 2500;
  const REACT_GAP = 0.5;
  const GREET_CHANCE = 0.5;

  const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // Every line is two to four words so the pill stays one line on a phone and the
  // greeting never outlasts the walk that carries it. The first list is Rahman's
  // guide character, the second is the sleepy one, so the two read as separate
  // voices instead of one bot with two sprites.
  const lines = {
    greet: [
      ['Salam! \uD83D\uDE0A', 'Nice to meet you \u2728', 'Scroll ke bawah \uD83D\uDC47', 'Ada proyek seru \uD83D\uDE80', 'Cek CV-ku \uD83D\uDCC4'],
      ['Hai, santai dulu \u2615', 'Nonton dulu ya \uD83D\uDC40', 'Ngantuk nih zZ \uD83D\uDCA4', 'Klik aku dong \uD83C\uDF89']
    ],
    // The pointer hover is the most repeated interaction on the page, so it gets
    // the widest pool. A two-line pool is what made the same word appear over and
    // over while the cursor hovered.
    touch: [
      ['Eh, halo! \uD83D\uDC4B', 'Woy, kaget \uD83D\uDE04', 'Hai, mampir ya? \uD83D\uDC40', 'Sapa dong \uD83D\uDE0A', 'Iya, aku di sini!', 'Awas, geli \uD83D\uDE02'],
      ['Halo juga \uD83D\uDE04', 'Eh, jangan diusik zZ', 'Kenapa, bos? \uD83D\uDE34', 'Ih, kaget aku', 'Hmm, ada apa? \uD83D\uDC40']
    ],
    cheer: [
      ['Halo juga! \uD83C\uDF89', 'Asyik! \uD83D\uDE06', 'Yeay, disapa! \u2728', 'Semangat! \uD83D\uDCAA'],
      ['Hehe, halo \uD83D\uDE04', 'Akhirnya diklik \uD83C\uDF89', 'Kaget, tapi senang', 'Hmm, terima kasih \uD83D\uDE0A']
    ],
    bump: [
      ['Permisi~ \uD83D\uDC4B', 'Eh, maaf \uD83D\uDE05', 'Halo sobat \u2728', 'Ups, tabrakan \uD83D\uDE02'],
      ['Aduh, kenapa? \uD83D\uDE34', 'Minggir dulu ya', 'Hai, lewat \uD83D\uDC4B', 'Sori, sori \uD83D\uDE05']
    ]
  };

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
    baseSpeed: index === 0 ? WALK_SPEED : WALK_SPEED * 1.1,
    state: 'IDLE',
    mood: 'idle',
    timer: index === 0 ? 1 : 1.5,
    fear: 0,
    react: 0,
    // The last two lines this pet said, so a new line is never one the user has
    // just seen. This is what stops the same word repeating on every hover.
    said: [],
    queued: null,
    touched: false,
    speechHandle: 0,
    placed: false
  }));

  // Picks the next line for a pet, preferring one it has not just spoken. The last
  // two are excluded rather than only the previous one, because with a short pool
  // excluding a single line still produced A-B-A-B, which reads as a repeat.
  const speak = (p, pool) => {
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

  // offsetWidth and offsetHeight are the untransformed box, so measuring while a
  // pet is squashed by is-scared still reports the real collision size.
  const measure = () => {
    floorY = mascotEnv.getBoundingClientRect().bottom;
    pets.forEach(p => {
      p.w = p.el.offsetWidth || (p.el.dataset.pet === '2' ? 55 : 66);
      p.h = p.el.offsetHeight || (p.el.dataset.pet === '2' ? 45 : 54);
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

      // Pupils follow the cursor within a small radius. The offset is measured
      // from the pet's face centre, normalised to about three pixels, and mirrored
      // on the x axis because the body is flipped by scaleX.
      if (isMouseActive) {
        const cx = p.x + p.w / 2;
        const cy = floorY - p.h * 0.72;
        const dx = clamp((mouseX - cx) / 120, -1, 1) * 3;
        const dy = clamp((mouseY - cy) / 120, -1, 1) * 2.5;
        p.el.style.setProperty('--pupil-x', `${(dx * facing * -1).toFixed(2)}px`);
        p.el.style.setProperty('--pupil-y', `${dy.toFixed(2)}px`);
      } else {
        p.el.style.setProperty('--pupil-x', '0px');
        p.el.style.setProperty('--pupil-y', '0px');
      }
    });
  };

  // The single gate for every spoken line.
  //
  // `p.react` is armed for the whole life of a message and then for REACT_GAP
  // after it clears. Arming it only at the start left a dead window: the bubble
  // had gone but the pet was still counting down, so the next hover arrived the
  // instant it unlocked and drew the same line again. Holding the lock across
  // both phases means a new line can only begin once the previous one is finished
  // and a short pause has passed, which is what makes the text feel varied.
  const say = (p, pool, mood) => {
    if (mascotPaused || !p.bubble) return false;
    if (p.react > 0) return false;
    p.react = SPEECH_MS / 1000 + REACT_GAP;
    p.bubble.textContent = speak(p, pool);
    p.el.classList.add('has-speech');
    setMood(p, mood);
    window.clearTimeout(p.speechHandle);
    p.speechHandle = window.setTimeout(() => {
      p.el.classList.remove('has-speech');
      p.el.classList.remove('is-jumping');
      setMood(p, p.state === 'SCARED' ? 'alarmed' : 'idle');
      // A line still queued by the cooldown shows as soon as the pause is over.
      if (p.queued) {
        const next = p.queued;
        p.queued = null;
        say(p, next.pool, next.mood);
      }
    }, SPEECH_MS);
    return true;
  };

  // The face is the readable part of the reaction, so the mood is written as a
  // class and the eyes are drawn from CSS. The orbiting icon swaps its glyph with
  // the mood, so the pet carries a visible prop that changes, not just a face.
  const moodGlyphs = {
    happy: ['</>', '{ }', '\u2726', '#'],
    alarmed: ['!', '\u26A0', '!?', '\u203C'],
    sleepy: ['zZ', '\u263E', '~', '. . .'],
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

  // Panic is a moving state, not a freeze: the pet keeps travelling away from the
  // cursor while it yelps, so it never stands still mid-reaction. `reverse` flips
  // the hush away from a click or focus rather than from the pointer position.
  const startle = (p, pool, reverse = false) => {
    p.state = 'SCARED';
    p.timer = SCARED_FOR;
    p.fear = SCARED_FOR;
    p.dir = reverse ? (p.dir > 0 ? -1 : 1) : ((p.x + p.w / 2) > mouseX ? 1 : -1);
    p.vx = p.dir * SCARED_SPEED;
    // Cheer reactions (click/focus) are joyful, not panicked, so the mood is
    // excited. Proximity reactions are alarmed.
    const isCheer = pool === lines.cheer;
    const mood = isCheer ? 'excited' : 'alarmed';
    setMood(p, mood);
    if (!say(p, pool, mood)) p.queued = { pool, mood };
  };

  // Distance from the pointer to the nearest edge of the pet box, so touching a
  // paw counts as contact while standing two body-widths away does not.
  const pointerGap = (p, px, py) => {
    const dx = Math.max(p.x - px, 0, px - (p.x + p.w));
    const dy = Math.max((floorY - p.h) - py, 0, py - floorY);
    return Math.hypot(dx, dy);
  };

  // Idempotent by construction: both positions are recomputed from their shared
  // midpoint, so running it twice cannot push anyone further. The old version
  // subtracted a fixed 1px gap from a raw difference, which could walk off the
  // left edge; the wall clamp then snapped it back to zero, the next frame
  // collided again, and that loop is exactly the stutter that was reported.
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
      bumpCooldown = 3.0;
      say(Math.random() < 0.5 ? near : far, lines.bump, 'happy');
    }
  };

  const update = dt => {
    bumpCooldown = Math.max(0, bumpCooldown - dt);

    pets.forEach(p => {
      p.fear = Math.max(0, p.fear - dt);
      p.react = Math.max(0, p.react - dt);
      p.timer -= dt;

      if (p.timer <= 0) {
        if (p.state === 'IDLE') {
          if (Math.random() > 0.3) p.dir *= -1;
          walk(p, 3 + Math.random() * 5);
        } else {
          p.state = 'IDLE';
          p.timer = 2 + Math.random() * 3;
          p.vx = 0;
          setMood(p, 'idle');
          if (Math.random() < GREET_CHANCE) say(p, lines.greet, 'happy');
        }
      }

      // Proximity panic fires on the transition from "out of reach" to "in reach",
      // never on every frame. The old check re-triggered sixty times a second while
      // the cursor rested on a pet, which stamped the same line over and over and
      // is exactly the repetition that was reported.
      const withinReach = isMouseActive && pointerGap(p, mouseX, mouseY) <= TOUCH_GAP;
      if (withinReach && !p.touched && p.fear <= 0 && p.state !== 'SCARED') {
        startle(p, lines.touch);
      }
      p.touched = withinReach;

      // A middle distance reads as curiosity rather than alarm: the pet notices
      // the cursor and widens its eyes without breaking stride. It only applies
      // when no stronger mood (alarmed, happy) is already active.
      const curiousReach = isMouseActive && !withinReach && pointerGap(p, mouseX, mouseY) <= TOUCH_GAP * 3.2;
      if (curiousReach && p.state !== 'SCARED' && p.mood === 'idle') {
        setMood(p, 'curious');
      } else if (!curiousReach && p.mood === 'curious') {
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
      p.el.classList.toggle('is-running', Math.abs(p.vx) > WALK_SPEED * 1.6);
    });

    resolveBump();
    paint();
  };

  window.addEventListener('pointermove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    isMouseActive = true;
  }, { passive: true });

  // pointerleave on the root fires only when the pointer actually leaves the
  // document, which a null relatedTarget confirms. The old window mouseout also
  // fired while the cursor moved between elements, so isMouseActive flickered
  // off mid-gesture and the pair reacted inconsistently to the same pointer.
  document.documentElement.addEventListener('pointerleave', event => {
    if (!event.relatedTarget) isMouseActive = false;
  });
  window.addEventListener('blur', () => { isMouseActive = false; });

  pets.forEach(p => {
    // A deliberate click is the one action the user chose, so it may interrupt an
    // already-running greeting. Incidental hover and focus respect the gate.
    p.el.addEventListener('pointerenter', () => {
      if (isMouseActive && p.state !== 'SCARED') startle(p, lines.touch);
    });
    p.el.addEventListener('focus', () => {
      if (p.fear <= 0) startle(p, lines.cheer, true);
    });
    p.el.addEventListener('click', () => {
      p.fear = 0;
      // The click startles the pet (mood + direction) but the bubble respects
      // the three-second gate, so rapid clicks never flicker bubbles.
      startle(p, lines.cheer, true);
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

cliInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = cliInput.value.trim().toLowerCase();
    cliInput.value = '';
    if (!cmd) return;

    const pCmd = document.createElement('p');
    pCmd.className = 'cli-cmd';
    pCmd.textContent = `~ $ ${cmd}`;
    cliOutput.appendChild(pCmd);

    const pRes = document.createElement('p');
    switch (cmd) {
      case 'help':
        pRes.innerHTML = 'Perintah: <strong>whoami</strong>, <strong>projects</strong>, <strong>contact</strong>, <strong>clear</strong>, <strong>exit</strong>';
        break;
      case 'whoami':
        pRes.textContent = 'Muhammad Nur Rahman, Mahasiswa S1 Ilmu Komputer ULM & Full-stack Developer.';
        break;
      case 'projects':
        pRes.innerHTML = '1. Zadify (Al-Quran AI)<br>2. CodeChrome (Keyboard Dashboard)<br>3. Game Farm 2.0 (Canvas Engine)<br>4. VirtualPet TeKom (DFA Automata)';
        break;
      case 'contact':
        pRes.textContent = 'Email: Rahmannch19@gmail.com | GitHub: github.com/RahmannCH';
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