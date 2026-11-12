// Club colours and logo applied to the whole site from the coach's club profile.
// Brand colours are written literally in many stylesheets: they are replaced in the
// CSSOM (hex, rgb()/rgba() and custom properties), originals kept to switch back.
(() => {
  const SOURCES = {
    primary: ["#2855a2", "#214fa0", "#244e95", "#214a90", "#245499"],
    dark: ["#142d50", "#17385d"],
    secondary: ["#e41f28"],
  };
  const DEFAULTS = { primary: "#2855a2", secondary: "#e41f28" };
  const originals = new Map(); // CSSStyleDeclaration -> Map(prop -> [value, priority])
  const parse = (hex) => {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrastWithWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05);
  const mix = (rgb, other, t) => rgb.map((v, i) => v + (other[i] - v) * t);
  // Colours used as button backgrounds with white text: darkened until 4.5:1.
  function readable(hex) {
    let rgb = parse(hex);
    for (let i = 0; i < 40 && contrastWithWhite(rgb) < 4.5; i++) rgb = mix(rgb, [0, 0, 0], 0.06);
    return rgb;
  }
  function palette(details) {
    const primary = /^#[0-9a-f]{6}$/i.test(details?.primaryColor || "") ? details.primaryColor : DEFAULTS.primary,
      secondary = /^#[0-9a-f]{6}$/i.test(details?.secondaryColor || "") ? details.secondaryColor : DEFAULTS.secondary,
      custom = primary.toLowerCase() !== DEFAULTS.primary || secondary.toLowerCase() !== DEFAULTS.secondary,
      p = readable(primary),
      map = new Map();
    for (const h of SOURCES.primary) {
      // Keep the small lightness gaps between the original blues.
      const delta = luminance(parse(h)) - luminance(parse(DEFAULTS.primary));
      map.set(parse(h).join(","), delta > 0 ? mix(p, [255, 255, 255], Math.min(0.12, delta * 2)) : mix(p, [0, 0, 0], Math.min(0.12, -delta * 2)));
    }
    for (const h of SOURCES.dark) map.set(parse(h).join(","), mix(p, [0, 0, 0], 0.45));
    for (const h of SOURCES.secondary) map.set(parse(h).join(","), readable(secondary));
    return { custom, map, primary: toHex(p), secondary: toHex(readable(secondary)) };
  }
  const COLOR = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)/gi;
  function replaceColors(value, map) {
    return value.replace(COLOR, (match, hex, r, g, b, a) => {
      let rgb, alpha;
      if (hex) {
        const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
        rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
        alpha = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : null;
      } else {
        rgb = [r, g, b].map(Number);
        alpha = a === undefined ? null : a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
      }
      const target = map.get(rgb.join(","));
      if (!target) return match;
      const [tr, tg, tb] = target.map((v) => Math.round(v));
      return alpha === null ? toHex(target) : "rgba(" + tr + ", " + tg + ", " + tb + ", " + +alpha.toFixed(3) + ")";
    });
  }
  function eachStyle(rules, fn) {
    for (const rule of rules) {
      if (rule.style) fn(rule.style);
      if (rule.cssRules) eachStyle(rule.cssRules, fn);
    }
  }
  function restore() {
    for (const [style, props] of originals) for (const [prop, [value, priority]] of props) style.setProperty(prop, value, priority);
    originals.clear();
  }
  function applyColors(details) {
    restore();
    const { custom, map, primary, secondary } = palette(details);
    document.documentElement.style.setProperty("--club-theme-primary", primary);
    document.documentElement.style.setProperty("--club-theme-secondary", secondary);
    if (!custom) return;
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // Cross-origin font sheets cannot be read and carry no brand colour.
      }
      eachStyle(rules, (style) => {
        for (let i = 0; i < style.length; i++) {
          const prop = style[i],
            value = style.getPropertyValue(prop);
          if (!value || !/#|rgb/i.test(value)) continue;
          const next = replaceColors(value, map);
          if (next === value) continue;
          if (!originals.has(style)) originals.set(style, new Map());
          if (!originals.get(style).has(prop)) originals.get(style).set(prop, [value, style.getPropertyPriority(prop)]);
          style.setProperty(prop, next, style.getPropertyPriority(prop));
        }
      });
    }
  }
  const LOGO = "assets/club-logo.jpg";
  let logoObserver = null;
  // Site identity images are recognised by marker (.club-logo, header) or by the
  // original file, not only by their current URL (a composition may carry its own logo).
  const identity = (img) => img.matches(".club-logo, header img, .account-club-brand img") || (img.getAttribute("src") || "").includes(LOGO);
  function swapLogo(img, logo) {
    if (!identity(img)) return;
    if (logo) {
      if (img.getAttribute("src") !== logo) {
        if (!img.dataset.clubLogoOriginal) img.dataset.clubLogoOriginal = img.getAttribute("src") || LOGO;
        img.setAttribute("src", logo);
      }
    } else if (img.dataset.clubLogoOriginal) {
      const original = img.dataset.clubLogoOriginal;
      delete img.dataset.clubLogoOriginal;
      if (img.getAttribute("src") !== original) img.setAttribute("src", original);
    }
  }
  function applyLogo(details) {
    const logo = /^data:image\/(jpeg|png|webp);base64,/.test(details?.logo || "") ? details.logo : "";
    for (const img of document.querySelectorAll("img")) swapLogo(img, logo);
    for (const link of document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')) {
      if (!link.dataset.clubLogoOriginal) link.dataset.clubLogoOriginal = link.getAttribute("href");
      link.setAttribute("href", logo || link.dataset.clubLogoOriginal);
    }
    logoObserver?.disconnect();
    logoObserver = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes") swapLogo(r.target, logo);
        for (const node of r.addedNodes || [])
          if (node.nodeType === 1) for (const img of node.matches?.("img") ? [node] : node.querySelectorAll?.("img") || []) swapLogo(img, logo);
      }
    });
    logoObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }
  function apply(details = typeof coachClubDetailsRead === "function" ? coachClubDetailsRead() : null) {
    try {
      applyColors(details);
      applyLogo(details);
    } catch {
      /* The default theme stays usable. */
    }
  }
  window.clubTheme = { apply, palette, readable: (hex) => toHex(readable(hex)), defaults: DEFAULTS };
  if (document.readyState === "complete") apply();
  else window.addEventListener("load", () => apply());
})();
