/* --------------------------------------------------------------
   loadVersion.js – zentrale Versions‑Steuerung
   --------------------------------------------------------------
   Was das Skript macht:
   1. Lädt /version.json (absoluter Pfad → immer aus dem Projekt‑Root)
   2. Hängt ?v=YYYY‑MM‑DD‑N an alle internen CSS‑, JS‑ und HTML‑Links an.
   3. Ignoriert externe Links (http://, https://, //, mailto: …)
   -------------------------------------------------------------- */
(() => {
  // ------------------------------------------------------------
  // 1️⃣ Version aus version.json holen (Cache‑bypass, damit wir immer die aktuelle Datei sehen)
  // ------------------------------------------------------------
  fetch("/version.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        // Wenn die Datei nicht gefunden wird, werfen wir einen Fehler – das wird im catch‑Block behandelt.
        throw new Error(
          `Version‑Datei nicht erreichbar (Status ${response.status})`
        );
      }
      return response.json(); // Erwartet gültiges JSON
    })
    .then((data) => {
      const version = data.v; // z. B. "2025-11-22-1"
      if (!version) return; // Keine Version → nichts tun

      // ------------------------------------------------------------
      // 2️⃣ CSS‑Links aktualisieren (nur interne Stylesheets)
      //     Externe URLs (z. B. https://fonts.googleapis.com/...) werden ignoriert
      // ------------------------------------------------------------
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href.includes("?v=")) return;

        // Externe URLs erkennen (Scheme like http:, https: oder protocol‑relative //)
        const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\\\/\\\/)/i.test(href);
        if (isExternal) return; // nicht an externe Ressourcen hängen

        link.setAttribute("href", `${href}?v=${version}`);
      });

      // ------------------------------------------------------------
      // 3️⃣ Script‑Tags aktualisieren (außer diesem Loader selbst)
      //     Nur auf interne Skripte anwenden; externe Skripte überspringen
      // ------------------------------------------------------------
      document.querySelectorAll("script[src]").forEach((script) => {
        // nicht diesen Loader neu versehen
        if (script.src && script.src.includes("loadVersion.js")) return;

        const src = script.getAttribute("src");
        if (!src || src.includes("?v=")) return;

        const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\\\/\\\/)/i.test(src);
        if (isExternal) return; // externe Skripte nicht verändern

        script.setAttribute("src", `${src}?v=${version}`);
      });

      // ------------------------------------------------------------
      // 4️⃣ Interne HTML‑Links (Navigation) aktualisieren
      // ------------------------------------------------------------
      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");

        // 4.1 Ignoriere externe URLs (http://, https://, //, mailto:, tel: …)
        const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
        if (isExternal) return;

        // 4.2 Nur HTML‑Seiten oder reine Pfade (ohne Dateiendung) behandeln
        const looksLikeHtml = href.endsWith(".html") || !href.includes(".");
        if (!looksLikeHtml) return;

        // 4.3 Wenn bereits ein Query‑String existiert, hänge &v=… an, sonst ?v=…
        if (!href.includes("?v=")) {
          const separator = href.includes("?") ? "&" : "?";
          a.setAttribute("href", `${href}${separator}v=${version}`);
        }
      });
    })
    .catch((err) => {
      // ------------------------------------------------------------
      // 5️⃣ Fehler‑Handling – im Entwicklungsmodus einfach in die Konsole schreiben
      // ------------------------------------------------------------
      console.warn("⚠️ Versions‑Datei konnte nicht geladen werden:", err);
      // Wenn die Version nicht geladen werden kann, wird das Skript stillschweigend beendet.
    });
})();
