// Static editorial illustrations, not altered screenshots or exercise instructions.
const resourcePreviewArt = {
  "coups-de-pied-arretes": {
    icon: "tactics",
    label: "TACTIQUE",
    art: '<rect x="26" y="20" width="308" height="140" rx="8"/><path d="M100 20v140M26 48h44v84H26M26 68h15v44H26"/><path d="M72 54Q158 28 222 83" stroke-dasharray="5 6"/><path d="m211 70 12 14-18 4"/><circle cx="72" cy="54" r="6" fill="#e41f28"/><circle cx="222" cy="104" r="8" fill="#fff"/><circle cx="261" cy="71" r="8" fill="#fff"/><circle cx="186" cy="132" r="8" fill="#fff"/>',
  },
  "preparation-physique": {
    icon: "physical",
    label: "PHYSIQUE",
    art: '<path d="M24 40h312M24 140h312M60 40v100M110 40v100M160 40v100M210 40v100M260 40v100M310 40v100" opacity=".35"/><path d="M35 100h55l20-38 24 76 25-52 18 14h145" stroke-width="4"/><circle cx="278" cy="54" r="16" fill="#e41f28" stroke="none"/><path d="m273 54 4 4 8-10"/>',
  },
  "planification-par-blocs": {
    icon: "planning",
    label: "PLANIFICATION",
    art: '<rect x="38" y="25" width="284" height="132" rx="10"/><path d="M38 58h284M91 16v20M269 16v20"/><rect x="58" y="80" width="58" height="54" rx="5" fill="#fff" fill-opacity=".18"/><rect x="128" y="80" width="58" height="54" rx="5" fill="#fff" fill-opacity=".45"/><rect x="198" y="80" width="58" height="54" rx="5" fill="#e41f28" stroke="none"/><path d="m272 118 10-15 13-20M283 84l13-1 1 14"/>',
  },
  "construire-une-seance": {
    icon: "planning",
    label: "SÉANCE",
    art: '<rect x="40" y="30" width="280" height="120" rx="9"/><path d="M133 30v120M226 30v120"/><circle cx="86" cy="90" r="21"/><path d="m174 69 23 21-23 21z" fill="#fff" fill-opacity=".18"/><path d="m253 91 13 13 23-29" stroke="#e41f28" stroke-width="6"/>',
  },
  "echauffement-avant-match": {
    icon: "physical",
    label: "ÉCHAUFFEMENT",
    art: '<path d="M26 142h308M58 131l12-26 12 26M144 131l12-26 12 26M230 131l12-26 12 26"/><path d="M45 72h250" stroke-dasharray="6 7"/><path d="m282 60 15 12-15 12"/><circle cx="120" cy="48" r="11" fill="#fff"/><path d="m120 63-10 25 22 18M112 84l-23 17M117 70l28 9" stroke-width="4"/><circle cx="303" cy="131" r="8" fill="#e41f28" stroke="none"/>',
  },
  "analyse-video": {
    icon: "video",
    label: "ANALYSE VIDÉO",
    art: '<rect x="38" y="25" width="284" height="121" rx="10"/><path d="M48 123h264M100 138h116" opacity=".5"/><circle cx="180" cy="78" r="30"/><path d="m172 62 24 16-24 16z" fill="#e41f28" stroke="none"/><path d="M62 158h236M101 152v12M162 152v12M223 152v12"/>',
  },
};
function resourceCategoryIcon(kind) {
  const paths = {
    tactics:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/>',
    physical: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    planning:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h3M14 15h3"/>',
    video:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  };
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.7");
  icon.innerHTML = paths[kind] || paths.tactics;
  return icon;
}
function resourceIllustration(id) {
  const data = resourcePreviewArt[id];
  if (!data) return document.createElement("span");
  const wrap = el("span", "resource-illustration");
  wrap.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 360 180");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "#fff");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = data.art;
  const label = el("span", "resource-illustration-label", data.label);
  label.prepend(resourceCategoryIcon(data.icon));
  wrap.append(svg, label);
  return wrap;
}
