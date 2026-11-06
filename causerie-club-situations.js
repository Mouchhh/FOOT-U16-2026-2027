// Immutable snapshots of saved coach creations; never rewrite source exercises.
(() => {
  const phaseKeys = ["defensive", "offDef", "offensive", "defOff"];
  const previousValid = valid;
  valid = function (board) {
    return (
      previousValid(board) &&
      (board.causerieSlideExercises === undefined ||
        (board.causerieSlideExercises &&
          typeof board.causerieSlideExercises === "object" &&
          phaseKeys.every(
            (key) =>
              Array.isArray(board.causerieSlideExercises[key]) &&
              board.causerieSlideExercises[key].length <= 4 &&
              board.causerieSlideExercises[key].every(
                (e) =>
                  e &&
                  typeof e.id === "string" &&
                  e.id.length <= 180 &&
                  typeof e.title === "string" &&
                  e.title.length <= 100 &&
                  trainingCustomValid(e.custom),
              ),
          )))
    );
  };
  function exercises() {
    const rows = [],
      seen = new Set();
    let deleted;
    try {
      deleted = new Set(trainingPersonalExerciseStore().deleted);
    } catch {
      return rows;
    }
    const add = (block, label) => {
      if (
        block?.exerciseId !== "custom" ||
        !trainingCustomValid(block.custom) ||
        deleted.has(trainingPersonalExerciseKey(block))
      )
        return;
      const signature = trainingPersonalExerciseSignature(block);
      if (seen.has(signature)) return;
      seen.add(signature);
      rows.push({
        id: "exercise:" + trainingPersonalExerciseKey(block),
        title: block.custom.title,
        custom: structuredClone(block.custom),
        label,
      });
    };
    for (const record of trainingStoredPersonalExercises())
      add(record.block, record.label);
    for (const session of trainingLibrary.filter(
      (s) => trainingValid(s) && coachTeamOwns(s),
    ))
      for (const block of session.blocks)
        add(block, session.title || session.team);
    for (const row of clubNetworkRows)
      if (
        row.kind === "training" &&
        row.owner_id === clubNetworkSession?.user?.id &&
        trainingValid(row.payload) &&
        coachTeamOwns(row.payload)
      )
        for (const block of row.payload.blocks) add(block, row.title);
    return rows;
  }
  function animations() {
    const rows = tacticalAnimationLibrary.entries().filter((r) => r.local);
    for (const row of clubNetworkRows)
      if (
        row.owner_id === clubNetworkSession?.user?.id &&
        row.kind === "composition" &&
        simpleExplanationValid(row.payload) &&
        coachTeamOwns(row.payload) &&
        !rows.some((r) => r.entry.id === row.payload.pionExplanation.id)
      )
        rows.push({ entry: row.payload.pionExplanation, local: false });
    return rows;
  }
  async function diagram(custom) {
    const board = custom.board;
    if (!board) return null;
    if (!validExerciseBoard(board)) throw Error("Schéma d’exercice invalide.");
    const canvas = document.createElement("canvas");
    drawExerciseBoard(canvas, board);
    if (board.frames.length === 1) return canvas.toDataURL("image/png");
    const { GIFEncoder, quantize, applyPalette } =
        await import("./vendor/gifenc/gifenc.esm.js"),
      gif = GIFEncoder(),
      small = document.createElement("canvas");
    small.width = 576;
    small.height = 360;
    const ctx = small.getContext("2d", { willReadFrequently: true });
    const steps = 4,
      delay = Math.max(60, Math.round((board.seconds * 1000) / steps));
    for (let index = 0; index < board.frames.length - 1; index++)
      for (let step = 0; step < steps; step++) {
        const t = step / steps,
          from = board.frames[index].objects,
          to = board.frames[index + 1].objects;
        const objects = from.map((o) => {
          const target = to.find((p) => p.id === o.id);
          return {
            ...o,
            x: o.x + (target.x - o.x) * t,
            y: o.y + (target.y - o.y) * t,
            rotation: o.rotation + (target.rotation - o.rotation) * t,
            scale: o.scale + (target.scale - o.scale) * t,
          };
        });
        drawExerciseBoard(canvas, board, objects);
        ctx.drawImage(canvas, 0, 0, 576, 360);
        const rgba = ctx.getImageData(0, 0, 576, 360).data,
          palette = quantize(rgba, 128);
        gif.writeFrame(applyPalette(rgba, palette), 576, 360, {
          palette,
          delay,
          repeat: 0,
        });
      }
    drawExerciseBoard(canvas, board, board.frames.at(-1).objects);
    ctx.drawImage(canvas, 0, 0, 576, 360);
    const rgba = ctx.getImageData(0, 0, 576, 360).data,
      palette = quantize(rgba, 128);
    gif.writeFrame(applyPalette(rgba, palette), 576, 360, {
      palette,
      delay: 1000,
    });
    gif.finish();
    let binary = "";
    for (const byte of gif.bytes()) binary += String.fromCharCode(byte);
    return "data:image/gif;base64," + btoa(binary);
  }
  async function append(pptx, hosts, { variant = "gif" } = {}) {
    for (const host of hosts) {
      const custom = host.exercise.custom, box = host.box;
      if (variant === 'video' && custom.board?.frames.length > 1) {
        const { recordPitch } = await import('./causerie-video.js');
        const board=structuredClone(custom.board),source=document.createElement('canvas');
        const video=await recordPitch({duration:(board.frames.length-1)*board.seconds*1000,width:1152,height:720,render(canvas,elapsed){
          drawExerciseBoard(source,board,exerciseInterpolated(board,elapsed/(board.seconds*1000)));
          canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
        }});
        host.slide.addMedia({type:'video',...video,...box,extn:'mp4'});
      } else {
      const data = await diagram(custom);
      if (data) host.slide.addImage({ data, ...box });
      else
        host.slide.addText(
          [custom.goal, custom.organisation, custom.instructions]
            .filter(Boolean)
            .join("\n\n") || "Aucun schéma enregistré pour cet exercice.",
          { ...box, fontSize: 12, color: "09182A", margin: 0, fit: "shrink" },
        );
      }
      host.slide.addNotes(
        [
          custom.title,
          custom.goal,
          custom.organisation,
          custom.instructions,
          custom.material,
          custom.success,
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    }
    return pptx;
  }
  window.causerieClubSituations = { exercises, animations, append, diagram };
  document.addEventListener("DOMContentLoaded", () => {
    const shelf = el("section", "club-causerie-exercises");
    shelf.id = "club-causerie-exercises";
    shelf.append(el("h2", "", "Mes exercices pour les causeries"));
    const list = el("div");
    shelf.append(list);
    workspaceFlows.club.pages[1].append(shelf);
    function paint() {
      list.replaceChildren();
      for (const entry of exercises()) {
        const row = el("p");
        row.append(
          el("strong", "", entry.title),
          document.createTextNode(" · " + entry.label),
        );
        list.append(row);
      }
      if (!list.children.length)
        list.append(
          el(
            "p",
            "hint",
            "Enregistrez vos créations d’exercices pour les retrouver dans les phases de votre causerie.",
          ),
        );
    }
    const openClub = workspaceFlows.club.go;
    workspaceFlows.club.go = function (...args) {
      const result = openClub.apply(this, args);
      paint();
      return result;
    };
    const before = clubNetworkRenderRows;
    clubNetworkRenderRows = function (...args) {
      const result = before.apply(this, args);
      paint();
      return result;
    };
    paint();
  });
})();
