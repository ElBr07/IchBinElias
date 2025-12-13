// contact-render.js
// Lädt data/contact.json, rendert Kontaktdaten und erzeugt QR + vCard Download
(async function () {
    const jsonPath = "../data/contact.json";

    // --- GAME STATE LOGIC ---
    // Minimal version of gameState loading, assuming script.js handles the main logic
    function getGameState() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (savedState) {
                return JSON.parse(savedState);
            }
        } catch (e) {
            console.error("Failed to load game state from localStorage", e);
        }
        // Default to a state where nothing is unlocked in playful mode
        return { playfulMode: null, unlocks: { contact: false } };
    }

    const gameState = getGameState();
    // Contact info is shown if not in playful mode OR if the contact item is unlocked
    const showContactInfo = !gameState.playfulMode || gameState.unlocks.contact;


    function el(tag, cls) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        return e;
    }
    
    function createLockedPlaceholder() {
        const span = el("span", "locked-placeholder");
        const link = el("a");
        link.href = "../index.html#shop-modal"; // Link back to the main page's shop
        link.textContent = "Im Shop freischalten";
        span.appendChild(link);
        return span;
    }


    function createRow(fieldKey, label, contentNode) {
        const row = el("div", "contact-row");
        const icon = el("span", "icon-placeholder");
        icon.setAttribute("data-field", fieldKey);
        row.appendChild(icon);
        const labelNode = el("strong");
        labelNode.textContent = label + ":\u00A0";
        row.appendChild(labelNode);
        if (contentNode) row.appendChild(contentNode);
        return row;
    }

    function makeLink(href, text) {
        const a = el("a");
        a.href = href;
        a.textContent = text || href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        return a;
    }

    function buildAddress(data) {
        const parts = [];
        if (data.street) parts.push(data.street);
        const cityLine = [data.postalCode, data.city].filter(Boolean).join(" ");
        if (cityLine) parts.push(cityLine);
        const region = [data.region, data.country].filter(Boolean).join(", ");
        if (region) parts.push(region);
        return parts.join(", ");
    }

    function buildVCard(d) {
        const lines = [];
        lines.push("BEGIN:VCARD");
        lines.push("VERSION:3.0");
        const n = [d.familyName || "", d.givenName || ""].join(";");
        lines.push(`N:${n}`);
        lines.push(`FN:${d.fullName || ""}`);
        if (d.jobTitle) lines.push(`TITLE:${d.jobTitle}`);
        if (d.company) lines.push(`ORG:${d.company}`);
        if (showContactInfo && d.phone) lines.push(`TEL;TYPE=WORK,VOICE:${d.phone}`);
        if (showContactInfo && d.mobile) lines.push(`TEL;TYPE=CELL:${d.mobile}`);
        if (showContactInfo && d.email) lines.push(`EMAIL;TYPE=INTERNET:${d.email}`);
        if (d.website) lines.push(`URL:${d.website}`);
        const adrParts = [
            "",
            "",
            d.street || "",
            d.city || "",
            d.region || "",
            d.postalCode || "",
            d.country || "",
        ];
        if (d.street || d.city || d.region || d.postalCode || d.country) {
            lines.push(`ADR;TYPE=WORK:${adrParts.join(";")}`);
        }
        if (d.notes) lines.push(`NOTE:${d.notes}`);
        lines.push("END:VCARD");
        return lines.join("\n");
    }

    // Replace each .icon-placeholder with an <img> referencing ../assets/icons/{field}.svg
    function injectIcons() {
        const placeholders = document.querySelectorAll(".icon-placeholder");
        placeholders.forEach((ph) => {
            const field = ph.dataset.field || "default";
            const img = el("img", "contact-icon");
            img.alt = field + " icon";
            img.src = `../assets/icons/contact_icons/${field}.svg`;
            // Fallback to default icon if file missing
            img.addEventListener("error", () => {
                img.src = "../assets/icons/default.svg";
            });
            ph.parentNode.insertBefore(img, ph);
            ph.remove();
        });
    }

    try {
        const res = await fetch(jsonPath, { cache: "no-store" });
        if (!res.ok)
            throw new Error(res.statusText || "Fehler beim Laden der JSON");
        const data = await res.json();

        const details = document.getElementById("contact-details");
        details.innerHTML = "";

        // Name
        if (data.fullName) {
            const nameNode = el("div");
            nameNode.className = "contact-name";
            nameNode.textContent =
                data.fullName + (data.jobTitle ? " — " + data.jobTitle : "");
            details.appendChild(nameNode);
        }

        // Company / Rolle
        if (data.company) {
            const span = el("span");
            span.textContent = data.company;
            details.appendChild(createRow("company", "Firma", span));
        }

        // Address - Potentially sensitive, let's lock it
        const address = buildAddress(data);
        if (address) {
            const content = showContactInfo ? el("span") : createLockedPlaceholder();
            if(showContactInfo) content.textContent = address;
            details.appendChild(createRow("address", "Adresse", content));
        }

        // Phone
        if (data.phone) {
            const content = showContactInfo ? makeLink("tel:" + data.phone.replace(/\s+/g, ""), data.phone) : createLockedPlaceholder();
            details.appendChild(createRow("phone", "Telefon", content));
        }
        if (data.mobile) {
            const content = showContactInfo ? makeLink("tel:" + data.mobile.replace(/\s+/g, ""), data.mobile) : createLockedPlaceholder();
            details.appendChild(createRow("mobile", "Mobil", content));
        }

        // Email - Link copies to clipboard
        if (data.email) {
            let content;
            if (showContactInfo) {
                const span = el("span", "copy-link");
                span.textContent = data.email;
                span.style.cursor = "pointer";
                span.style.textDecoration = "underline";
                span.title = "Klicken zum Kopieren";
                span.addEventListener("click", () => {
                    navigator.clipboard.writeText(data.email).then(() => {
                        const originalText = span.textContent;
                        span.textContent = "Kopiert!";
                        setTimeout(() => span.textContent = originalText, 1500);
                    });
                });
                content = span;
            } else {
                content = createLockedPlaceholder();
            }
            details.appendChild(createRow("email", "E‑Mail", content));
        }

        // --- Public information - always shown ---
        if (data.website)
            details.appendChild(
                createRow("website", "Web", makeLink(data.website, data.website))
            );
        if (data.linkedin)
            details.appendChild(
                createRow("linkedin", "LinkedIn", makeLink(data.linkedin, "LinkedIn"))
            );
        if (data.github)
            details.appendChild(
                createRow("github", "GitHub", makeLink(data.github, "GitHub"))
            );
        // Portfolio link visibility is handled by script.js, but we can show it here
        if (data.portfolio)
            details.appendChild(
                createRow(
                    "portfolio",
                    "Portfolio",
                    makeLink(data.portfolio, "Portfolio")
                )
            );
        if (data.resumeUrl)
            details.appendChild(
                createRow(
                    "resume",
                    "Lebenslauf",
                    makeLink(data.resumeUrl, "Lebenslauf")
                )
            );

        if (data.desiredRole) {
            const span = el("span");
            span.textContent = data.desiredRole;
            details.appendChild(createRow("role", "Gesuchte Rolle", span));
        }
        if (data.availability) {
            const span = el("span");
            span.textContent = data.availability;
            details.appendChild(createRow("availability", "Verfügbarkeit", span));
        }
        if (data.languages && Array.isArray(data.languages)) {
            const span = el("span");
            span.textContent = data.languages.join(", ");
            details.appendChild(createRow("languages", "Sprachen", span));
        }
        if (data.notes) {
            const span = el("span");
            span.textContent = data.notes;
            details.appendChild(createRow("notes", "Notiz", span));
        }
        // --- End of public information ---


        injectIcons();

        // Build vCard and QR, only with unlocked info
        const vcard = buildVCard(data);
        const qrImg = document.getElementById("contact-qr");
        const encoded = encodeURIComponent(vcard);
        const qrUrl = ''//`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encoded}&choe=UTF-8`;
        qrImg.src = qrUrl;

        // vCard Download
        const vcardBlob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
        const vcardUrl = URL.createObjectURL(vcardBlob);
        const downloadLink = document.getElementById("download-vcard");
        if (data.fullName)
            downloadLink.setAttribute(
                "download",
                `${data.fullName.replace(/\s+/g, "_")}.vcf`
            );
        downloadLink.href = vcardUrl;

        // Send email button: toggle via CSS class and game state
        const sendBtn = document.getElementById("send-email");
        if (data.email && sendBtn) {
            if (showContactInfo) {
                sendBtn.classList.remove("hidden");
                sendBtn.addEventListener("click", () => {
                    window.location.href = "mailto:" + data.email;
                });
            } else {
                 sendBtn.classList.add("hidden");
            }
        }
        
        qrImg.alt = "QR Code mit Kontaktdaten von " + (data.fullName || "Kontakt");
    } catch (err) {
        const details = document.getElementById("contact-details");
        details.innerHTML =
            '<p class="error">Kontaktdaten konnten nicht geladen werden. Bitte prüfe die Datei <code>data/contact.json</code>.</p>';
        console.error("Fehler beim Laden der Kontakt‑Daten:", err);
    }
})();