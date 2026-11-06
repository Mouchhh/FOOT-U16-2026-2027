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
      bodyFontFace: "Arial",
      lang: "fr-FR",
    };
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
        fontFace: "Arial",
        fontSize: size,
        color: NAVY,
        margin: 0,
        valign: "top",
        fit: "shrink",
        paraSpaceAfterPt: 8,
        ...extra,
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
      { dark = false, accent = BLUE, kicker = "LE MATCH", photo = false } = {},
    ) {
      const slide = pptx.addSlide();
      slides.push(slide);
      slide.background = { color: dark ? BLUE : WHITE };
      // Shared club signature: royal blue covers, light editorial headers,
      // with a clean lower edge and no repeated footer.
      if (dark) {
        rect(slide, 0, 0, 0.14, 7.5, WHITE);
      } else {
        rect(slide, 0, 0, 13.333333, 1.6, "F2F6FB");
        rect(slide, 0, 0, 13.333333, 0.055, accent);
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
      if (photo && photos[n])
        slide.addImage({
          data: photos[n].portrait,
          x: 9.8,
          y: 1.7,
          w: 2.9,
          h: 4.91,
          objectName: "personal-photo-" + n,
        });
      rect(slide, 0.65, 0.46, 0.08, 0.27, accent);
      text(slide, kicker, 0.86, 0.48, 10, 0.23, 10, {
        bold: true,
        charSpacing: 1.8,
        color: dark ? "D7E3F1" : accent,
      });
      if (!dark)
        heading(slide, title, 0.65, 0.95, 10.8, 0.55, 30, { color: BLUE });
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
      rect(slide, x, y - 0.06, w, 0.46, accent);
      text(slide, label.toUpperCase(), x + 0.12, y + 0.04, w - 0.24, 0.3, 11, {
        bold: true,
        charSpacing: 1.2,
        color: WHITE,
      });
      bullets(slide, value, x, y + 0.7, w, h - 0.7, {
        accent,
        chars: w < 3 ? 60 : w < 4 ? 75 : 135,
        size: 21,
      });
    }
    function photoBodyWidth(n) {
      return photos[n] ? 8.7 : 12.03;
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
    if (p.round || dateLabel) rect(slide, 0.8, 4.8, 7.3, 0.75, NAVY);
    if (p.venue) rect(slide, 0.8, 5.65, 7.3, 0.62, NAVY);
    text(
      slide,
      [p.round, dateLabel].filter(Boolean).join(" · "),
      0.8,
      4.95,
      7.3,
      0.65,
      18,
      { color: "D7E3F1" },
    );
    text(slide, excerpt(p.venue, 100), 0.8, 5.7, 7.3, 0.5, 16, {
      color: "D7E3F1",
    });
    notes(slide, [
      ...causerieExport.collect(board).map((f) => f.label + " : " + f.value),
      ...Object.entries(fields)
        .filter(([key]) => p[key])
        .map(([key, label]) => label + " : " + p[key]),
    ]);
    slide = base("La composition d’équipe", 2, { kicker: "NOTRE ÉQUIPE" });
    const pitch = await pitchImage(
      { ...board, benchVisible: true, lanes: false },
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
      const width = withPhoto ? 8.7 : 12.03;
      const primary = filled.find(section => section.primary);
      const secondary = filled.filter(section => section !== primary);
      const panel = (section, x, y, w, h) => {
        rect(page, x, y, w, 0.42, section.accent || BLUE);
        text(page, section.label.toUpperCase(), x + 0.13, y + 0.08, w - 0.26, 0.28, 10, {
          bold: true, charSpacing: 1.1, color: WHITE,
        });
        text(page, String(section.value).trim(), x + 0.04, y + 0.65, w - 0.08, h - 0.65,
          String(section.value).length > 500 ? 16 : 20, { breakLine: false, paraSpaceAfterPt: 10 });
      };
      if (primary && secondary.length) {
        const primaryWidth = width * 0.6 - 0.2;
        panel(primary, 0.65, 1.85, primaryWidth, 4.95);
        const slot = (4.95 - (secondary.length - 1) * 0.22) / secondary.length;
        secondary.forEach((section, index) => panel(section, 1.05 + primaryWidth, 1.85 + index * (slot + 0.22), width - primaryWidth - 0.4, slot));
      } else {
        const columns = Math.max(1, filled.length), gap = 0.35, w = (width - gap * (columns - 1)) / columns;
        filled.forEach((section, index) => panel(section, 0.65 + index * (w + gap), 1.85, w, 4.95));
      }
      notes(page, sections.map(section => section.value));
      return page;
    }
    slide = base("La dynamique du groupe", 3, { kicker: "LE CONTEXTE DU MATCH" });
    const dynamicText = String(p.contextDynamics || p.context || "").trim();
    const dynamicPoints = dynamicText.split(/\n+|(?<=\.)\s+/)
      .map(value => value.trim()).filter(Boolean);
    const hasContext = !!(p.contextDynamics && String(p.context || "").trim());
    if (hasContext) {
      rect(slide, 0.65, 1.8, 0.055, 1.05, BLUE);
      text(slide, String(p.context).trim(), 0.87, 1.82, 11.5, 1.08, 16, { color: MUTED });
    }
    const dynamicTop = hasContext ? 3.12 : 1.85;
    const columns = dynamicPoints.length === 1 ? 1 : 2;
    const rows = Math.max(1, Math.ceil(dynamicPoints.length / columns));
    const gap = 0.28, cardWidth = (12.03 - gap * (columns - 1)) / columns;
    const cardHeight = (6.85 - dynamicTop - gap * (rows - 1)) / rows;
    dynamicPoints.forEach((point, index) => {
      const x = 0.65 + (index % columns) * (cardWidth + gap);
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
    slide = base("Nos idées fortes", 5, {
      kicker: "TROIS REPÈRES POUR JOUER ENSEMBLE",
      photo: true,
    });
    const gw = photoBodyWidth(5),
      gc = (gw - 0.8) / 3,
      goals = p.objectives || [];
    for (let i = 0; i < 3; i++) {
      const x = 0.65 + i * (gc + 0.4);
      heading(slide, String(i + 1).padStart(2, "0"), x, 2.05, gc, 0.65, 40, {
        color: i === 0 ? RED : BLUE,
      });
      line(slide, x, 3, gc);
      heading(
        slide,
        excerpt(
          i === 2 ? goals.slice(2).filter(Boolean).join(" · ") : goals[i],
          110,
        ),
        x,
        3.35,
        gc,
        2.65,
        24,
      );
    }
    notes(slide, goals);
    const colors = {
        defensive: RED,
        offensive: BLUE,
        offDef: "B45309",
        defOff: "247342",
      },
      kickers = {
        defensive: "SANS LE BALLON",
        offensive: "AVEC LE BALLON",
        offDef: "À LA PERTE DU BALLON",
        defOff: "À LA RÉCUPÉRATION DU BALLON",
      };
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
      const accent = colors[key];
      slide = base(phase.title, phase.slide, { accent, kicker: kickers[key] });
      rect(slide, 0.65, 1.8, 0.055, 4.8, accent);
      rect(slide, 0.86, 1.8, 2.75, 0.42, accent);
      text(slide, "NOS CONSIGNES", 0.86, 1.85, 2.75, 0.3, 11, {
        bold: true,
        color: WHITE,
        charSpacing: 1,
        margin: [0, 0.12, 0, 0.12],
      });
      const body = p[phase.field] || "";
      const singleExercise =
        choices.length === 1 && choices[0].exercise?.custom.board
          ? choices[0].exercise.custom
          : null;
      if (singleExercise) {
        bullets(slide, body, 0.86, 2.4, 2.75, 1.2, {
          count: 1,
          chars: 80,
          size: 19,
          accent,
        });
        text(slide, "RÈGLES DE L’ATELIER", 0.86, 3.85, 2.75, 0.3, 11, {
          bold: true,
          color: accent,
          charSpacing: 0.6,
        });
        bullets(
          slide,
          singleExercise.instructions,
          0.86,
          4.3,
          2.75,
          2.2,
          { count: 2, chars: 65, size: 17, accent },
        );
      } else
        bullets(slide, body, 0.86, 2.4, 2.75, 4.05, {
          count: 3,
          chars: 72,
          size: 19,
          accent,
        });
      const stage = { x: 4.05, y: 1.8, w: 8.63, h: 4.96 };
      if (!choices.length) {
        rect(slide, 4.05, 1.8, 8.63, 4.96, "F3F6FA");
        heading(slide, kickers[key], 4.65, 3.25, 7.4, 1.05, 30, {
          color: accent,
        });
      } else {
        const cols = choices.length === 1 ? 1 : 2,
          rows = Math.ceil(choices.length / cols),
          gap = 0.25,
          tileW = (stage.w - gap * (cols - 1)) / cols,
          tileH = (stage.h - gap * (rows - 1)) / rows;
        choices.forEach((choice, i) => {
          const x = stage.x + (i % cols) * (tileW + gap),
            y = stage.y + Math.floor(i / cols) * (tileH + gap),
            custom = choice.exercise?.custom,
            title =
              choice.entry?.title ||
              choice.media?.name ||
              choice.exercise?.title;
          const size = choices.length > 2 ? 13 : 16;
          text(
            slide,
            excerpt(title, choices.length > 2 ? 48 : 82),
            x,
            y,
            tileW,
            0.4,
            size,
            { bold: true, align: "center" },
          );
          const caption = custom
            ? [
                custom.width + " × " + custom.length + " m",
                excerpt(
                  choices.length === 1
                    ? custom.goal || custom.instructions
                    : ideas(custom.instructions, 1, 75)[0],
                  choices.length > 2 ? 62 : 120,
                ),
              ]
                .filter(Boolean)
                .join(" · ")
            : "";
          const spaceH = tileH - 0.5 - (caption ? 0.35 : 0),
            ratio = choice.exercise ? 1.6 : 16 / 9,
            w = Math.min(tileW, spaceH * ratio),
            h = w / ratio;
          const box = {
            x: x + (tileW - w) / 2,
            y: y + 0.46 + (spaceH - h) / 2,
            w,
            h,
          };
          if (choice.exercise && !custom.board) {
            rect(slide, box.x, box.y, box.w, box.h, "F3F6FA");
            bullets(
              slide,
              custom.instructions,
              box.x + 0.15,
              box.y + 0.2,
              box.w - 0.3,
              box.h - 0.3,
              {
                count: choices.length > 2 ? 2 : 3,
                chars: 80,
                size: choices.length > 2 ? 14 : 19,
                accent,
              },
            );
          } else
            (choice.exercise ? exerciseHosts : hosts).push({
              ...choice,
              slide,
              box,
              palette: { navy: NAVY, red: RED, blue: BLUE },
            });
          if (caption)
            text(
              slide,
              caption,
              x,
              y + tileH - 0.3,
              tileW,
              0.3,
              choices.length > 2 ? 10 : 12,
              { color: MUTED, align: "center" },
            );
        });
      }
      notes(slide, [
        body,
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
    const sw = photoBodyWidth(10),
      sc = (sw - 0.6) / 2;
    block(slide, "Offensifs", p.setPiecesFor, 0.65, 2, sc, 3.9, {
      accent: BLUE,
    });
    block(slide, "Défensifs", p.setPiecesAgainst, 1.25 + sc, 2, sc, 3.9, {
      accent: RED,
    });
    text(slide, excerpt(p.specific, 180), 0.65, 6.25, sw, 0.4, 14, {
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
      await causerieClubSituations.append(pptx, exerciseHosts);
    return causerieAnimations.append(
      pptx,
      {
        sequences: hosts.filter((h) => h.entry).map((h) => h.entry),
        media: hosts.filter((h) => h.media).map((h) => h.media),
      },
      { hosts, variant: board.causerieAnimationVariant || "native" },
    );
  }
  window.causerieEleven = {
    build,
    fields,
    phases,
    templateVersion: "club-premium-274",
    theme: {
      navy: NAVY,
      blue: BLUE,
      red: RED,
      white: WHITE,
      heading: "Montserrat",
      body: "Arial",
    },
  };
})();
