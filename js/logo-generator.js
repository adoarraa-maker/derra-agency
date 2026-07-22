/**
 * Professional automated SVG logo generator.
 * Industry Lucide-style icons + 5 premium layout systems.
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

  function shortName(name) {
    const cleaned = String(name || "Mon Commerce").trim() || "Mon Commerce";
    return cleaned.length > 20 ? cleaned.slice(0, 18) + "…" : cleaned;
  }

  function splitName(name) {
    const parts = String(name || "Mon Commerce").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { primary: "Mon", secondary: "Commerce" };
    if (parts.length === 1) return { primary: parts[0], secondary: "STUDIO" };
    return { primary: parts[0], secondary: parts.slice(1).join(" ") };
  }

  function svgToDataUrl(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function hexToRgb(hex) {
    const h = String(hex || "#3d8bfd").replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function mix(hex, target, amount) {
    const a = hexToRgb(hex);
    const b = hexToRgb(target);
    return rgbToHex(
      a.r + (b.r - a.r) * amount,
      a.g + (b.g - a.g) * amount,
      a.b + (b.b - a.b) * amount
    );
  }

  function palette(primary, bg) {
    return {
      primary,
      soft: mix(primary, "#ffffff", 0.35),
      deep: mix(primary, "#000000", 0.35),
      glow: mix(primary, "#ffffff", 0.55),
      ink: mix(bg, "#000000", 0.2),
      paper: "#f8fbff",
      muted: mix(primary, "#9aa9bc", 0.45)
    };
  }

  /** Lucide-inspired 24x24 icon paths */
  const ICONS = {
    scissors: {
      label: "Ciseaux",
      paths: [
        '<circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
        '<circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
        '<path d="M20 4L8.12 15.88" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M14.47 14.48L20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M8.12 8.12L12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    },
    utensils: {
      label: "Restaurant",
      paths: [
        '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M7 2v20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]
    },
    coffee: {
      label: "Café",
      paths: [
        '<path d="M10 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M14 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        '<path d="M6 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    },
    shirt: {
      label: "Textile",
      paths: [
        '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
      ]
    },
    store: {
      label: "Commerce",
      paths: [
        '<path d="M3 9l.5-3h17l.5 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        '<path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" fill="none" stroke="currentColor" stroke-width="2"/>',
        '<path d="M9 22V12h6v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
      ]
    },
    tag: {
      label: "Étiquette",
      paths: [
        '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        '<circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>'
      ]
    },
    wrench: {
      label: "Outils",
      paths: [
        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]
    },
    crown: {
      label: "Couronne",
      paths: [
        '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        '<path d="M5 21h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    },
    sparkles: {
      label: "Éclat",
      paths: [
        '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        '<path d="M20 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M22 5h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    },
    shield: {
      label: "Bouclier",
      paths: [
        '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
      ]
    },
    layers: {
      label: "Layers",
      paths: [
        '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        '<path d="M2 12.2l8.58 3.91a2 2 0 0 0 1.66 0L21 12.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M2 17.2l8.58 3.91a2 2 0 0 0 1.66 0L21 17.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    },
    hexagon: {
      label: "Hexagone",
      paths: [
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
      ]
    },
    wave: {
      label: "Vague",
      paths: [
        '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        '<path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      ]
    }
  };

  const CATEGORY_ICONS = {
    salon: ["scissors", "sparkles"],
    restaurant: ["utensils", "coffee"],
    tobacco: ["store", "tag"],
    artisan: ["wrench", "layers"],
    textile: ["shirt", "scissors"],
    mechanic: ["wrench", "hexagon"],
    default: ["crown", "sparkles", "shield", "layers", "wave"]
  };

  function resolveCategory(category) {
    const key = String(category || "").toLowerCase();
    if (CATEGORY_ICONS[key]) return key;
    if (key.includes("coiff") || key.includes("beaut") || key.includes("salon")) return "salon";
    if (key.includes("restau") || key.includes("café") || key.includes("cafe")) return "restaurant";
    if (key.includes("textile") || key.includes("mode") || key.includes("couture")) return "textile";
    if (key.includes("mécano") || key.includes("mecano") || key.includes("garage")) return "mechanic";
    if (key.includes("tabac") || key.includes("press") || key.includes("boutique")) return "tobacco";
    if (key.includes("artisan") || key.includes("métier")) return "artisan";
    return "default";
  }

  function iconMarkup(iconId, color, x, y, size) {
    const icon = ICONS[iconId] || ICONS.sparkles;
    const scale = size / 24;
    return `
      <g transform="translate(${x} ${y}) scale(${scale})" color="${color}">
        ${icon.paths.join("")}
      </g>`;
  }

  function defs(colors, uid) {
    return `
  <defs>
    <linearGradient id="gradA-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.soft}"/>
      <stop offset="55%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.deep}"/>
    </linearGradient>
    <linearGradient id="gradB-${uid}" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.deep}"/>
      <stop offset="100%" stop-color="${colors.glow}"/>
    </linearGradient>
    <radialGradient id="glow-${uid}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${colors.glow}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${colors.ink}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
  }

  /** 1. Icon + Modern Sans (Clean & Tech) */
  function layoutCleanTech(ctx) {
    const { name, colors, iconId, uid, subtitle } = ctx;
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" role="img" aria-label="${label}">
  ${defs(colors, uid)}
  <rect width="420" height="140" rx="24" fill="${colors.ink}"/>
  <circle cx="70" cy="70" r="46" fill="url(#glow-${uid})"/>
  <rect x="28" y="28" width="84" height="84" rx="22" fill="url(#gradA-${uid})"/>
  <rect x="34" y="34" width="72" height="72" rx="18" fill="${colors.ink}" opacity="0.22"/>
  ${iconMarkup(iconId, colors.paper, 46, 46, 48)}
  <text x="140" y="66" font-family="Manrope, Arial, sans-serif" font-size="30" font-weight="800" fill="${colors.paper}">${label}</text>
  <text x="140" y="96" font-family="DM Sans, Arial, sans-serif" font-size="13" font-weight="600" letter-spacing="2.2" fill="${colors.soft}">${escapeXml(subtitle.toUpperCase())}</text>
  <rect x="140" y="108" width="48" height="4" rx="2" fill="${colors.primary}"/>
</svg>`.trim();
  }

  /** 2. Elegant Frame / Crest (Luxury) */
  function layoutLuxuryCrest(ctx) {
    const { name, colors, iconId, uid } = ctx;
    const parts = splitName(name);
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" role="img" aria-label="${escapeXml(shortName(name))}">
  ${defs(colors, uid)}
  <rect width="420" height="140" rx="18" fill="${colors.ink}"/>
  <rect x="18" y="18" width="384" height="104" rx="14" fill="none" stroke="url(#gradA-${uid})" stroke-width="1.5"/>
  <rect x="28" y="28" width="364" height="84" rx="10" fill="none" stroke="${colors.soft}" stroke-opacity="0.35" stroke-width="1"/>
  <circle cx="78" cy="70" r="30" fill="url(#gradB-${uid})"/>
  ${iconMarkup(iconId, colors.ink, 60, 52, 36)}
  <text x="128" y="64" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" fill="${colors.paper}">${escapeXml(parts.primary)}</text>
  <text x="128" y="92" font-family="DM Sans, Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="3.5" fill="${colors.soft}">${escapeXml(parts.secondary.toUpperCase())}</text>
  <path d="M330 48h52M356 48v44M330 92h52" stroke="${colors.primary}" stroke-width="1.5" opacity="0.85"/>
</svg>`.trim();
  }

  /** 3. Badge / Emblem with subtitle (Craft) */
  function layoutCraftBadge(ctx) {
    const { name, colors, iconId, uid, subtitle } = ctx;
    const label = escapeXml(shortName(name));
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" role="img" aria-label="${label}">
  ${defs(colors, uid)}
  <rect width="420" height="140" rx="22" fill="${colors.ink}"/>
  <path d="M70 22l34 14 34-14 8 42-42 40-42-40z" fill="url(#gradA-${uid})"/>
  <path d="M70 30l26 11 26-11 6 32-32 30-32-30z" fill="${colors.ink}" opacity="0.25"/>
  ${iconMarkup(iconId, colors.paper, 56, 42, 34)}
  <text x="150" y="62" font-family="Manrope, Arial, sans-serif" font-size="27" font-weight="800" fill="${colors.paper}">${label}</text>
  <rect x="150" y="74" width="160" height="28" rx="14" fill="${colors.primary}" opacity="0.18"/>
  <text x="166" y="93" font-family="DM Sans, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="1.8" fill="${colors.soft}">${escapeXml(subtitle.toUpperCase())}</text>
</svg>`.trim();
  }

  /** 4. Minimal Abstract Geometry + Serif (Modern Chic) */
  function layoutModernChic(ctx) {
    const { name, colors, iconId, uid } = ctx;
    const parts = splitName(name);
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" role="img" aria-label="${escapeXml(shortName(name))}">
  ${defs(colors, uid)}
  <rect width="420" height="140" rx="16" fill="${colors.ink}"/>
  <polygon points="36,110 70,28 104,110" fill="url(#gradA-${uid})" opacity="0.95"/>
  <polygon points="56,110 70,52 84,110" fill="${colors.ink}" opacity="0.35"/>
  <circle cx="70" cy="86" r="16" fill="${colors.soft}" opacity="0.9"/>
  ${iconMarkup(iconId, colors.ink, 58, 74, 24)}
  <text x="132" y="68" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-style="italic" fill="${colors.paper}">${escapeXml(parts.primary)}</text>
  <text x="132" y="98" font-family="DM Sans, Arial, sans-serif" font-size="13" font-weight="500" letter-spacing="4" fill="${colors.muted}">${escapeXml(parts.secondary.toUpperCase())}</text>
  <circle cx="372" cy="42" r="8" fill="${colors.primary}"/>
  <circle cx="390" cy="58" r="4" fill="${colors.soft}"/>
</svg>`.trim();
  }

  /** 5. Bold Dynamic Icon + Stacked Text (Corporate) */
  function layoutCorporateStrong(ctx) {
    const { name, colors, iconId, uid, subtitle } = ctx;
    const parts = splitName(name);
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" role="img" aria-label="${escapeXml(shortName(name))}">
  ${defs(colors, uid)}
  <rect width="420" height="140" rx="20" fill="${colors.ink}"/>
  <rect x="0" y="0" width="118" height="140" fill="url(#gradB-${uid})"/>
  <rect x="0" y="0" width="118" height="140" fill="url(#glow-${uid})"/>
  ${iconMarkup(iconId, colors.paper, 35, 46, 48)}
  <text x="146" y="58" font-family="Manrope, Arial, sans-serif" font-size="16" font-weight="800" letter-spacing="3.5" fill="${colors.soft}">${escapeXml(parts.primary.toUpperCase())}</text>
  <text x="146" y="92" font-family="Manrope, Arial, sans-serif" font-size="30" font-weight="800" fill="${colors.paper}">${escapeXml(parts.secondary)}</text>
  <text x="146" y="116" font-family="DM Sans, Arial, sans-serif" font-size="11" font-weight="600" letter-spacing="2" fill="${colors.muted}">${escapeXml(subtitle.toUpperCase())}</text>
</svg>`.trim();
  }

  const LAYOUTS = [
    { id: "clean-tech", label: "Clean & Tech", build: layoutCleanTech },
    { id: "luxury-crest", label: "Luxe / Crest", build: layoutLuxuryCrest },
    { id: "craft-badge", label: "Badge Craft", build: layoutCraftBadge },
    { id: "modern-chic", label: "Modern Chic", build: layoutModernChic },
    { id: "corporate", label: "Corporate", build: layoutCorporateStrong }
  ];

  const CATEGORY_SUBTITLES = {
    salon: "Beauty Studio",
    restaurant: "Food & Hospitality",
    tobacco: "Local Commerce",
    artisan: "Craft & Trade",
    textile: "Fashion Atelier",
    mechanic: "Pro Services",
    default: "Brand Identity"
  };

  function generateLogoSet(businessName, primaryColor, backgroundColor, category) {
    const name = businessName && businessName.trim() ? businessName.trim() : "Mon Commerce";
    const cat = resolveCategory(category);
    const icons = CATEGORY_ICONS[cat] || CATEGORY_ICONS.default;
    const colors = palette(primaryColor || "#3d8bfd", backgroundColor || "#0d1b2d");
    const subtitle = CATEGORY_SUBTITLES[cat] || CATEGORY_SUBTITLES.default;

    return LAYOUTS.map((layout, index) => {
      const iconId = icons[index % icons.length];
      const uid = layout.id + "-" + Math.random().toString(36).slice(2, 7);
      const svg = layout.build({
        name,
        colors,
        iconId,
        uid,
        subtitle,
        category: cat
      });
      return {
        id: layout.id,
        label: layout.label,
        icon: (ICONS[iconId] && ICONS[iconId].label) || iconId,
        category: cat,
        svg,
        dataUrl: svgToDataUrl(svg)
      };
    });
  }

  function svgDataUrlToPngDataUrl(svgDataUrl, size) {
    size = size || 512;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = Math.round(size * (140 / 420));
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
    ICONS,
    CATEGORY_ICONS,
    generateLogoSet,
    svgToDataUrl,
    svgDataUrlToPngDataUrl,
    resolveCategory
  };
})(window);
