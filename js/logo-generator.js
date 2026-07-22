/**
 * Automated SVG logo generator for Freemium Builder.
 * Builds clean logo layouts from business name + brand color.
 */
(function (global) {
  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function initialsFromName(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "D";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function shortName(name) {
    const cleaned = String(name || "Mon Commerce").trim() || "Mon Commerce";
    return cleaned.length > 22 ? cleaned.slice(0, 20) + "…" : cleaned;
  }

  function svgToDataUrl(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function layoutMonogram(name, color, bg) {
    const initials = escapeXml(initialsFromName(name));
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" role="img" aria-label="${label}">
  <rect width="360" height="120" rx="20" fill="${bg}"/>
  <circle cx="60" cy="60" r="36" fill="${color}"/>
  <text x="60" y="68" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="28" font-weight="800" fill="#07111f">${initials}</text>
  <text x="118" y="68" font-family="Manrope, Arial, sans-serif" font-size="26" font-weight="800" fill="#f8fbff">${label}</text>
</svg>`.trim();
  }

  function layoutWordmark(name, color, bg) {
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" role="img" aria-label="${label}">
  <rect width="360" height="120" rx="20" fill="${bg}"/>
  <rect x="24" y="48" width="42" height="8" rx="4" fill="${color}"/>
  <text x="24" y="88" font-family="Manrope, Arial, sans-serif" font-size="30" font-weight="800" fill="#f8fbff">${label}</text>
</svg>`.trim();
  }

  function layoutBadge(name, color, bg) {
    const initials = escapeXml(initialsFromName(name));
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" role="img" aria-label="${label}">
  <rect width="360" height="120" rx="20" fill="${bg}"/>
  <rect x="22" y="22" width="76" height="76" rx="18" fill="${color}"/>
  <text x="60" y="70" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="28" font-weight="800" fill="#07111f">${initials}</text>
  <text x="118" y="58" font-family="Manrope, Arial, sans-serif" font-size="22" font-weight="800" fill="#f8fbff">${label}</text>
  <text x="118" y="84" font-family="DM Sans, Arial, sans-serif" font-size="13" font-weight="600" fill="${color}">LOGO PRO</text>
</svg>`.trim();
  }

  function layoutStacked(name, color, bg) {
    const label = escapeXml(shortName(name));
    const top = escapeXml(String(name || "Commerce").trim().split(/\s+/)[0] || "Commerce");
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" role="img" aria-label="${label}">
  <rect width="360" height="120" rx="20" fill="${bg}"/>
  <text x="180" y="52" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${color}">${top.toUpperCase()}</text>
  <text x="180" y="86" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="26" font-weight="800" fill="#f8fbff">${label}</text>
</svg>`.trim();
  }

  function layoutGeometric(name, color, bg) {
    const initials = escapeXml(initialsFromName(name));
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" role="img" aria-label="${label}">
  <rect width="360" height="120" rx="20" fill="${bg}"/>
  <polygon points="28,88 60,28 92,88" fill="${color}"/>
  <circle cx="60" cy="70" r="14" fill="${bg}"/>
  <text x="60" y="75" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="12" font-weight="800" fill="${color}">${initials.slice(0, 1)}</text>
  <text x="118" y="68" font-family="Manrope, Arial, sans-serif" font-size="26" font-weight="800" fill="#f8fbff">${label}</text>
</svg>`.trim();
  }

  const LAYOUTS = [
    { id: "monogram", label: "Monogramme", build: layoutMonogram },
    { id: "wordmark", label: "Wordmark", build: layoutWordmark },
    { id: "badge", label: "Badge", build: layoutBadge },
    { id: "stacked", label: "Empilé", build: layoutStacked },
    { id: "geometric", label: "Géo", build: layoutGeometric }
  ];

  function generateLogoSet(businessName, primaryColor, backgroundColor) {
    const name = businessName && businessName.trim() ? businessName.trim() : "Mon Commerce";
    const color = primaryColor || "#3d8bfd";
    const bg = backgroundColor || "#0d1b2d";
    return LAYOUTS.map((layout) => {
      const svg = layout.build(name, color, bg);
      return {
        id: layout.id,
        label: layout.label,
        svg,
        dataUrl: svgToDataUrl(svg)
      };
    });
  }

  /**
   * Optional raster export for publication payloads.
   */
  function svgDataUrlToPngDataUrl(svgDataUrl, size) {
    size = size || 512;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, size, size);
          const ratio = Math.min(size / image.width, size / image.height);
          const w = image.width * ratio;
          const h = image.height * ratio;
          ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      image.onerror = function () {
        reject(new Error("Conversion PNG impossible"));
      };
      image.src = svgDataUrl;
    });
  }

  global.DerraLogoGenerator = {
    LAYOUTS,
    generateLogoSet,
    svgToDataUrl,
    svgDataUrlToPngDataUrl,
    initialsFromName
  };
})(window);
