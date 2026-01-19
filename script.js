/*==================================================================
   script.js – Globale UI-Interaktivität
   1. Mobile Menu Toggle
   2. Active Nav Link Highlighting
===================================================================*/

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------------
    // 1. MOBILE MENU
    // -----------------------------------------------------------------
    const navToggle = document.querySelector(".nav-toggle");
    const mobileMenu = document.querySelector(".nav-links.mobile");

    if (navToggle && mobileMenu) {
        navToggle.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            navToggle.classList.toggle("open", isOpen);
            const iconImg = navToggle.querySelector(".nav-icon");
            if (iconImg) {
                const menuSrc = iconImg.getAttribute("data-menu-src");
                const closeSrc = iconImg.getAttribute("data-close-src");
                iconImg.setAttribute("src", isOpen ? closeSrc : menuSrc);
            }
            navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        // Close mobile menu when a link is clicked
        mobileMenu.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("open");
                navToggle.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
                // Reset icon on close
                const iconImg = navToggle.querySelector(".nav-icon");
                 if (iconImg) {
                    const menuSrc = iconImg.getAttribute("data-menu-src");
                    iconImg.setAttribute("src", menuSrc);
                 }
            });
        });
    }

    // -----------------------------------------------------------------
    // 2. ACTIVE NAV LINK
    // -----------------------------------------------------------------
    const currentPath = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach(link => {
        // Create a full URL object to safely resolve the path
        const linkPath = new URL(link.href, window.location.origin).pathname;
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });

    // -----------------------------------------------------------------
    // 3. PLAY MODE TOGGLE
    // -----------------------------------------------------------------
    const playModeToggle = document.getElementById('play-mode-toggle-switch');
    if (playModeToggle && typeof game !== 'undefined') {
        // Set initial state of the toggle
        playModeToggle.checked = game.state.playMode;
        
        // Hide banner if not in play mode
        const banner = document.querySelector('.game-banner');
        if(banner && !game.state.playMode) {
            banner.style.display = 'none';
        }

        // Add listener
        playModeToggle.addEventListener('change', (e) => {
            game.setPlayMode(e.target.checked);
        });
    }

});