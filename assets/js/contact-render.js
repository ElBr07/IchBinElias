// contact-render.js
// Lädt data/contact.json, rendert Kontaktdaten und erzeugt QR + vCard Download
(async function () {
  const jsonPath = "../data/contact.json";

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
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
    if (d.phone) lines.push(`TEL;TYPE=WORK,VOICE:${d.phone}`);
    if (d.mobile) lines.push(`TEL;TYPE=CELL:${d.mobile}`);
    if (d.email) lines.push(`EMAIL;TYPE=INTERNET:${d.email}`);
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

    // Address
    const address = buildAddress(data);
    if (address) {
      const span = el("span");
      span.textContent = address;
      details.appendChild(createRow("address", "Adresse", span));
    }

    // Phone
    if (data.phone) {
      const a = makeLink("tel:" + data.phone.replace(/\s+/g, ""), data.phone);
      details.appendChild(createRow("phone", "Telefon", a));
    }
    if (data.mobile) {
      const a = makeLink("tel:" + data.mobile.replace(/\s+/g, ""), data.mobile);
      details.appendChild(createRow("mobile", "Mobil", a));
    }

    // Email - Link copies to clipboard
    if (data.email) {
      // Create a span that looks like a link or just a clickable element
      const span = el("span", "copy-link"); // You might need to add CSS for .copy-link to look like a link if desired, or reuse 'a' tag with preventDefault
      span.textContent = data.email;
      span.style.cursor = "pointer";
      span.style.textDecoration = "underline";
      span.title = "Klicken zum Kopieren";
      
      span.addEventListener("click", () => {
        navigator.clipboard.writeText(data.email).then(() => {
           // Visual feedback could be improved, but simple alert or text change for now
           const originalText = span.textContent;
           span.textContent = "Kopiert!";
           setTimeout(() => span.textContent = originalText, 1500);
        });
      });
      
      details.appendChild(createRow("email", "E‑Mail", span));
    }

    // Website & Links
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

    // Inject icons now that rows are present
    injectIcons();

    // Build vCard and QR
    const vcard = buildVCard(data);
    const qrImg = document.getElementById("contact-qr");
    const encoded = encodeURIComponent(vcard);
    // Use Google Charts API to render QR. (Internet erforderlich). Falls offline: lokale QR Bibliothek einsetzen.
    const qrUrl = ''//`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encoded}&choe=UTF-8`;
    qrImg.src = qrUrl;

    // vCard Download
    const vcardBlob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const vcardUrl = URL.createObjectURL(vcardBlob);
    const downloadLink = document.getElementById("download-vcard");
    // set filename to include full name if present
    if (data.fullName)
      downloadLink.setAttribute(
        "download",
        `${data.fullName.replace(/\s+/g, "_")}.vcf`
      );
    downloadLink.href = vcardUrl;

    // Send email button: toggle via CSS class
    const sendBtn = document.getElementById("send-email");
    if (data.email && sendBtn) {
      sendBtn.classList.remove("hidden");
      sendBtn.addEventListener("click", () => {
        window.location.href = "mailto:" + data.email;
      });
    }

    // Accessibility: add alt text
    qrImg.alt = "QR Code mit Kontaktdaten von " + (data.fullName || "Kontakt");
  } catch (err) {
    const details = document.getElementById("contact-details");
    details.innerHTML =
      '<p class="error">Kontaktdaten konnten nicht geladen werden. Bitte prüfe die Datei <code>data/contact.json</code>.</p>';
    console.error("Fehler beim Laden der Kontakt‑Daten:", err);
  }
})();
