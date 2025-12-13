/*==================================================================
   script.js – Gesamte Interaktivität
   1️⃣ Game‑Mode (Ja / Nein) – LocalStorage
   2️⃣ Mobile‑Menu (Hamburger‑Button) – öffnen / schließen
   3️⃣ Mobile‑Menu schließen, wenn ein Link angeklickt wird
   4️⃣ Aktiven Nav‑Link markieren (Desktop + Mobile)
===================================================================*/

document.addEventListener("DOMContentLoaded", () => {
  /*----------------------------------------------------------------
    1️⃣ Game‑Mode (Ja / Nein) – LocalStorage
  ----------------------------------------------------------------*/
  const yesBtn = document.getElementById("yes-btn");
  const noBtn = document.getElementById("no-btn");
  const modeChoice = document.getElementById("mode-choice");
  const infoSection = document.getElementById("info");
  const shopLink = document.getElementById("shop-link");
  const pointsSpan = document.getElementById("points");

  const setMode = (playful) => {
    localStorage.setItem("playfulMode", playful ? "true" : "false");
    if (!localStorage.getItem("points")) localStorage.setItem("points", "0");
    updateUI();
  };

  const getMode = () => localStorage.getItem("playfulMode") === "true";
  const getPoints = () => parseInt(localStorage.getItem("points") || "0", 10);

  const updateUI = () => {
    const playful = getMode();

    // Shop‑Link nur im spielerischen Modus sichtbar
    if (shopLink) shopLink.style.display = playful ? "inline-block" : "none";

    // Punkte‑Anzeige aktualisieren
    if (pointsSpan) pointsSpan.textContent = getPoints();

    // Auswahl‑Bereich ausblenden, Info‑Bereich zeigen
    if (modeChoice) modeChoice.classList.add("hidden");
    if (infoSection) infoSection.classList.remove("hidden");
  };

  if (yesBtn) yesBtn.addEventListener("click", () => setMode(true));
  if (noBtn) noBtn.addEventListener("click", () => setMode(false));

  // Beim Laden prüfen, ob bereits ein Modus gewählt wurde
  if (localStorage.getItem("playfulMode") !== null) updateUI();

  /*----------------------------------------------------------------
    2️⃣ Mobile‑Menu (Hamburger‑Button) – öffnen / schließen
  ----------------------------------------------------------------*/
  const navToggle = document.querySelector(".nav-toggle"); // Button
  const mobileMenu = document.querySelector(".nav-links.mobile"); // Panel

  if (navToggle && mobileMenu) {
    // Klick auf den Hamburger‑Button
    navToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open"); // Panel sichtbar?
      navToggle.classList.toggle("open", isOpen); // Icon‑Wechsel (menu ↔ arrow_drop_down)
      // Wenn ein <img class="nav-icon"> vorhanden ist, wechsle dessen src
      const iconImg = navToggle.querySelector(".nav-icon");
      if (iconImg) {
        const menuSrc =
          iconImg.getAttribute("data-menu-src") || iconImg.getAttribute("src");
        const closeSrc = iconImg.getAttribute("data-close-src") || menuSrc;
        iconImg.setAttribute("src", isOpen ? closeSrc : menuSrc);
      }
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Schließe das Mobile‑Panel, wenn ein Link darin geklickt wird
    const mobileLinks = mobileMenu.querySelectorAll(".nav-link");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /*----------------------------------------------------------------
    3️⃣ Aktiven Nav‑Link markieren (Desktop + Mobile)
  ----------------------------------------------------------------*/
  const currentPath = window.location.pathname;
  const allNavLinks = document.querySelectorAll(".nav-link");

  allNavLinks.forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;

    if (
      linkPath === currentPath ||
      (linkPath.endsWith("/") && currentPath.startsWith(linkPath))
    ) {
      link.classList.add("active");
    }
  });
});
