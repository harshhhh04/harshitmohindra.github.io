/**
 * ==========================================================================
 * PORTFOLIO MICROINTERACTIONS & ANIMATION SCRIPT
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Cached DOM references ──────────────────────────────────────────────────
  const scrollProgress = document.getElementById('scroll-progress');
  const navbar         = document.getElementById('navbar');
  const navIndicator   = document.getElementById('nav-indicator');
  const hamburger      = document.getElementById('nav-hamburger');
  const drawer         = document.getElementById('nav-drawer');
  const sections       = document.querySelectorAll('section[id]');
  const navLinks       = document.querySelectorAll('.nav-links a');


  // 1. SCROLL PROGRESS INDICATOR & NAVBAR SCROLLED STATE
  // ── Throttled via rAF so scroll handlers never block the main thread ───────
  let scrollRafPending = false;

  function onScroll() {
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(handleScroll);
  }

  function handleScroll() {
    scrollRafPending = false;
    const winScroll = document.documentElement.scrollTop;
    const height    = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Scroll progress bar
    scrollProgress.style.width = height > 0 ? `${(winScroll / height) * 100}%` : '0%';

    // Navbar scrolled class
    navbar.classList.toggle('scrolled', winScroll > 50);

    // Scrollspy (was a separate listener — merged here to avoid double layout reads)
    checkScrollspy(winScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });


  // 2. CURSOR RADIAL SPOTLIGHT TRACKING (LERP easing)
  // ── Skip entirely on touch devices where the glow is invisible ─────────────
  const cursorGlow = document.getElementById('cursor-glow');
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  if (!isTouchDevice && cursorGlow) {
    let mouseX = window.innerWidth  / 2;
    let mouseY = window.innerHeight / 2;
    let glowX  = mouseX;
    let glowY  = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top  = `${glowY}px`;
      requestAnimationFrame(animateGlow);
    }
    requestAnimationFrame(animateGlow);
  }


  // 3. BACKGROUND PARTICLES SIMULATOR
  const particlesContainer = document.getElementById('particles-container');

  if (particlesContainer && !isTouchDevice) {
    const particleCount = 20;
    // Build all particles in one fragment to avoid 20 separate reflows
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 3 + 1;
      particle.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}vw`,
        `top:${Math.random() * 100}vh`,
        `opacity:${Math.random() * 0.12 + 0.03}`,
      ].join(';');
      fragment.appendChild(particle);
    }
    particlesContainer.appendChild(fragment); // single DOM write

    // Animate after append so position reads are from settled layout
    particlesContainer.querySelectorAll('.particle').forEach(animateDrift);
  }

  function animateDrift(p) {
    let y     = parseFloat(p.style.top);
    let x     = parseFloat(p.style.left);
    const speed = Math.random() * 0.04 + 0.015;
    const drift = Math.random() * 0.02 - 0.01;

    function step() {
      y -= speed;
      x += drift;
      if (y < -5)   { y = 105; x = Math.random() * 100; }
      if (x < -5)   x = 105;
      if (x > 105)  x = -5;
      p.style.top  = `${y}vh`;
      p.style.left = `${x}vw`;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }


  // 4. MAGNETIC BUTTONS COMPONENT EFFECT
  if (window.innerWidth > 768) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = parseFloat(el.getAttribute('data-strength')) || 15;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width  / 2;
        const y = e.clientY - rect.top  - rect.height / 2;
        el.style.transform  = `translate3d(${x * (strength / 100)}px, ${y * (strength / 100)}px, 0)`;
        el.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform  = 'translate3d(0, 0, 0)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }


  // 5. SLIDING NAVIGATION INDICATOR & SCROLLSPY
  function updateIndicator(targetLink) {
    if (!targetLink || window.innerWidth <= 768) {
      navIndicator.style.opacity = '0';
      return;
    }
    const rect    = targetLink.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();
    navIndicator.style.left    = `${rect.left - navRect.left}px`;
    navIndicator.style.width   = `${rect.width}px`;
    navIndicator.style.opacity = '1';
  }

  // Called inside the merged scroll handler — receives scrollPos to avoid re-read
  function checkScrollspy(scrollPos) {
    if (scrollPos < 100) {
      navLinks.forEach(l => l.classList.remove('active'));
      navIndicator.style.opacity = '0';
      return;
    }
    sections.forEach((section) => {
      const offsetTop = section.offsetTop - 180;
      if (scrollPos >= offsetTop && scrollPos < offsetTop + section.offsetHeight) {
        const id = section.getAttribute('id');
        navLinks.forEach((link) => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isActive);
          if (isActive) updateIndicator(link);
        });
      }
    });
  }

  // Slide indicator on hover
  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        updateIndicator(link);
        navIndicator.style.opacity = '1';
      }
    });

    link.addEventListener('mouseleave', () => {
      const activeLink = document.querySelector('.nav-links a.active');
      updateIndicator(activeLink || null);
      if (!activeLink) navIndicator.style.opacity = '0';
    });
  });


  // 6. SCROLL REVEAL VIEWPORT OBSERVER
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Remove will-change after animation settles to free compositor layers
        entry.target.addEventListener('transitionend', () => {
          entry.target.style.willChange = 'auto';
        }, { once: true });
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    revealObserver.observe(el);
  });


  // 7. MOBILE HAMBURGER MENU
  function openDrawer() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  if (hamburger && drawer) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburger.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) closeDrawer();
    });
  }


  // 8. UNIFIED RESIZE HANDLER (single listener for all resize work)
  // ── Debounced — resize is cheap to miss for a few ms ──────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-align nav indicator for current active link
      const activeLink = document.querySelector('.nav-links a.active');
      if (activeLink) updateIndicator(activeLink);
      // Close hamburger drawer if resized to desktop
      if (window.innerWidth > 768) closeDrawer();
    }, 100);
  }, { passive: true });

});