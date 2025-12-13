/*==================================================================
   script.js – Gesamte Interaktivität
   1. Game State Management (Spielstatus, Punkte, Quests)
   2. UI Update Logic (Anzeige basierend auf Spielstatus)
   3. Event Listeners (Moduswahl, Quests, Shop)
   4. Mobile Menu & Active Nav Link
===================================================================*/

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------------------
    // 1. GAME STATE MANAGEMENT
    // -----------------------------------------------------------------

    const initialGameState = {
        playfulMode: null, // null = choice not made; true = playful; false = direct
        points: 0,
        quests: {
            visitedSkills: false,
            firstClick: false,
        },
        unlocks: {
            portfolio: false,
            contact: false,
        }
    };

    let gameState = loadGameState();

    function loadGameState() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (savedState) {
                // Merge saved state with initial state to ensure all keys are present
                const parsedState = JSON.parse(savedState);
                return { ...initialGameState, ...parsedState };
            }
        } catch (e) {
            console.error("Failed to load game state from localStorage", e);
        }
        return { ...initialGameState }; // Return a copy
    }

    function saveGameState() {
        try {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        } catch (e) {
            console.error("Failed to save game state to localStorage", e);
        }
    }

    function addPoints(amount) {
        if (gameState.playfulMode) {
            gameState.points += amount;
            showNotification(`+${amount} Punkte!`);
            updateUI();
            saveGameState();
        }
    }

    function completeQuest(questName, pointsValue = 10) {
        if (gameState.playfulMode && !gameState.quests[questName]) {
            gameState.quests[questName] = true;
            addPoints(pointsValue);
            console.log(`Quest '${questName}' completed.`);
        }
    }
    
    function unlockEverything() {
        Object.keys(gameState.unlocks).forEach(key => {
            gameState.unlocks[key] = true;
        });
        // Maybe hide game-related UI elements
        const infoSection = document.getElementById("info");
        if(infoSection) infoSection.style.display = 'none';
        
        saveGameState();
        updateUI();
    }


    // -----------------------------------------------------------------
    // 2. UI UPDATE LOGIC
    // -----------------------------------------------------------------

    function updateUI() {
        const { playfulMode, points, unlocks } = gameState;

        // Update shop UI if on shop page
        updateShopUI();

        const modeChoice = document.getElementById("mode-choice");
        const infoSection = document.getElementById("info");
        const gameToggle = document.getElementById('game-mode-toggle');
        const gameToggleBanner = document.getElementById('game-mode-banner');

        // Show/hide mode choice banner
        if (modeChoice) {
            modeChoice.style.display = playfulMode === null ? 'flex' : 'none';
        }
        
        if (gameToggleBanner) {
            gameToggleBanner.style.display = playfulMode !== null ? 'block' : 'none';
        }

        if (gameToggle) {
            gameToggle.checked = playfulMode;
        }

        
        // Show/hide info section with points
        if (infoSection) {
            if (playfulMode) {
                infoSection.style.display = 'block';
                document.getElementById('points').textContent = points;
            } else if (playfulMode === false) {
                 infoSection.style.display = 'none';
            }
        }
        
        // Unlock content
        const portfolioLink = document.querySelector('a[href="pages/portfolio.html"]');
        const contactLink = document.querySelector('a[href="pages/contact.html"]');
        if (portfolioLink) {
             if (unlocks.portfolio || !playfulMode) {
                portfolioLink.classList.remove('locked');
                portfolioLink.style.pointerEvents = 'auto';
                portfolioLink.style.opacity = '1';

             } else {
                portfolioLink.classList.add('locked');
                portfolioLink.style.pointerEvents = 'none';
                portfolioLink.style.opacity = '0.5';
             }
        }
        if (contactLink) {
            if (unlocks.contact || !playfulMode) {
                contactLink.classList.remove('locked');
                contactLink.style.pointerEvents = 'auto';
                contactLink.style.opacity = '1';
            } else {
                contactLink.classList.add('locked');
                contactLink.style.pointerEvents = 'none';
                contactLink.style.opacity = '0.5';
            }
        }
    }

    // Event listener for the game mode toggle
    const gameModeToggle = document.getElementById('game-mode-toggle');
    if (gameModeToggle) {
        gameModeToggle.addEventListener('change', (e) => {
            gameState.playfulMode = e.target.checked;
            if (!gameState.playfulMode) {
                unlockEverything();
            }
            saveGameState();
            updateUI();
        });
    }

    function updateShopUI() {
        const points = gameState.points;
        const pointsDisplay = document.getElementById('points-shop');
        if (pointsDisplay) {
            pointsDisplay.textContent = points;
        }

        const shopItems = document.querySelectorAll('.shop-item-card');
        shopItems.forEach(item => {
            const cost = parseInt(item.dataset.cost, 10);
            const buyButton = item.querySelector('.btn-shop');

            if (points >= cost) {
                item.classList.remove('unavailable');
                if (buyButton) {
                    buyButton.disabled = false;
                }
            } else {
                item.classList.add('unavailable');
                if (buyButton) {
                    buyButton.disabled = true;
                }
            }
        });
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }


    // -----------------------------------------------------------------
    // 3. EVENT LISTENERS
    // -----------------------------------------------------------------

    // Mode choice buttons
    document.getElementById("yes-btn")?.addEventListener("click", () => {
        gameState.playfulMode = true;
        saveGameState();
        updateUI();
    });

    document.getElementById("no-btn")?.addEventListener("click", () => {
        gameState.playfulMode = false;
        unlockEverything();
        saveGameState();
        updateUI();
    });

    // Quest listeners
    document.querySelector('a[href="pages/skills.html"]')?.addEventListener('click', () => {
        completeQuest('visitedSkills');
    });

    document.addEventListener('click', () => {
        completeQuest('firstClick', 5);
    }, { once: true });

    // Shop listeners
    const shopModal = document.getElementById("shop-modal");
    const closeShopBtn = document.getElementById("close-shop");
    const shopLink = document.getElementById("shop-link");

    shopLink?.addEventListener("click", (e) => {
        e.preventDefault();
        shopModal.style.display = "flex";
    });

    closeShopBtn?.addEventListener("click", () => {
        shopModal.style.display = "none";
    });

    shopModal?.addEventListener("click", (e) => {
        if (e.target === shopModal) {
            shopModal.style.display = "none";
        }
    });

    // Shop purchase listeners
    document.getElementById('buy-portfolio-btn')?.addEventListener('click', () => {
        if (gameState.points >= 20) {
            gameState.points -= 20;
            gameState.unlocks.portfolio = true;
            saveGameState();
            updateUI();
            showNotification('Portfolio freigeschaltet!');
        } else {
            showNotification('Nicht genug Punkte!');
        }
    });

    document.getElementById('buy-contact-btn')?.addEventListener('click', () => {
        if (gameState.points >= 15) {
            gameState.points -= 15;
            gameState.unlocks.contact = true;
            saveGameState();
            updateUI();
            showNotification('Kontaktdaten freigeschaltet!');
        } else {
            showNotification('Nicht genug Punkte!');
        }
    });


    // -----------------------------------------------------------------
    // 4. MOBILE MENU & ACTIVE NAV LINK
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

        mobileMenu.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("open");
                navToggle.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    const currentPath = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname;
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
    
    // Initial UI setup on page load
    updateUI();
});