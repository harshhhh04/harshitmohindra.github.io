/**
 * ==========================================================================
 * PORTFOLIO MICROINTERACTIONS & ANIMATION SCRIPT
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Cached DOM references ──────────────────────────────────────────────────
  const scrollProgress    = document.getElementById('scroll-progress');
  const navbar            = document.getElementById('navbar');
  const navIndicator      = document.getElementById('nav-indicator');
  const hamburger         = document.getElementById('nav-hamburger');
  const drawer            = document.getElementById('nav-drawer');
  const sections          = document.querySelectorAll('section[id]');
  const navLinks          = document.querySelectorAll('.nav-links a');
  const timelineContainer = document.querySelector('.timeline-container');
  const timelinePulse     = document.querySelector('.timeline-pulse');


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

    // Timeline vertical oscilloscope pulse logic
    if (timelineContainer && timelinePulse) {
      const rect = timelineContainer.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      if (rect.top < viewHeight && rect.bottom > 0) {
        const totalDist = rect.height + viewHeight;
        const scrolledDist = viewHeight - rect.top;
        const scrolledRatio = scrolledDist / totalDist;
        const pulseY = Math.max(-80, Math.min(rect.height, (scrolledRatio * rect.height) - 40));
        timelinePulse.style.transform = `translate3d(0, ${pulseY}px, 0)`;
      }
    }
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

    // Use transform instead of left/top to keep animation on the compositor thread
    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
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
      // Store logical vw/vh position as data attributes; animate via transform (compositor-only)
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      particle.dataset.x = startX;
      particle.dataset.y = startY;
      particle.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `opacity:${Math.random() * 0.12 + 0.03}`,
        // Position via transform — avoids layout, runs on compositor thread
        `transform:translate(${startX}vw,${startY}vh)`,
      ].join(';');
      fragment.appendChild(particle);
    }
    particlesContainer.appendChild(fragment); // single DOM write

    // Animate after append so position reads are from settled layout
    particlesContainer.querySelectorAll('.particle').forEach(animateDrift);
  }

  function animateDrift(p) {
    let y     = parseFloat(p.dataset.y);
    let x     = parseFloat(p.dataset.x);
    const speed = Math.random() * 0.04 + 0.015;
    const drift = Math.random() * 0.02 - 0.01;

    // transform: translate() keeps animation on compositor — no layout recalculation
    function step() {
      y -= speed;
      x += drift;
      if (y < -5)   { y = 105; x = Math.random() * 100; }
      if (x < -5)   x = 105;
      if (x > 105)  x = -5;
      p.style.transform = `translate(${x}vw, ${y}vh)`;
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

  // Helper to generate mathematical oscilloscope waveforms with procedural variations
  function generateWaveformPath(type, seed) {
    const points = [];
    const startX = 0;
    const endX = 1200;
    const step = 4; // High-resolution step width (px) for clean trace drawing
    
    // Slight procedural variation coefficients from seed
    const ampVar = 0.85 + (seed * 0.3); // 85% to 115% amplitude
    const phaseVar = (seed - 0.5) * 0.5; // Small phase shift
    const freqVar = 0.9 + (seed * 0.2); // 90% to 110% frequency scale

    for (let x = startX; x <= endX; x += step) {
      let y = 30; // Center baseline
      
      if (type === 'sine') {
        // Damped Sine Wave (underdamped step response overshoot/ringing)
        if (x >= 350 && x <= 850) {
          const dx = x - 350;
          const amp = 20 * ampVar;
          const decay = 0.007;
          const freq = 0.038 * freqVar;
          y = 30 - amp * Math.exp(-decay * dx) * Math.sin(freq * dx + phaseVar);
        }
      } else if (type === 'pulse-train') {
        // Clock pulses with ringing transients on rising/falling transitions
        if (x >= 400 && x <= 800) {
          const subX = (x - 400) % 80;
          const isHigh = subX < 40;
          const targetY = isHigh ? 16 : 44;
          
          const dx = subX % 40;
          const ringAmp = 10 * ampVar;
          const ringDecay = 0.14;
          const ringFreq = 0.55 * freqVar;
          const ring = ringAmp * Math.exp(-ringDecay * dx) * Math.sin(ringFreq * dx);
          
          y = targetY + (isHigh ? -ring : ring);
        }
      } else if (type === 'step') {
        // Underdamped logic step response
        if (x >= 400 && x <= 800) {
          const dx = x - 400;
          const amp = 24 * ampVar;
          const decay = 0.012;
          const freq = 0.045 * freqVar;
          y = 30 - amp * Math.exp(-decay * dx) * Math.sin(freq * dx + phaseVar);
        }
      } else if (type === 'packet') {
        // High-frequency burst envelope
        if (x >= 450 && x <= 750) {
          const amp = 24 * ampVar;
          const freq = 0.1 * freqVar;
          const envelope = Math.exp(-Math.pow((x - 600) / 65, 2));
          y = 30 - amp * envelope * Math.sin(freq * (x - 600) + phaseVar);
        }
      } else if (type === 'clean-pulse') {
        // One clean bell-curve impulse
        if (x >= 500 && x <= 700) {
          const amp = 24 * ampVar;
          const envelope = Math.exp(-Math.pow((x - 600) / 38, 2));
          y = 30 - amp * envelope;
        }
      }
      
      // Safety bounds containment
      y = Math.max(3, Math.min(57, y));
      points.push(`${x} ${y.toFixed(1)}`);
    }
    
    return `M ${points.join(' L ')}`;
  }

  // 6b. SECTION DIVIDERS SIGNAL PULSE OBSERVER
  const dividerObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const divider = entry.target;
        const type = divider.getAttribute('data-waveform') || 'sine';
        const scanLine = divider.querySelector('.divider-scan-line');
        const scanHead = divider.querySelector('.divider-scan-head');
        
        if (scanLine) {
          const seed = Math.random();
          const pathString = generateWaveformPath(type, seed);
          
          scanLine.setAttribute('d', pathString);
          if (scanHead) {
            // Apply motion-path inline style to trace along SVG waveform
            scanHead.style.offsetPath = `path("${pathString}")`;
          }
        }
        
        divider.classList.add('animate-pulse');
      } else {
        entry.target.classList.remove('animate-pulse');
      }
    });
  }, { root: null, threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.section-divider').forEach((el) => {
    dividerObserver.observe(el);
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