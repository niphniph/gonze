document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Navigation Toggle Menu
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mainNav.classList.toggle('active');
            const icon = navToggle.querySelector('span');
            if (icon) {
                icon.textContent = mainNav.classList.contains('active') ? 'close' : 'menu';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mainNav.classList.contains('active') && !mainNav.contains(e.target) && !navToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                const icon = navToggle.querySelector('span');
                if (icon) icon.textContent = 'menu';
            }
        });
    }

    // 2. Dynamic Scroll Header Transition
    const siteHeader = document.getElementById('siteHeader');
    if (siteHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                siteHeader.classList.add('scrolled');
            } else {
                siteHeader.classList.remove('scrolled');
            }
        });
    }

    // 3. Before/After Interactive Slider Transition Logic
    const slider = document.getElementById('transformationSlider');
    const afterImg = document.getElementById('afterImage');
    const handle = document.getElementById('sliderHandle');
    
    if (slider && afterImg && handle) {
        let isResizing = false;

        const updateSlider = (e) => {
            if (!isResizing) return;
            
            const rect = slider.getBoundingClientRect();
            let x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
            
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            
            const percentage = (x / rect.width) * 100;
            afterImg.style.clipPath = `inset(0 0 0 ${percentage}%)`;
            handle.style.left = `${percentage}%`;
        };

        const startResizing = () => { isResizing = true; };
        const stopResizing = () => { isResizing = false; };

        // Mouse Listeners
        handle.addEventListener('mousedown', startResizing);
        window.addEventListener('mouseup', stopResizing);
        window.addEventListener('mousemove', updateSlider);

        // Touch Listeners (Mobile compatibility)
        handle.addEventListener('touchstart', startResizing);
        window.addEventListener('touchend', stopResizing);
        window.addEventListener('touchmove', updateSlider);
        
        // Prevent default dragging behaviors
        slider.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // 4. Custom Interactive Cost Estimator & Quote Form
    const quoteForm = document.getElementById('quoteCalculator');
    const estimatedPriceEl = document.getElementById('estimatedPrice');
    
    if (quoteForm && estimatedPriceEl) {
        const sqftInput = document.getElementById('sqft');
        const serviceSelect = document.getElementById('serviceType');
        const bedroomsSelect = document.getElementById('bedrooms');
        const bathroomsSelect = document.getElementById('bathrooms');
        
        let currentEstimatedPrice = 475;

        // Custom animation function for luxury counter increments
        const animatePriceNumber = (targetVal) => {
            const startVal = currentEstimatedPrice;
            const duration = 350; // ms
            let startTime = null;

            const updateNumber = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = Math.floor(startVal + (targetVal - startVal) * easeProgress);
                
                estimatedPriceEl.textContent = `$${currentVal}`;

                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                } else {
                    currentEstimatedPrice = targetVal;
                    estimatedPriceEl.textContent = `$${targetVal}`;
                }
            };

            requestAnimationFrame(updateNumber);
        };

        const calculatePrice = () => {
            const sqft = parseInt(sqftInput.value) || 2000;
            const service = serviceSelect.value;
            const bedrooms = parseInt(bedroomsSelect.value) || 1;
            const bathrooms = parseInt(bathroomsSelect.value) || 1;

            let base = 150;
            let sqftRate = 0.10;
            let bedRate = 40;
            let bathRate = 60;

            if (service === 'deep') {
                base = 250;
                sqftRate = 0.15;
                bedRate = 50;
                bathRate = 75;
            } else if (service === 'post') {
                base = 400;
                sqftRate = 0.24;
                bedRate = 60;
                bathRate = 90;
            }

            const calculatedTotal = Math.floor(base + (sqft * sqftRate) + (bedrooms * bedRate) + (bathrooms * bathRate));
            animatePriceNumber(calculatedTotal);
        };

        // Bind events for live calculation feedback
        sqftInput.addEventListener('input', calculatePrice);
        serviceSelect.addEventListener('change', calculatePrice);
        bedroomsSelect.addEventListener('change', calculatePrice);
        bathroomsSelect.addEventListener('change', calculatePrice);

        // Pre-selection and anchor logic from cards
        const planBtns = document.querySelectorAll('.select-plan-btn');
        planBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceVal = btn.getAttribute('data-service');
                if (serviceVal) {
                    serviceSelect.value = serviceVal;
                    calculatePrice();
                }
            });
        });

        // Run initial calculation to update correct value
        calculatePrice();
    }

    // 5. Dynamic Category Filters (gallery.html)
    const galleryFilters = document.getElementById('galleryFilters');
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (galleryFilters && galleryGrid) {
        const filterBtns = galleryFilters.querySelectorAll('.filter-btn');
        const galleryItems = galleryGrid.querySelectorAll('.gallery-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active filter button
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedCategory = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');
                    
                    if (selectedCategory === 'all' || itemCategory === selectedCategory) {
                        item.style.display = 'block';
                        // Add organic luxury fade-in animation
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // 6. Smooth scrolling for internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu just in case
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    const icon = navToggle.querySelector('span');
                    if (icon) icon.textContent = 'menu';
                }
            }
        });
    });
});
