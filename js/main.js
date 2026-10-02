const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');
if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    mobileToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    });
  });
  addEventListener('resize', () => {
    if (innerWidth > 760) {
      navLinks.classList.remove('is-open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
const counters = document.querySelectorAll('.counter');
if (counters.length) {
  const run = el => {
    const target = Number(el.dataset.target || 0);
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 90));
    const tick = () => {
      cur = Math.min(target, cur + step);
      el.textContent = String(cur);
      if (cur < target) requestAnimationFrame(tick);
    };
    tick();
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => io.observe(c));
}
const tabs = document.querySelectorAll('[data-div]');
const cards = document.querySelectorAll('[data-division]');
if (tabs.length && cards.length) {
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const v = btn.dataset.div;
      cards.forEach(c => {
        c.style.display = v === 'semua' || c.dataset.division === v ? '' : 'none';
      });
    });
  });
}
const track = document.getElementById('carouselTrack');
const prev = document.getElementById('prevSlide');
const next = document.getElementById('nextSlide');
if (track && prev && next) {
  let index = 0;
  const gap = 16;
  const cardWidth = () => track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + gap : 0;
  const visible = () => {
    if (innerWidth <= 480) return 1;
    if (innerWidth <= 760) return 2;
    if (innerWidth <= 950) return 3;
    return 4;
  };
  const maxIndex = () => Math.max(0, track.children.length - visible());
  const render = () => {
    index = Math.min(index, maxIndex());
    index = Math.max(0, index);
    track.style.transform = `translateX(${-index * cardWidth()}px)`;
  };
  prev.addEventListener('click', () => { index -= 1; render(); });
  next.addEventListener('click', () => { index += 1; render(); });
  addEventListener('resize', render);
  render();
}
const form = document.getElementById('publicAspirasiForm');
const alertBox = document.getElementById('formSuccessAlert');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const target = document.getElementById('divisiTarget');
    const msg = document.getElementById('pesanInput');
    if (!target.value || !msg.value.trim()) return;
    const btn = form.querySelector('button[type="submit"]');
    const prevText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Mengirim...</span><i class="fas fa-spinner fa-spin"></i>';
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = prevText;
      if (alertBox) {
        alertBox.style.display = 'flex';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4200);
      }
    }, 900);
  });
}
