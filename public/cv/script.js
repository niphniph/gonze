document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  lucide.createIcons();

  // 2. Mobile Menu Toggle
  const menuHamburger = document.getElementById('menuHamburger');
  const navMenu = document.getElementById('navMenu');
  
  if (menuHamburger && navMenu) {
    menuHamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = menuHamburger.querySelector('i');
      if (navMenu.classList.contains('active')) {
        menuHamburger.innerHTML = '<i data-lucide="x"></i>';
      } else {
        menuHamburger.innerHTML = '<i data-lucide="menu"></i>';
      }
      lucide.createIcons();
    });

    // Close menu when link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuHamburger.innerHTML = '<i data-lucide="menu"></i>';
        lucide.createIcons();
      });
    });
  }

  // 3. Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Check saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.className = savedTheme;
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light-theme');
      } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark-theme');
      }
    });
  }

  // 4. Stats Counter Animation (using Intersection Observer)
  const stats = document.querySelectorAll('.stat-number');
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const startCounting = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetNumber = parseInt(target.getAttribute('data-target'), 10);
        let current = 0;
        const duration = 1500; // 1.5 seconds
        const stepTime = Math.max(Math.floor(duration / targetNumber), 15);
        
        const counter = setInterval(() => {
          current += 1;
          if (targetNumber === 97) {
            target.textContent = `${current}%+`;
          } else if (targetNumber === 6) {
            target.textContent = `${current}+`;
          } else {
            target.textContent = `${current}%`;
          }
          
          if (current >= targetNumber) {
            clearInterval(counter);
            if (targetNumber === 97) {
              target.textContent = '97%+';
            } else if (targetNumber === 6) {
              target.textContent = '6+';
            } else if (targetNumber === 20) {
              target.textContent = '20%';
            } else if (targetNumber === 25) {
              target.textContent = '25%';
            }
          }
        }, stepTime);

        observer.unobserve(target);
      }
    });
  };

  const statsObserver = new IntersectionObserver(startCounting, observerOptions);
  stats.forEach(stat => statsObserver.observe(stat));

  // 5. Skills Tab Filter
  const tabs = document.querySelectorAll('.skills-tab');
  const skills = document.querySelectorAll('.skill-pill-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.getAttribute('data-category');

      skills.forEach(skill => {
        const skillCat = skill.getAttribute('data-cat');
        if (category === 'all' || skillCat === category) {
          skill.classList.remove('hidden');
          skill.style.animation = 'fadeIn 0.4s ease forwards';
        } else {
          skill.classList.add('hidden');
        }
      });
    });
  });

  // 6. Active Nav Link on Scroll
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  const highlightNav = () => {
    let scrollPosition = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav);

  // 7. Contact Form Handler & Submission Simulation
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.btn-submit');
      const originalBtnHtml = submitBtn.innerHTML;
      
      // Simulate loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending... <span class="spinner"></span>';
      
      const nameVal = document.getElementById('name').value;
      const emailVal = document.getElementById('email').value;
      const subjectVal = document.getElementById('subject').value;
      const messageVal = document.getElementById('message').value;

      setTimeout(() => {
        // Simple success response simulation
        formFeedback.className = 'form-feedback success';
        formFeedback.innerHTML = `<strong>Success!</strong> Thank you, ${nameVal}. Your message has been sent. Nino will get back to you shortly at ${emailVal}.`;
        formFeedback.classList.remove('hidden');
        
        // Reset button and form
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        contactForm.reset();
        
        // Hide success alert after 6 seconds
        setTimeout(() => {
          formFeedback.classList.add('hidden');
        }, 6000);
      }, 1500);
    });
  }

  // 8. Video Modal Popup Logic
  const videoModal = document.getElementById('videoModal');
  const introVideo = document.getElementById('introVideo');
  const watchVideoBtn = document.getElementById('watchVideoBtn');
  const imagePlayBtn = document.getElementById('imagePlayBtn');
  const closeVideoBtn = document.getElementById('closeVideoBtn');

  const openModal = () => {
    if (videoModal && introVideo) {
      videoModal.classList.remove('hidden');
      introVideo.play().catch(err => {
        console.log("Autoplay or play call prevented by browser policies:", err);
      });
    }
  };

  const closeModal = () => {
    if (videoModal && introVideo) {
      videoModal.classList.add('hidden');
      introVideo.pause();
    }
  };

  if (watchVideoBtn) {
    watchVideoBtn.addEventListener('click', openModal);
  }
  if (imagePlayBtn) {
    imagePlayBtn.addEventListener('click', openModal);
  }
  if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking on background overlay
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeModal();
      }
    });
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Auto-pop up video 1.2 seconds after page load
  setTimeout(() => {
    openModal();
  }, 1200);
});
