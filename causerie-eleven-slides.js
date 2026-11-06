// Fixed eleven-slide deck inspired by the supplied club PDFs; no coaching text is invented.
(() => {
  const NAVY = "0B192C",
    BLUE = "0055A5",
    RED = "E31B23",
    WHITE = "FFFFFF",
    MUTED = "526780";
  const phases = {
    defensive: { slide: 6, title: "Animation Défensive", field: "defensive" },
    offDef: {
      slide: 7,
      title: "Transition OFF / DEF",
      field: "transitionOffDef",
    },
    offensive: { slide: 8, title: "Animation Offensive", field: "offensive" },
    defOff: {
      slide: 9,
      title: "Transition DEF / OFF",
      field: "transitionDefOff",
    },
  };
  const fields = {
    round: "Journée de championnat",
    venue: "Lieu du match",
    contextObjective: "Objectifs du contexte",
    contextDynamics: "Dynamique du groupe",
    opponentStrengths: "Forces adverses",
    opponentWeaknesses: "Faiblesses adverses",
    opponentAnimation: "Animation adverse",
    transitionOffDef: "Transition OFF / DEF · À la perte",
    transitionDefOff: "Transition DEF / OFF · À la récupération",
    setPiecesFor: "CPA offensifs",
    setPiecesAgainst: "CPA défensifs",
    closingMessage: "Mot d’ordre final",
  };
  const beforeValid = validMatchPreparation;
  validMatchPreparation = function (plan) {
    return (
      beforeValid(plan) &&
      (!plan ||
        Object.keys(fields).every(
          (k) =>
            plan[k] === undefined ||
            (typeof plan[k] === "string" && plan[k].length <= 4000),
        ))
    );
  };
  let fontPromise;
  function presentationFonts(){
    return fontPromise ||= Promise.all([
      new FontFace('Montserrat','url(assets/fonts/montserrat/Montserrat-Italic.ttf)',{style:'italic',weight:'100 900'}),
      new FontFace('Calistoga','url(assets/fonts/calistoga/Calistoga-Regular.ttf)'),
    ].map(async font=>document.fonts.add(await font.load()))).catch(error=>{fontPromise=null;throw error;});
  }
  let logoPromise;
  function logo() {
    return (
      logoPromise ||
      (logoPromise = (async () => {
        const image = new Image();
        image.src = "assets/causerie-logo.jpeg";
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 400;
        const c = canvas.getContext("2d");
        c.beginPath();
        c.arc(200, 200, 199, 0, Math.PI * 2);
        c.clip();
        c.drawImage(image, 0, 0, 400, 400);
        return canvas.toDataURL("image/png");
      })().catch(() => {
        logoPromise = null;
        throw Error(
          "Le logo du club ne peut pas être chargé. Réessayez après avoir vérifié la connexion.",
        );
      }))
    );
  }
  function excerpt(value, limit = 130, preserveLines = false) {
    const text = String(value || "")
      .replace(preserveLines ? /[^\S\n]+/g : /\s+/g, " ")
      .trim();
    return text.length > limit
      ? text.slice(0, limit - 1).trimEnd() + "…"
      : text;
  }
  function ideas(value, max = 3, limit = 110) {
    return String(value || "")
      .split(/\n+|(?<=\.)\s+(?=[A-ZÀ-Ö])/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max)
      .map((s) => excerpt(s.replace(/^[-•]\s*/, ""), limit));
  }
  async function build(pptx, snapshot, style, { pitchImage }) {
    await presentationFonts();
    const board = snapshot.board,
      p = board.matchPreparation || {},
      S = pptx.ShapeType;
    const [photos, crest] = await Promise.all([
      window.causerieExportPhotos
        ? causerieExportPhotos.resolve(snapshot.photos)
        : {},
      logo(),
    ]);
    pptx.theme = {
      headFontFace: "Montserrat",
      bodyFontFace: "Calistoga",
      lang: "fr-FR",
    };
    const angularPhotos = {};
    for (const n of [3, 4, 5, 10]) if (photos[n]) {
      const image = new Image(); image.src = photos[n].portrait; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 520; canvas.height = 1100;
      const c = canvas.getContext("2d");
      c.beginPath();c.moveTo(125,0);c.lineTo(520,0);c.lineTo(395,1100);c.lineTo(0,1100);c.closePath();c.clip();
      const scale = Math.max(520 / image.naturalWidth, 1100 / image.naturalHeight);
      c.drawImage(image, (520-image.naturalWidth*scale)/2, (1100-image.naturalHeight*scale)/2, image.naturalWidth*scale, image.naturalHeight*scale);
      angularPhotos[n] = canvas.toDataURL("image/png");
    }
    const slides = [],
      hosts = [],
      exerciseHosts = [];
    const text = (slide, value, x, y, w, h, size = 20, extra = {}) => {
      if (!String(value || "").trim()) return;
      slide.addText(String(value), {
        x,
        y,
        w,
        h,
        fontFace: slide === slides[0] || slide === slides[10] ? "Montserrat" : "Calistoga",
        bold: slide === slides[0] || slide === slides[10],
        italic: slide === slides[0] || slide === slides[10],
        fontSize: size,
        color: NAVY,
        margin: 0,
        valign: "top",
        fit: "shrink",
        paraSpaceAfterPt: 8,
        ...extra,
        ...((extra.fontFace || (slide === slides[0] || slide === slides[10] ? "Montserrat" : "Calistoga")) === "Calistoga" ? {bold:false,italic:false} : {}),
      });
    };
    const rect = (slide, x, y, w, h, color) =>
      slide.addShape(S.rect, {
        x,
        y,
        w,
        h,
        line: { transparency: 100 },
        fill: { color },
      });
    const heading = (slide, value, x, y, w, h, size = 30, extra = {}) =>
      text(slide, value, x, y, w, h, size, {
        fontFace: "Montserrat",
        italic: true,
        bold: true,
        ...extra,
      });
    const line = (slide, x, y, w, color = "DCE5EF") =>
      rect(slide, x, y, w, 0.012, color);
    function base(
      title,
      n,
      { dark = false, accent = BLUE, kicker = "LE MATCH", photo = false, bare = false } = {},
    ) {
      const slide = pptx.addSlide();
      slides.push(slide);
      slide.background = { color: dark ? BLUE : WHITE };
      if (bare) return slide;
      // Shared club signature: royal blue covers, light editorial headers,
      // with a clean lower edge and no repeated footer.
      if (dark) {
        rect(slide, 0, 0, 0.14, 7.5, WHITE);
      } else {
        rect(slide, 0, 0, 13.333333, 0.045, BLUE);
        for (let i = 0; i < 3; i++) slide.addShape(S.chevron, {
          x: 0.65 + i * 0.29, y: 0.43, w: 0.24, h: 0.25,
          fill: { color: accent }, line: { transparency: 100 },
          objectName: "club-reference-chevron-" + n + "-" + i,
        });
      }
      if (dark && photos[n]) {
        slide.addImage({
          data: photos[n].portrait,
          x: 8.9,
          y: 0,
          w: 4.433333,
          h: 7.5,
          objectName: "club-photo-" + n,
        });
        rect(slide, 8.76, 0, 0.06, 7.5, WHITE);
        rect(slide, 8.82, 0, 0.08, 7.5, RED);
      }
      if (photo && angularPhotos[n]) {
        slide.addShape(S.rtTriangle, {
          x: 0, y: 3.8, w: 2.85, h: 3.7,
          fill: { color: BLUE }, line: { transparency: 100 },
          objectName: "club-reference-angle-" + n,
        });
        slide.addImage({ data: angularPhotos[n], x: 0.15, y: 1.72, w: 2.7, h: 5.55,
          objectName: "personal-photo-" + n });
      }
      if (dark) rect(slide, 0.65, 0.46, 0.08, 0.27, accent);
      text(slide, kicker, dark ? 0.86 : 1.66, 0.48, 9, 0.23, 10, {
        fontFace: "Montserrat", bold: true, italic: true, charSpacing: 1.6, color: dark ? "D7E3F1" : accent,
      });
      if (!dark)
        heading(slide, title, 0.65, 0.92, 10.8, 0.55, 30, { color: accent });
      const progressWidth = 12.03, progressY = dark ? 1.35 : 1.54, progressColor = dark ? WHITE : accent;
      line(slide, 0.65, progressY + 0.02, progressWidth, dark ? "547BAD" : "DCE5EF");
      slide.addShape(S.rect,{x:0.65,y:progressY,w:progressWidth*n/11,h:0.055,line:{transparency:100},fill:{color:progressColor},objectName:'club-slide-progress-'+n});
      slide.addShape(S.ellipse, {
        x: 11.91,
        y: 0.32,
        w: 0.9,
        h: 0.9,
        line: { transparency: 100 },
        fill: { color: WHITE },
      });
      slide.addImage({
        data: crest,
        x: 11.95,
        y: 0.36,
        w: 0.82,
        h: 0.82,
        objectName: "club-logo-slide-" + n,
      });
      return slide;
    }
    function notes(slide, values) {
      slide.addNotes(
        Array.isArray(values)
          ? values.filter(Boolean).join("\n\n")
          : values || "",
      );
    }
    function bullets(
      slide,
      value,
      x,
      y,
      w,
      h,
      { count = 3, chars = 110, size = 21, color = NAVY, accent = BLUE } = {},
    ) {
      const rows = ideas(value, count, chars);
      if (!rows.length) return;
      const slot = h / rows.length;
      rows.forEach((row, i) => {
        rect(slide, x, y + i * slot + 0.11, 0.065, 0.065, accent);
        text(slide, row, x + 0.2, y + i * slot, w - 0.2, slot - 0.12, size, {
          color,
        });
      });
    }
    function block(slide, label, value, x, y, w, h, { accent = BLUE } = {}) {
      text(slide, label.toUpperCase(), x, y, w, 0.3, 12, {
        fontFace: "Montserrat", bold: true, italic: true, charSpacing: 1.1, color: accent,
      });
      line(slide, x, y + 0.45, w, accent);
      if (String(value || "").length <= 1400)
        text(slide, value, x, y + 0.7, w, h - 0.7, String(value || "").length > 500 ? 17 : 21);
      else bullets(slide, value, x, y + 0.7, w, h - 0.7, { accent, chars: 150, size: 18 });
    }
    function bodyFrame(n, photo = !!photos[n]) {
      return photo ? { x: 3.35, w: 9.33 } : { x: 0.65, w: 12.03 };
    }
    let slide = base("Infos match", 1, {
      dark: true,
      accent: RED,
      kicker: "STADE MAYENNAIS · AVANT-MATCH",
    });
    text(
      slide,
      excerpt(p.title || "NOTRE RENDEZ-VOUS", 70).toUpperCase(),
      0.8,
      1.7,
      7.3,
      0.38,
      13,
      { bold: true, charSpacing: 1.8, color: WHITE },
    );
    heading(
      slide,
      excerpt(p.match || board.title || board.team, 130, true),
      0.8,
      2.35,
      photos[1] ? 7.3 : 11.5,
      1.7,
      38,
      { color: WHITE },
    );
    const dateLabel = p.date
      ? new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(p.date + "T12:00:00Z"))
      : "";
    line(slide, 0.8, 4.55, 1.1, RED);
    text(
      slide,
      [p.round, dateLabel].filter(Boolean).join(" · "),
      0.8,
      4.9,
      7.3,
      0.65,
      18,
      { color: "D7E3F1", bold: true },
    );
    text(slide, excerpt(p.venue, 100), 0.8, 5.7, 7.3, 0.5, 16, {
      color: "D7E3F1", bold: true,
    });
    notes(slide, [
      ...causerieExport.collect(board).map((f) => f.label + " : " + f.value),
      ...Object.entries(fields)
        .filter(([key]) => p[key])
        .map(([key, label]) => label + " : " + p[key]),
    ]);
    slide = base("La composition d’équipe", 2, { kicker: "NOTRE ÉQUIPE" });
    const pitch = await pitchImage(
      { ...board, benchVisible: false, lanes: false },
      true,
      { nameScale: 1.65, nameWeight: "normal" },
    );
    slide.addImage({
      data: pitch.data,
      x: 0.65,
      y: 1.75,
      w: 9.05,
      h: 5.09,
      objectName: "match-composition",
    });
    const sidebarY = photos[2] ? 3.3 : 1.9;
    if (photos[2])
      slide.addImage({
        data: photos[2].landscape,
        x: 10.12,
        y: 1.7,
        w: 2.4,
        h: 1.3,
      });
    heading(slide, board.formation, 10.08, sidebarY, 2.5, 0.5, 28, {
      color: BLUE,
    });
    text(
      slide,
      "IMPACTEURS / FINISSEURS",
      10.08,
      sidebarY + 0.77,
      2.5,
      0.55,
      11,
      { bold: true, color: MUTED },
    );
    const bench = board.players.filter((player) => player.role === "sub");
    text(
      slide,
      bench
        .map((player) =>
          [player.number, player.name]
            .filter((v) => v !== "" && v !== undefined)
            .join(" · "),
        )
        .join("\n"),
      10.08,
      sidebarY + 1.45,
      2.5,
      Math.max(0.5, 5.15 - sidebarY),
      bench.length > 8 ? 13 : 17,
      { breakLine: false },
    );
    notes(
      slide,
      board.players.map(
        (player) =>
          (player.role === "sub" ? "Impacteur / Finisseur" : "Titulaire") +
          " · " +
          player.number +
          " · " +
          player.name,
      ),
    );
    // Context and opponent are authored prose, not names or two-bullet excerpts.
    // Keep every supplied point in the exported slide, not only in presenter notes.
    function informationPage(title, n, kicker, sections) {
      const filled = sections.filter(section => String(section.value || "").trim());
      const count = filled.reduce((sum, section) => sum + String(section.value).length, 0);
      const withPhoto = !!photos[n] && count <= 650;
      const page = base(title, n, { kicker, photo: withPhoto });
      const frame = bodyFrame(n, withPhoto), width = frame.w;
      const primary = filled.find(section => section.primary);
      const secondary = filled.filter(section => section !== primary);
      const panel = (section, x, y, w, h) => block(page, section.label, section.value, x, y, w, h, { accent: section.accent || BLUE });
      if (primary && secondary.length) {
        const primaryWidth = width * 0.6 - 0.2;
        panel(primary, frame.x, 1.85, primaryWidth, 4.95);
        const slot = (4.95 - (secondary.length - 1) * 0.22) / secondary.length;
        secondary.forEach((section, index) => panel(section, frame.x + 0.4 + primaryWidth, 1.85 + index * (slot + 0.22), width - primaryWidth - 0.4, slot));
      } else {
        const columns = Math.max(1, filled.length), gap = 0.35, w = (width - gap * (columns - 1)) / columns;
        filled.forEach((section, index) => panel(section, frame.x + index * (w + gap), 1.85, w, 4.95));
      }
      notes(page, sections.map(section => section.value));
      return page;
    }
    const contextPhoto = !!photos[3] && (String(p.context || "").length + String(p.contextDynamics || "").length <= 850);
    slide = base("La dynamique du groupe", 3, { kicker: "LE CONTEXTE DU MATCH", photo: contextPhoto });
    const contextFrame = bodyFrame(3, contextPhoto);
    const dynamicText = String(p.contextDynamics || p.context || "").trim();
    const dynamicPoints = dynamicText.split(/\n+|(?<=\.)\s+/)
      .map(value => value.trim()).filter(Boolean);
    const hasContext = !!(p.contextDynamics && String(p.context || "").trim());
    if (hasContext) {
      rect(slide, contextFrame.x, 1.8, 0.045, 1.05, BLUE);
      text(slide, String(p.context).trim(), contextFrame.x + 0.18, 1.82, contextFrame.w - 0.18, 1.08, 16, { color: MUTED });
    }
    const dynamicTop = hasContext ? 3.12 : 1.85;
    const columns = dynamicPoints.length === 1 ? 1 : 2;
    const rows = Math.max(1, Math.ceil(dynamicPoints.length / columns));
    const gap = 0.28, cardWidth = (contextFrame.w - gap * (columns - 1)) / columns;
    const cardHeight = (6.85 - dynamicTop - gap * (rows - 1)) / rows;
    dynamicPoints.forEach((point, index) => {
      const x = contextFrame.x + (index % columns) * (cardWidth + gap);
      const y = dynamicTop + Math.floor(index / columns) * (cardHeight + gap);
      slide.addShape(S.roundRect, {
        x, y, w: cardWidth, h: cardHeight, radius: 0.12,
        rectRadius: 0.12, fill: { color: "F2F6FB" },
        line: { color: "DCE5EF", width: 0.6 },
        objectName: "group-dynamic-point-" + (index + 1),
      });
      slide.addShape(S.ellipse, {
        x: x + 0.22, y: y + 0.22, w: 0.43, h: 0.43,
        fill: { color: index === 0 ? NAVY : BLUE }, line: { transparency: 100 },
      });
      text(slide, String(index + 1).padStart(2, "0"), x + 0.22, y + 0.3, 0.43, 0.23, 10,
        { color: WHITE, bold: true, align: "center" });
      text(slide, point, x + 0.88, y + 0.25, cardWidth - 1.12, cardHeight - 0.46,
        point.length > 170 || rows > 2 ? 16 : 21, { bold: true, color: NAVY });
    });
    // Historical objectives remain in notes only, never in the projected slide.
    notes(slide, [p.contextDynamics, p.context, p.contextObjective]);
    slide = informationPage("Informations adversaire", 4, "LES INFORMATIONS DU COACH", [
      { label: "Informations", value: p.opponent, primary: true },
      { label: "Forces", value: p.opponentStrengths },
      { label: "Points à exploiter", value: p.opponentWeaknesses },
      { label: "Organisation", value: p.opponentAnimation, accent: NAVY },
    ]);
    slide = base("Nos idées fortes", 5, { kicker: "NOS INGRÉDIENTS POUR CE MATCH", photo: true });
    const goalsFrame = bodyFrame(5), goals = (p.objectives || []).filter(value => String(value).trim());
    const goalSlot = 4.95 / Math.max(1, goals.length);
    goals.forEach((goal, i) => {
      const y = 1.95 + i * goalSlot;
      text(slide, String(i + 1).padStart(2, "0"), goalsFrame.x, y + 0.04, 0.65, 0.42, 22, { color: BLUE, bold: true });
      text(slide, goal, goalsFrame.x + 0.95, y, goalsFrame.w - 1.0, goalSlot - 0.25, goal.length > 180 ? 18 : 25, { bold: true });
      if (i < goals.length - 1) line(slide, goalsFrame.x, y + goalSlot - 0.15, goalsFrame.w);
    });
    notes(slide, goals);
    for (const [key, phase] of Object.entries(phases)) {
      const assigned = board.causerieSlideAnimations,
        sequences = assigned
          ? assigned[key] || []
          : key === "defensive"
            ? snapshot.demonstrations?.sequences || []
            : [],
        media = key === "defensive" ? snapshot.demonstrations?.media || [] : [];
      const choices = [
        ...sequences.map((entry) => ({ entry })),
        ...media.map((media) => ({ media })),
        ...(board.causerieSlideExercises?.[key] || []).map((exercise) => ({
          exercise,
        })),
      ];
      if (choices.length > 4)
        throw Error(
          phase.title +
            " : sélectionnez au maximum 4 situations pour garder les schémas lisibles dans les 11 slides.",
        );
      slide = base(phase.title, phase.slide, { bare: true });
      const body = p[phase.field] || "";
      const stage = { x: 0.1, y: 0.1, w: 13.133333, h: 7.3 };
      const cols = choices.length <= 1 ? 1 : 2, rows = Math.max(1, Math.ceil(choices.length / cols));
      const gap = 0.12, tileW = (stage.w - gap * (cols - 1)) / cols, tileH = (stage.h - gap * (rows - 1)) / rows;
      choices.forEach((choice, i) => {
        const custom=choice.exercise?.custom, ratio=choice.exercise?1.6:840/680;
        const w=Math.min(tileW,tileH*ratio),h=w/ratio;
        const box={x:stage.x+(i%cols)*(tileW+gap)+(tileW-w)/2,y:stage.y+Math.floor(i/cols)*(tileH+gap)+(tileH-h)/2,w,h};
        if (!choice.exercise || custom.board) (choice.exercise?exerciseHosts:hosts).push({...choice,slide,box,palette:{navy:NAVY,red:RED,blue:BLUE,accent:clubGamePhaseColors[{defensive:"off",offDef:"loss",offensive:"ball",defOff:"win"}[key]]}});
        // No invented pitch or on-screen instructions when no drawing is saved.
      });
      notes(slide, [
        "Nos idées de jeu", body,
        ...sequences.map((e) => e.title),
        ...choices
          .filter((c) => c.exercise && !c.exercise.custom.board)
          .map((c) =>
            Object.values(c.exercise.custom)
              .filter((v) => typeof v === "string")
              .join("\n"),
          ),
      ]);
    }
    slide = base("CPA · Coups de pied arrêtés", 10, {
      kicker: "ÊTRE PRÊTS DANS LES DEUX SURFACES",
      photo: true,
    });
    const cpaFrame = bodyFrame(10), sw = cpaFrame.w,
      sc = (sw - 0.6) / 2;
    block(slide, "Offensifs", p.setPiecesFor, cpaFrame.x, 2, sc, 3.9, {
      accent: clubGamePhaseColors.ball,
    });
    block(slide, "Défensifs", p.setPiecesAgainst, cpaFrame.x + 0.6 + sc, 2, sc, 3.9, {
      accent: clubGamePhaseColors.off,
    });
    text(slide, excerpt(p.specific, 350), cpaFrame.x, 6.25, sw, 0.4, 14, {
      color: MUTED,
    });
    notes(slide, [p.setPiecesFor, p.setPiecesAgainst, p.specific]);
    slide = base("Fin de causerie", 11, {
      dark: true,
      accent: RED,
      kicker: "LE MOT D’ORDRE",
    });
    text(slide, "ENSEMBLE", 0.8, 1.8, 7.3, 0.4, 13, {
      bold: true,
      color: WHITE,
      charSpacing: 2.3,
    });
    heading(
      slide,
      excerpt(p.closingMessage, 210, true),
      0.8,
      2.6,
      photos[11] ? 7.3 : 11.7,
      2.8,
      38,
      { color: WHITE },
    );
    line(slide, 0.8, 6.15, 1.1, RED);
    notes(slide, [p.closingMessage, board.notes]);
    if (slides.length !== 11)
      throw Error("La présentation doit comporter exactement 11 slides.");
    if (exerciseHosts.length)
      await causerieClubSituations.append(pptx, exerciseHosts, { variant: board.causerieAnimationVariant || "video" });
    return causerieAnimations.append(
      pptx,
      {
        sequences: hosts.filter((h) => h.entry).map((h) => h.entry),
        media: hosts.filter((h) => h.media).map((h) => h.media),
      },
      { hosts, variant: board.causerieAnimationVariant || "video" },
    );
  }
  window.causerieEleven = {
    build,
    fields,
    phases,
    templateVersion: "club-typography-279",
    theme: {
      navy: NAVY,
      blue: BLUE,
      red: RED,
      white: WHITE,
      heading: "Montserrat",
      body: "Calistoga",
    },
  };
})();
