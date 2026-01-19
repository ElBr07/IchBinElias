/*
    DasBinIch - Game Logic
    Handles all gamification features like points, achievements, and shop interactions.
*/

const achievements = {
  // --- Klick-Meilensteine ---
  first_visit: {
    points: 10,
    description: "Willkommen! Du hast die Seite zum ersten Mal besucht.",
  },
  first_click: {
    points: 5,
    description: "Ein Klick für dich, ein großer Klick für die Menschheit.",
  },
  clicks_10: { points: 10, description: "10 Klicks! Du kommst in Fahrt." },
  clicks_20: { points: 10, description: "20 Klicks! Weiter so." },
  clicks_30: { points: 10, description: "30 Klicks! Ein echter Klicker." },
  clicks_40: { points: 10, description: "40 Klicks! Nicht aufhören." },
  clicks_50: {
    points: 25,
    description: "50 Klicks! Die Hälfte ist geschafft.",
  },
  clicks_60: { points: 15, description: "60 Klicks. Der Finger glüht." },
  clicks_70: { points: 15, description: "70 Klicks. Fast wie ein Pro." },
  clicks_80: { points: 15, description: "80 Klicks. Endspurt." },
  clicks_90: { points: 15, description: "90 Klicks! Fast da." },
  clicks_100: { points: 50, description: "100 Klicks! Klick-Meister!" },
  clicks_150: { points: 75, description: "150 Klicks! Unglaublich!" },
  clicks_200: { points: 100, description: "200 Klicks! Legendär!" },

  // --- Erkundung ---
  clicked_skills: {
    points: 20,
    description: "Du hast deine Skills gezeigt und die Skills-Seite besucht.",
  },
  scrolled_skills_bottom: {
    points: 30,
    description: "Tiefgang bewiesen und Skills bis zum Ende gescannt.",
  },
  clicked_about: {
    points: 15,
    description: "Neugierig? Du hast die About-Seite besucht.",
  },
  clicked_portfolio: {
    points: 20,
    description: "Du hast dir mein Portfolio angesehen.",
  },
  clicked_contact: { points: 15, description: "Kontaktaufnahme gestartet!" },
  visited_shop: { points: 10, description: "Einmal umschauen im Shop." },
  checked_impressum: {
    points: 25,
    description: "Gründlichkeit wird belohnt! Impressum gelesen.",
  },
  found_secret_area: {
    points: 50,
    description: "Du hast den geheimen Bereich gefunden! Respekt.",
  },
  theme_activated: {
    points: 20,
    description: "Neuer Anstrich! Du hast ein Theme aktiviert.",
  },
};

// Namespace to avoid global scope pollution
const game = {
  state: {
    playMode: true,
    points: 0,
    clickCount: 0, // NEW
    achievements: [],
    purchasedItems: [],
    activeItems: [],
  },
  autoclickerInterval: null,
  toggleableItems: ["theme_dark", "theme_neon", "mouse_trail"],
  trailDots: [],
  trailMouse: { x: 0, y: 0 },
  trailAnimationRunning: false,

  init() {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      this.state = JSON.parse(savedState);
      if (!this.state.activeItems) this.state.activeItems = [];
      if (!this.state.achievements) this.state.achievements = [];
      if (!this.state.clickCount) this.state.clickCount = 0; // Ensure clickCount exists
    } else {
      this.addPoints("first_visit");
      this.save();
    }

    document.addEventListener("DOMContentLoaded", () => {
      this.applyActiveEffects();
      this.updatePointsDisplay();
      this.setupAchievements();

      if (document.body.id === "shop-page") {
        this.updateShop();
        // --- FIX: Add reactivation logic back ---
        const reactivateContainer = document.getElementById(
          "reactivate-game-mode-container",
        );
        if (reactivateContainer && !this.state.playMode) {
          reactivateContainer.style.display = "block";
          const reactivateBtn = document.getElementById(
            "reactivate-game-mode-btn",
          );
          if (reactivateBtn) {
            reactivateBtn.addEventListener("click", () =>
              this.setPlayMode(true),
            );
          }
        }
      }

      // Fix: Shop-Link auf der Startseite automatisch korrigieren
      const shopLink = document.getElementById("shop-link");
      if (shopLink && shopLink.getAttribute("href") === "#") {
        shopLink.href = "pages/shop.html";
      }
    });
  },

  save() {
    localStorage.setItem("gameState", JSON.stringify(this.state));
  },

  addPoints(achievementId, repeatable = false) {
    const achievement = achievements[achievementId];
    if (!achievement) return false;

    if (!this.hasAchievement(achievementId) || repeatable) {
      this.state.points += achievement.points;
      this.unlockAchievement(achievementId);

      if (!repeatable) {
        console.log(
          `Awarded ${achievement.points} points for: ${achievementId}. Total: ${this.state.points}`,
        );
        this.showNotification(
          `+${achievement.points} Punkte: ${achievement.description}`,
        );
      }

      this.save();
      this.updatePointsDisplay();
      return true;
    }
    return false;
  },

  spendPoints(amount) {
    if (this.state.points >= amount) {
      this.state.points -= amount;
      this.save();
      this.updatePointsDisplay();
      return true;
    }
    return false;
  },

  getPoints() {
    return this.state.points;
  },

  unlockAchievement(achievementId) {
    if (!this.hasAchievement(achievementId)) {
      this.state.achievements.push(achievementId);
    }
  },

  hasAchievement(achievementId) {
    return this.state.achievements.includes(achievementId);
  },

  buyItem(itemId, cost) {
    if (this.hasPurchased(itemId)) return;

    if (this.spendPoints(cost)) {
      this.state.purchasedItems.push(itemId);
      console.log(`Purchased item: ${itemId}`);

      if (this.toggleableItems.includes(itemId)) {
        this.activateItem(itemId);
      } else {
        this.save();
        this.applyActiveEffects();
      }

      if (document.body.id === "shop-page") this.updateShop();
      return true;
    }
    return false;
  },

  hasPurchased(itemId) {
    return this.state.purchasedItems.includes(itemId);
  },

  isItemActive(itemId) {
    return this.state.activeItems.includes(itemId);
  },

  activateItem(itemId) {
    if (!this.hasPurchased(itemId) || this.isItemActive(itemId)) return;

    if (itemId.startsWith("theme_")) {
      this.state.activeItems = this.state.activeItems.filter(
        (item) => !item.startsWith("theme_"),
      );
      this.addPoints("theme_activated");
    }

    this.state.activeItems.push(itemId);
    this.save();
    this.applyActiveEffects();
    if (document.body.id === "shop-page") this.updateShop();
  },

  deactivateItem(itemId) {
    if (!this.isItemActive(itemId)) return;
    this.state.activeItems = this.state.activeItems.filter(
      (item) => item !== itemId,
    );
    this.save();
    this.applyActiveEffects();
    if (document.body.id === "shop-page") this.updateShop();
  },

  setPlayMode(enabled) {
    this.state.playMode = enabled;
    this.save();
    window.location.reload();
  },

  updatePointsDisplay() {
    document
      .querySelectorAll(".player-points")
      .forEach((d) => (d.textContent = this.state.points));
  },

  // REFACTORED to include new achievements
  setupAchievements() {
    // General click listener
    document.body.addEventListener("click", () => {
      this.state.clickCount++;
      this.addPoints("first_click"); // Awarded only on the first click

      const clicks = this.state.clickCount;
      if (clicks <= 200 && clicks % 10 === 0) {
        this.addPoints(`clicks_${clicks}`);
      }
      this.save();
    });

    const addListener = (selector, id) => {
      const el = document.querySelector(selector);
      if (el)
        el.addEventListener("click", () => this.addPoints(id), { once: true });
    };

    addListener('a[href$="skills.html"]', "clicked_skills");
    addListener('a[href$="about.html"]', "clicked_about");
    addListener('a[href$="portfolio.html"]', "clicked_portfolio");
    addListener('a[href$="contact.html"]', "clicked_contact");
    addListener('a[href$="shop.html"]', "visited_shop");
    addListener('a[href*="impressum.html"]', "checked_impressum");

    if (window.location.pathname.includes("secret.html")) {
      this.addPoints("found_secret_area");
    }

    // Scroll listener for skills page
    if (window.location.pathname.includes("skills.html")) {
      const handleScroll = () => {
        // Verbesserte Scroll-Erkennung
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollPosition >= documentHeight - 50) {
          // 50px Puffer
          if (this.addPoints("scrolled_skills_bottom")) {
            window.removeEventListener("scroll", handleScroll);
          }
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
  },

  updateShop() {
    document.querySelectorAll(".shop-item-card").forEach((item) => {
      const cost = parseInt(item.dataset.cost, 10);
      const itemId = item.dataset.itemId;
      const priceEl = item.querySelector(".item-price");
      const button = item.querySelector("button");

      item.classList.remove("purchased", "cannot-afford", "active");
      button.disabled = false;

      if (this.hasPurchased(itemId)) {
        item.classList.add("purchased");
        priceEl.textContent = "Gekauft"; // Text ändern

        if (this.toggleableItems.includes(itemId)) {
          // Wählbar / Abwählbar Logik
          if (this.isItemActive(itemId)) {
            item.classList.add("active");
            button.textContent = "Abwählen";
            button.onclick = () => this.deactivateItem(itemId);
          } else {
            item.classList.remove("active");
            button.textContent = "Wählen";
            button.onclick = () => this.activateItem(itemId);
          }
        } else if (itemId === "secret_area") {
          // Spezialfall: Geheimer Bereich -> Button führt zur Seite
          button.textContent = "Betreten";
          button.disabled = false;
          button.onclick = () => (window.location.href = "secret.html");
        } else {
          // Passive Items (z.B. Autoclicker)
          button.textContent = "Aktiv";
          button.disabled = true;
        }
      } else {
        priceEl.textContent = `Kosten: ${cost} Punkte`;
        button.textContent = "Kaufen";
        button.onclick = () => this.buyItem(itemId, cost);
        if (cost > this.state.points) {
          item.classList.add("cannot-afford");
          button.disabled = true;
        }
      }
    });
  },

  applyActiveEffects() {
    document.body.classList.remove("theme-dark", "theme-neon");
    if (this.isItemActive("theme_dark"))
      document.body.classList.add("theme-dark");
    else if (this.isItemActive("theme_neon"))
      document.body.classList.add("theme-neon");

    if (this.hasPurchased("autoclicker") && !this.autoclickerInterval) {
      this.autoclickerInterval = setInterval(() => {
        this.state.points += 1;
        this.save();
        this.updatePointsDisplay();
      }, 3000);
    }

    if (
      this.hasPurchased("secret_area") &&
      !document.querySelector('a[href$="secret.html"]')
    ) {
      const path =
        window.location.pathname.endsWith("index.html") ||
        window.location.pathname.endsWith("/")
          ? "pages/secret.html"
          : "secret.html";
      const secretLink = `<li><a href="${path}" class="nav-link">SECRET</a></li>`;
      document
        .querySelectorAll(".nav-links.desktop, .nav-links.mobile")
        .forEach((nav) => nav.insertAdjacentHTML("beforeend", secretLink));
    }

    this.initMouseTrail();
  },

  initMouseTrail() {
    const containerId = "mouse-trail-container";
    let container = document.getElementById(containerId);

    // 1. Container erstellen, wenn er fehlt und benötigt wird
    if (this.isItemActive("mouse_trail") && !container) {
      container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);

      // Dots erstellen
      this.trailDots = [];
      for (let i = 0; i < 12; i++) {
        const dot = document.createElement("div");
        dot.className = "mouse-trail-dot";
        container.appendChild(dot);
        this.trailDots.push({ el: dot, x: 0, y: 0 });
      }

      // Maus-Tracking
      document.addEventListener("mousemove", (e) => {
        this.trailMouse.x = e.clientX;
        this.trailMouse.y = e.clientY;
      });
    }

    // 2. Animation steuern
    if (this.isItemActive("mouse_trail")) {
      if (container) container.style.display = "block";

      if (!this.trailAnimationRunning) {
        this.trailAnimationRunning = true;
        const animate = () => {
          if (!this.isItemActive("mouse_trail")) {
            this.trailAnimationRunning = false;
            if (container) container.style.display = "none";
            return;
          }

          let targetX = this.trailMouse.x;
          let targetY = this.trailMouse.y;

          this.trailDots.forEach((dot, index) => {
            // Weiche Bewegung (Lerp)
            dot.x += (targetX - dot.x) * 0.4;
            dot.y += (targetY - dot.y) * 0.4;

            dot.el.style.transform = `translate(${dot.x}px, ${dot.y}px) scale(${1 - index / 15})`;
            dot.el.style.opacity = 1 - index / 12;

            targetX = dot.x;
            targetY = dot.y;
          });
          requestAnimationFrame(animate);
        };
        animate();
      }
    } else {
      if (container) container.style.display = "none";
    }
  },

  showNotification(message) {
    let notification = document.createElement("div");
    notification.className = "game-notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },

  resetGame() {
    if (this.autoclickerInterval) {
      clearInterval(this.autoclickerInterval);
      this.autoclickerInterval = null;
    }
    localStorage.removeItem("gameState");
    window.location.reload();
  },
};

game.init();

// Initialize the game on script load
game.init();
