// Export adapters only: saved exercise engines and coaching instructions remain unchanged.
(() => {
  "use strict";
  const selections = new Map(),
    media = new Map();
  const key = () =>
    [activeCoach.id, activeCoachTeam.id, state.documentId || "draft"].join(":");
  const selected = () => getCompositionBoard().causerieAnimations?.map(entry => entry.id) || selections.get(key()) || [];
  function capture() {
    simpleRefreshLibrary();
    return {
      sequences: structuredClone(getCompositionBoard().causerieAnimations || simpleLibrary.filter(e => selected().includes(e.id))),
      media: structuredClone(media.get(key()) || []),
    };
  }
  // Resolve the exact same actions and alternative-pass choice as animation.js,
  // using a private snapshot, never the live tactical board.
  function frames(entry) {
    const s = structuredClone(entry.state);
    if (s.scenario === "custom") {
      s.tokens = structuredClone(s.customBase.tokens);
      s.ball = structuredClone(s.customBase.ball);
    } else if (s.step !== 0)
      throw Error(
        "Réenregistrez « " +
          entry.title +
          " » depuis sa première étape pour exporter toute la séquence.",
      );
    const initial = structuredClone(s),
      steps = [];
    for (let i = 0; i < simpleScenario(s).steps.length; i++) {
      s.step = i;
      const moves = [],
        passes = [];
      for (const action of simpleActions(s)) {
        if (action.id === "ball") {
          passes.push({ x: action.x, y: action.y });
          continue;
        }
        const token = s.tokens.find((t) => t.id === action.id);
        if (!token) continue;
        if (action.type === "move")
          moves.push({ id: token.id, x: action.x, y: action.y });
        else {
          const index = simpleScenarios[s.scenario].tokens.findIndex(
            (t) => t[1] === action.x && t[2] === action.y,
          );
          const receiver = s.tokens.find((t) => t.id === "s" + index);
          passes.push(
            receiver
              ? { x: receiver.x, y: receiver.y }
              : { x: action.x, y: action.y },
          );
        }
      }
      const pass =
        passes[
          s.scenario === "build" && i === 2 && entry.choice === "back"
            ? passes.length - 1
            : 0
        ];
      if (pass) moves.push({ id: "ball", ...pass });
      const paths = moves.map((m) => {
        const token =
          m.id === "ball" ? s.ball : s.tokens.find((t) => t.id === m.id);
        const start = { x: token.x, y: token.y };
        Object.assign(token, { x: m.x, y: m.y });
        return { id: m.id, start, end: { x: m.x, y: m.y } };
      });
      steps.push({
        paths,
        caption: simpleScenario(s).steps[i][1],
        duration: Math.round(2400 / Number(entry.speed)),
      });
    }
    return { initial, steps };
  }
  async function animationGif(entry) {
    const { GIFEncoder, quantize, applyPalette } = await import(
      "./vendor/gifenc/gifenc.esm.js"
    );
    const initial = frames(entry).initial;
    initial.step = 0;
    const segments = exportSegments(initial, entry.choice),
      source = createMediaCanvas();
    const canvas = document.createElement("canvas");
    source.width = canvas.width = 840;
    source.height = canvas.height = 680;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }),
      gif = GIFEncoder();
    const count = Math.max(2, Math.round(2400 / Number(entry.speed) / 100));
    let palette;
    for (const segment of segments) {
      for (let frame = 0; frame <= count; frame++) {
        renderMedia(source, interpolateMedia(segment, frame / count), true, "", {pitchOnly:true});
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        // One palette keeps the colors stable throughout the demonstration.
        palette ||= quantize(rgba, 256);
        gif.writeFrame(
          applyPalette(rgba, palette),
          canvas.width,
          canvas.height,
          {
            palette,
            delay: frame === count ? 10 : 2400 / Number(entry.speed) / count,
            repeat: 0,
          },
        );
        if (frame % 8 === 0)
          await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    gif.finish();
    const bytes = gif.bytes();
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return "data:image/gif;base64," + btoa(binary);
  }
  async function append(pptx, bundle, options = {}) {
    if (!bundle || (!bundle.sequences.length && !bundle.media.length))
      return pptx;
    const timings = [];
    const integrated = Array.isArray(options.hosts);
    const sequenceHosts = integrated ? options.hosts.filter(host => host.entry) : bundle.sequences.map(entry => ({entry}));
    let hostNumber = 0;
    for (const host of sequenceHosts) {
      const entry = host.entry, model = frames(entry), slide = host.slide || pptx.addSlide();
      hostNumber++;
      if (host.slide && options.variant === 'video') {
        const { recordPitch } = await import('./causerie-video.js');
        const initial = frames(entry).initial, segments = exportSegments(initial, entry.choice);
        const source = createMediaCanvas(), perStep = 2400 / Number(entry.speed);source.width=1008;source.height=816;
        if (!segments.length) {
          renderMedia(source,initial,true,'',{pitchOnly:true});
          slide.addImage({data:source.toDataURL('image/png'),...host.box});continue;
        }
        const video = await recordPitch({ duration: Math.max(500, segments.length * perStep), width:1008, height:816, render(canvas, elapsed) {
          const index=Math.min(segments.length-1,Math.floor(elapsed/perStep));
          const ratio=Math.min(1,(elapsed-index*perStep)/perStep);
          renderMedia(source, interpolateMedia(segments[index],ratio), true, '', {pitchOnly:true});
          canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
        }});
        slide.addMedia({type:'video',...video,...host.box,extn:'mp4'});
        continue;
      }
      if (host.slide && options.variant === 'gif') {
        slide.addImage({data: await animationGif(entry), ...host.box});
        continue;
      }
      if (!host.slide) {
      slide.background = { color: "1B2D52" };
      slide.addText(entry.title, {
        x: 0.5,
        y: 0.2,
        w: 12.3,
        h: 0.5,
        color: "FFFFFF",
        fontSize: 24,
        bold: true,
      });
      slide.addText("STADE MAYENNAIS · Démonstration · Cliquez pour lancer", {
        x: 0.5,
        y: 0.75,
        w: 12,
        h: 0.3,
        color: "E8B85F",
        fontSize: 12,
      });
      }
      const box = host.box || { x: 0.7, y: 1.3, w: 8, h: 5.7 };
      slide.addShape(pptx.ShapeType.rect, {
        ...box,
        fill: { color: host.slide ? (host.palette?.navy||"112C48") : "294D37" },
        line: { color: "FFFFFF", width: 1 },
      });
      slide.addShape(pptx.ShapeType.line, {
        x: box.x,
        y: box.y + box.h / 2,
        w: box.w,
        h: 0,
        line: { color: "FFFFFF", width: 1 },
      });
      if (host.slide) for (const right of [false,true]) slide.addShape(pptx.ShapeType.rect, {
        x:right?box.x+box.w*.84:box.x,y:box.y+box.h*.25,w:box.w*.16,h:box.h*.5,
        fill:{color:'112C48',transparency:100},line:{color:'FFFFFF',width:.7}
      });
      const radius = host.slide ? Math.min(box.w,box.h)*.12 : .6;
      slide.addShape(pptx.ShapeType.ellipse, {
        x: box.x + box.w / 2 - radius,
        y: box.y + box.h / 2 - radius,
        w: radius*2,
        h: radius*2,
        line: { color: "FFFFFF" },
        fill: { color: "294D37", transparency: 100 },
      });
      const diameter = host.slide ? Math.max(.18, Math.min(.38, box.w / 14, box.h / 8)) : .36;
      const tokens = [
        ...model.initial.tokens.filter(
          (t) => t.side !== "away" || model.initial.showOpponents !== false,
        ),
        { id: "ball", label: "●", ...model.initial.ball },
      ];
      const objects = {};
      tokens.forEach((t, index) => {
        const objectName = "demo-token-" + hostNumber + "-" + index;
        objects[t.id] = objectName;
        slide.addText(t.label, {
          objectName,
          x: box.x + ((100 - t.y) * box.w) / 100 - diameter / 2,
          y: box.y + (t.x * box.h) / 100 - diameter / 2,
          w: diameter,
          h: diameter,
          shape: pptx.ShapeType.ellipse,
          fit: "shrink",
          margin: 0,
          align: "center",
          valign: "mid",
          fontSize: host.slide ? Math.min(14,Math.max(8,diameter*40)) : t.label.length > 4 ? 7 : 11,
          color: t.id === "ball" ? "1B2D52" : "FFFFFF",
          fill: {
            color:
              t.id === "ball"
                ? (host.slide ? "FFFFFF" : "E8B85F")
                : t.side === "away"
                  ? (host.palette?.red||"E41F28")
                  : (host.palette?.blue||"2855A2"),
          },
          line: { color: "FFFFFF", width: 1 },
        });
      });
      if (!host.slide) model.steps.forEach((step, i) =>
        slide.addText(i + 1 + ". " + step.caption, {
          x: 9,
          y: 1.4 + i * Math.min(0.48, 5.4 / model.steps.length),
          w: 3.7,
          h: Math.min(0.46, 5.3 / model.steps.length),
          color: "FFFFFF",
          fontSize: model.steps.length > 6 ? 9 : 12,
          breakLine: false,
          fit: "shrink",
        }),
      );
      timings.push({ index: pptx._slides.indexOf(slide) + 1, model, objects, box });
    }
    const compatibleMedia = integrated ? options.hosts.filter(host => host.media).map(host => ({...host.media, host})) : [...bundle.media];
    if (!integrated) for (const entry of bundle.sequences)
      compatibleMedia.push({
        name: entry.title + " · Version animée pour Canva",
        type: "image/gif",
        data: await animationGif(entry),
      });
    for (const item of compatibleMedia) {
      const slide = item.host?.slide || pptx.addSlide();
      if (!item.host) {
      slide.background = { color: "1B2D52" };
      slide.addText(item.name, {
        x: 0.5,
        y: 0.2,
        w: 12,
        h: 0.5,
        color: "FFFFFF",
        fontSize: 23,
      });
      }
      const mediaBox = item.host?.box || {x:0.6,y:1,w:12.1,h:6.1};
      if (item.type === "image/gif" && options.variant === 'video')
        throw Error('Cette démonstration est un GIF : importez sa version MP4 pour utiliser pause et reprise.');
      if (item.type === "image/gif") {
        const image = new Image();
        image.src = item.data;
        await image.decode();
        const scale = Math.min(
          mediaBox.w / image.naturalWidth,
          mediaBox.h / image.naturalHeight,
        );
        const w = image.naturalWidth * scale,
          h = image.naturalHeight * scale;
        slide.addImage({
          data: item.data,
          x: mediaBox.x + (mediaBox.w - w) / 2,
          y: mediaBox.y + (mediaBox.h - h) / 2,
          w,
          h,
        });
      } else
        slide.addMedia({
          type: "video",
          data: item.data,
          ...mediaBox,
          extn: "mp4",
        });
    }
    if (!timings.length) return pptx;
    const originalWrite = pptx.write.bind(pptx);
    pptx.write = async (options) => {
      if (options?.outputType !== "blob")
        throw Error("Les démonstrations animées nécessitent un export Blob.");
      const blob = await originalWrite(options),
        zip = await JSZip.loadAsync(await blob.arrayBuffer());
      const groups = new Map();
      for (const timing of timings) { if(!groups.has(timing.index)) groups.set(timing.index, []); groups.get(timing.index).push(timing); }
      for (const [slideIndex, slideTimings] of groups) {
        const name = "ppt/slides/slide" + slideIndex + ".xml";
        const doc = new DOMParser().parseFromString(
          await zip.file(name).async("string"),
          "application/xml",
        );
        if (doc.querySelector("parsererror"))
          throw Error("Diapositive invalide.");
        const ns = "http://schemas.openxmlformats.org/presentationml/2006/main";
        const ids = {};
        for (const node of doc.getElementsByTagNameNS(ns, "cNvPr"))
          ids[node.getAttribute("name")] = node.getAttribute("id");
        let id = 10,
          delay = 0,
          nodes = "";
        for (const timing of slideTimings) {
        delay = 0;
        const base = [
          ...timing.model.initial.tokens,
          { id: "ball", ...timing.model.initial.ball },
        ];
        for (const step of timing.model.steps) {
          for (const path of step.paths) {
            const target = ids[timing.objects[path.id]];
            if (!target) continue;
            const origin = base.find((t) => t.id === path.id);
            const point = (p) =>
              (((origin.y - p.y) * timing.box.w) / 100 / 13.333333).toFixed(7) +
              " " +
              (((p.x - origin.x) * timing.box.h) / 100 / 7.5).toFixed(7);
            nodes += `<p:par><p:cTn id="${id++}" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst><p:animMotion origin="layout" pathEditMode="relative" path="M ${point(path.start)} L ${point(path.end)} E"><p:cBhvr additive="base"><p:cTn id="${id++}" dur="${step.duration}" fill="hold"/><p:tgtEl><p:spTgt spid="${target}"/></p:tgtEl></p:cBhvr></p:animMotion></p:childTnLst></p:cTn></p:par>`;
          }
          delay += step.duration;
        }
        }
        const xml = `<p:timing xmlns:p="${ns}"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${nodes}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
        const node = new DOMParser().parseFromString(
          xml,
          "application/xml",
        ).documentElement;
        doc.documentElement.appendChild(doc.importNode(node, true));
        zip.file(name, new XMLSerializer().serializeToString(doc));
      }
      return zip.generateAsync({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        compression: "DEFLATE",
      });
    };
    return pptx;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const dialog = document.createElement("dialog");
    dialog.className = "causerie-dialog";
    dialog.id = "causerie-demos";
    const heading = el("div", "section-heading"),
      title = el("h2", "", "Démonstrations de la causerie"),
      close = el("button", "icon-button", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Fermer les démonstrations");
    close.onclick = () => dialog.close();
    heading.append(title, close);
    dialog.append(heading);
    dialog.append(
      el(
        "p",
        "hint",
        "Sélectionnez vos séquences enregistrées : leurs déplacements seront ajoutés en trajectoires natives PowerPoint. Dans la présentation en 11 slides, choisissez la version GIF pour Canva et les phases de jeu dans « Présentation · 11 slides ». Vous pouvez aussi ajouter vos GIF / MP4 d’exercices. Les trajectoires PowerPoint ne sont pas garanties à l’import.",
      ),
    );
    const list = el("div"),
      status = el("p", "hint");
    status.setAttribute("role", "status");
    dialog.append(list);
    const label = el(
        "label",
        "",
        "Ajouter une démonstration GIF / MP4 (20 Mo maximum, 5 fichiers)",
      ),
      input = el("input");
    input.type = "file";
    input.accept = "image/gif,video/mp4";
    label.append(input);
    dialog.append(label, status);
    input.onchange = async () => {
      const owner = key(),
        file = input.files[0];
      input.value = "";
      if (!file) return;
      const items = media.get(owner) || [];
      if (
        !["image/gif", "video/mp4"].includes(file.type) ||
        file.size > 20 * 1024 * 1024 ||
        items.length >= 5
      ) {
        status.textContent =
          "Choisissez un GIF ou MP4 de 20 Mo maximum (5 fichiers maximum).";
        return;
      }
      try {
        const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
        const signature = String.fromCharCode(...bytes);
        if (
          file.type === "image/gif"
            ? !/^GIF8[79]a/.test(signature)
            : signature.slice(4, 8) !== "ftyp"
        )
          throw Error("Le contenu ne correspond pas au format annoncé.");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (key() !== owner) return;
        media.set(owner, [
          ...items,
          { name: file.name, type: file.type, data },
        ]);
        refresh();
      } catch (error) {
        status.textContent = error.message || "Fichier illisible.";
      }
    };
    function refresh() {
      simpleRefreshLibrary();
      list.replaceChildren();
      if (!simpleLibrary.length)
        list.append(
          el(
            "p",
            "hint",
            "Enregistrez une séquence dans le tableau tactique pour la retrouver ici.",
          ),
        );
      for (const entry of simpleLibrary) {
        const row = el("label", "causerie-option"),
          check = el("input");
        check.type = "checkbox";
        check.checked = selected().includes(entry.id);
        check.onchange = () => {
          const board = getCompositionBoard();
          const before = board.causerieAnimations;
          const entries = before || simpleLibrary.filter(e => selected().includes(e.id));
          board.causerieAnimations = check.checked
            ? [...entries.filter(e => e.id !== entry.id), structuredClone(entry)]
            : entries.filter(e => e.id !== entry.id);
          if (!persistTerrainWorkspace()) {
            if (before === undefined) delete board.causerieAnimations;
            else board.causerieAnimations = before;
            check.checked = selected().includes(entry.id);
            status.textContent = "Sélection non enregistrée. Réessayez.";
            return;
          }
          selections.set(key(), board.causerieAnimations.map(e => e.id));
        };
        row.append(check, document.createTextNode(entry.title));
        const gifButton = el("button", "export", "GIF pour Canva");
        gifButton.type = "button";
        gifButton.onclick = async () => {
          const owner = key(),
            frozen = structuredClone(entry);
          gifButton.disabled = true;
          status.textContent = "Création du GIF animé…";
          try {
            const data = await animationGif(frozen);
            if (owner !== key())
              throw Error(
                "Le document ou le compte a changé. Rouvrez les démonstrations.",
              );
            const blob = await (await fetch(data)).blob();
            mediaDownload(blob, namedDocumentFilename(frozen.title, "gif"));
            status.textContent =
              "GIF téléchargé : importez-le comme média dans Canva si l’import PPTX reste fixe.";
          } catch (error) {
            status.textContent = error.message || "Création du GIF impossible.";
          } finally {
            gifButton.disabled = false;
          }
        };
        const line = el("div");
        line.append(row, gifButton);
        list.append(line);
      }
      (media.get(key()) || []).forEach((item, index) => {
        const row = el("p", "", item.name + " "),
          remove = el("button", "", "Retirer");
        remove.type = "button";
        remove.onclick = () => {
          media.set(
            key(),
            (media.get(key()) || []).filter((_, i) => i !== index),
          );
          refresh();
        };
        row.append(remove);
        list.append(row);
      });
      status.textContent =
        "Sélection conservée pendant cette ouverture du site, pour ce coach, cette équipe et cette causerie. Les médias seront transmis à Canva uniquement lors de votre export explicite.";
    }
    document.body.append(dialog);
    const target = document.querySelector(".causerie-direct-actions");
    if (target) {
      const button = el("button", "export", "Démonstrations");
      button.type = "button";
      button.id = "causerie-demos-open";
      button.onclick = () => {
        refresh();
        dialog.showModal();
      };
      target.parentElement.append(button);
    }
  });
  window.causerieAnimations = {
    capture,
    frames,
    append,
    animationGif,
    clearCurrent: () => {
      selections.delete(key());
      media.delete(key());
      delete getCompositionBoard().causerieAnimations;
      delete getCompositionBoard().causerieSlideAnimations;
      delete getCompositionBoard().causerieSlideExercises;
    },
  };
})();
