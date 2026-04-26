/* ============================================================
   HHH Enterprises — interactive scripts
   ============================================================ */

(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll-driven UI: header shadow, progress bar,
                back-to-top, hero parallax ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const heroEl = $('.hero');
  const heroBgs = $$('.hero__bg');

  const updateScroll = () => {
    const y = window.scrollY;

    // header
    header.classList.toggle('is-scrolled', y > 8);

    // progress bar
    if (progress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
      progress.style.width = pct + '%';
    }

    // back-to-top
    toTop?.classList.toggle('is-visible', y > 600);

    // hero parallax — only while hero is in view
    if (heroEl) {
      const heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
      if (y < heroBottom) {
        const offset = y * 0.35;
        heroBgs.forEach(bg => {
          bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
        });
      }
    }
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Mobile nav ---------- */
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  hamburger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    hamburger?.classList.remove('is-open');
    hamburger?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Hero slider ---------- */
  const slides = $$('.hero__slide');
  const dotsWrap = $('#heroDots');
  const prevBtn = $('.hero__arrow--prev');
  const nextBtn = $('.hero__arrow--next');
  let current = 0;
  let autoTimer;

  // Build dots
  if (dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }
  const dots = $$('.hero__dot');

  function goTo(i) {
    slides[current]?.classList.remove('is-active');
    dots[current]?.classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current]?.classList.add('is-active');
    dots[current]?.classList.add('is-active');
    // re-trigger reveal animation inside the active slide
    $$('.reveal', slides[current]).forEach(el => {
      el.classList.remove('is-visible');
      // force reflow
      void el.offsetWidth;
      el.classList.add('is-visible');
    });
    resetAuto();
  }
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);
  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 6500);
  }
  if (slides.length > 1) resetAuto();

  // Pause on hover (reuses heroEl declared in scroll-driven UI block)
  heroEl?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  heroEl?.addEventListener('mouseleave', resetAuto);

  // Keyboard arrows on hero
  heroEl?.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });
  heroEl?.setAttribute('tabindex', '0');

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal, .stagger');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Make sure first hero slide reveals immediately
  $$('.hero__slide.is-active .reveal').forEach(el => el.classList.add('is-visible'));

  /* ---------- Animated counters ---------- */
  const counters = $$('.stat__num');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(target * eased);
      el.textContent = value.toLocaleString('en-IN') + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Contact form ---------- */
  const form = $('#contactForm');
  const note = $('#formNote');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    note.classList.remove('is-success', 'is-error');

    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['name', 'phone', 'email', 'message'];
    const missing = required.filter(k => !String(data[k] || '').trim());
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '');

    if (missing.length || !emailOk) {
      note.textContent = !emailOk && !missing.includes('email')
        ? 'Please enter a valid email address.'
        : 'Please fill in all required fields.';
      note.classList.add('is-error');
      return;
    }

    // Compose mailto fallback (no backend required)
    const subject = encodeURIComponent(`Enquiry from ${data.name} — ${data.service || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\n` +
      `Organisation: ${data.org || '-'}\n` +
      `Phone: ${data.phone}\n` +
      `Email: ${data.email}\n` +
      `Service: ${data.service || '-'}\n\n` +
      `Message:\n${data.message}\n`
    );

    note.textContent = 'Opening your email client to send this enquiry to habakkuk1996@gmail.com…';
    note.classList.add('is-success');

    // Slight delay so user sees the message before mail client opens
    setTimeout(() => {
      window.location.href = `mailto:habakkuk1996@gmail.com?subject=${subject}&body=${body}`;
    }, 250);

    form.reset();
  });

  /* ---------- Smooth scroll offset for sticky header ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
