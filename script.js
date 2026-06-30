/**
 * ==========================================================================
 * PORTFOLIO MICROINTERACTIONS & ANIMATION SCRIPT
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. SCROLL PROGRESS INDICATOR & NAVBAR SCROLLED STATE
  const scrollProgress = document.getElementById('scroll-progress');
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    // Scroll progress calc
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    scrollProgress.style.width = `${scrolled}%`;

    // Navbar shrink and border glow trigger
    if (winScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });


  // 2. CURSOR RADIAL SPOTLIGHT TRACKING (With LERP Easing)
  const cursorGlow = document.getElementById('cursor-glow');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animateGlow() {
    // Linear Interpolation (LERP) for smooth drag weight
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;

    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;

    requestAnimationFrame(animateGlow);
  }
  requestAnimationFrame(animateGlow);


  // 3. BACKGROUND PARTICLES SIMULATOR
  const particlesContainer = document.getElementById('particles-container');
  const particleCount = 20;

  if (particlesContainer) {
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      const size = Math.random() * 3 + 1; // 1px to 4px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.opacity = Math.random() * 0.12 + 0.03;
      
      particlesContainer.appendChild(particle);
      animateDrift(particle);
    }
  }

  function animateDrift(p) {
    let y = parseFloat(p.style.top);
    let x = parseFloat(p.style.left);
    const speed = Math.random() * 0.04 + 0.015; // slow float speed
    const drift = Math.random() * 0.02 - 0.01;   // slight left-right sway

    function step() {
      y -= speed;
      x += drift;

      // Wrap around borders
      if (y < -5) {
        y = 105;
        x = Math.random() * 100;
      }
      if (x < -5) x = 105;
      if (x > 105) x = -5;

      p.style.top = `${y}vh`;
      p.style.left = `${x}vw`;

      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }


  // 4. MAGNETIC BUTTONS COMPONENT EFFECT
  const magneticElements = document.querySelectorAll('.magnetic');

  // Skip magnetic effect on mobile/touch screens to preserve scroll usability
  if (window.innerWidth > 768) {
    magneticElements.forEach((el) => {
      const strength = parseFloat(el.getAttribute('data-strength')) || 15;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        // Calc offset from button center
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate3d(${x * (strength / 100)}px, ${y * (strength / 100)}px, 0)`;
        el.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0, 0, 0)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }


  // 5. SLIDING NAVIGATION INDICATOR & SCROLLSPY
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const navIndicator = document.getElementById('nav-indicator');

  function updateIndicator(targetLink) {
    if (!targetLink || window.innerWidth <= 768) {
      navIndicator.style.opacity = '0';
      return;
    }
    const rect = targetLink.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();
    
    navIndicator.style.left = `${rect.left - navRect.left}px`;
    navIndicator.style.width = `${rect.width}px`;
    navIndicator.style.opacity = '1';
  }

  // Scrollspy tracking active sections
  function checkScrollspy() {
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    
    sections.forEach((section) => {
      const offsetTop = section.offsetTop - 180;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      
      if (scrollPos >= offsetTop && scrollPos < offsetTop + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            updateIndicator(link);
          } else {
            link.classList.remove('active');
          }
        });
      }
    });

    // Special cases: top of page activates nothing or highlights hero
    if (scrollPos < 100) {
      navLinks.forEach(link => link.classList.remove('active'));
      navIndicator.style.opacity = '0';
    }
  }

  window.addEventListener('scroll', checkScrollspy, { passive: true });
  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.nav-links a.active');
    if (activeLink) updateIndicator(activeLink);
  });

  // Slide to hover link and snap back on leave
  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        updateIndicator(link);
        navIndicator.style.opacity = '1';
      }
    });

    link.addEventListener('mouseleave', () => {
      const activeLink = document.querySelector('.nav-links a.active');
      if (activeLink) {
        updateIndicator(activeLink);
      } else {
        navIndicator.style.opacity = '0';
      }
    });
  });


  // 6. SCROLL REVEAL VIEWPORT OBSERVER
  const revealOptions = {
    root: null,
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, revealOptions);

  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });

});