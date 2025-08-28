// js/main.js - Complete Consolidated Version
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== SMOOTH SCROLLING =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== PROGRESS BAR =====
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = scrolled + '%';
        }
    });

    // ===== ANIMATED COUNTERS =====
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        let hasAnimated = false;
        
        counters.forEach(counter => {
            if (!hasAnimated) {
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / 100;
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.ceil(current);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.textContent = target + (target < 100 ? '%' : '+');
                    }
                };
                updateCounter();
            }
        });
        hasAnimated = true;
    }

    // Trigger counters when impact section is visible
    const impactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
            }
        });
    });
    
    const impactSection = document.querySelector('#impact');
    if (impactSection) {
        impactObserver.observe(impactSection);
    }

    // ===== MOBILE MENU TOGGLE =====
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // ===== NAVBAR SCROLL EFFECT =====
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            nav.classList.add('bg-gray-900/95', 'backdrop-blur-sm', 'shadow-lg');
        } else {
            nav.classList.remove('bg-gray-900/95', 'backdrop-blur-sm', 'shadow-lg');
        }
        
        lastScrollTop = scrollTop;
    });

    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // ===== CONTACT FORM HANDLING =====
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');
    
    if (!form || !submitBtn || !formStatus) {
        console.error('Contact form elements not found!');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        formStatus.classList.add('hidden');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('https://formspree.io/f/movlloyl', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                formStatus.textContent = 'Thank you! Your message has been sent successfully. We\'ll get back to you soon!';
                formStatus.className = 'p-4 rounded-lg bg-green-100 text-green-800 border border-green-300';
                formStatus.classList.remove('hidden');
                form.reset();
            } else {
                throw new Error(`Form submission failed: ${response.status}`);
            }
            
        } catch (error) {
            formStatus.textContent = 'Sorry, there was an error sending your message. Please try again or contact us directly.';
            formStatus.className = 'p-4 rounded-lg bg-red-100 text-red-800 border border-red-300';
            formStatus.classList.remove('hidden');
        }
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        setTimeout(() => {
            formStatus.classList.add('hidden');
        }, 8000);
    });
     // ===== NEWSLETTER FORM HANDLING =====
const newsletterForm = document.getElementById('newsletter-form');
const newsletterBtn = document.getElementById('newsletter-btn');
const newsletterStatus = document.getElementById('newsletter-status');

if (newsletterForm && newsletterBtn && newsletterStatus) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const originalText = newsletterBtn.textContent;
        newsletterBtn.textContent = 'Subscribing...';
        newsletterBtn.disabled = true;
        
        newsletterStatus.classList.add('hidden');
        const formData = new FormData(newsletterForm);
        
        try {
            const response = await fetch('https://formspree.io/f/mvgqbpro', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                newsletterStatus.textContent = 'Successfully subscribed! Thank you for joining our newsletter!';
                newsletterStatus.className = 'mt-3 p-3 rounded-lg text-sm bg-green-100 text-green-800 border border-green-300';
                newsletterStatus.classList.remove('hidden');
                newsletterForm.reset();
            } else {
                throw new Error(`Newsletter subscription failed: ${response.status}`);
            }
            
        } catch (error) {
            newsletterStatus.textContent = 'Error subscribing to newsletter. Please try again.';
            newsletterStatus.className = 'mt-3 p-3 rounded-lg text-sm bg-red-100 text-red-800 border border-red-300';
            newsletterStatus.classList.remove('hidden');
        }
        
        newsletterBtn.textContent = originalText;
        newsletterBtn.disabled = false;
        
        setTimeout(() => {
            newsletterStatus.classList.add('hidden');
        }, 6000);
    });
}

    console.log('All event listeners attached successfully');
});

/* code for navbar in phone*/
// Mobile menu functionality - WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        let isMenuOpen = false;
        
        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                // Show menu
                mobileMenu.classList.remove('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
                
                // Change hamburger to X
                mobileMenuBtn.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                `;
            } else {
                // Hide menu
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                
                // Change X back to hamburger
                mobileMenuBtn.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                `;
            }
        });
        
        // Close menu when clicking on a link
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                isMenuOpen = false;
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                
                // Reset to hamburger icon
                mobileMenuBtn.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                `;
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (isMenuOpen && !mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                isMenuOpen = false;
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                
                // Reset to hamburger icon
                mobileMenuBtn.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                `;
            }
        });
        
        console.log('✅ Mobile menu initialized and working');
    } else {
        console.warn('❌ Mobile menu elements not found');
    }
});

