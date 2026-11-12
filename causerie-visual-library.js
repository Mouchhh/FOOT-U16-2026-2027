// Persistent browser-local media, isolated by authenticated account, coach and team.
(() => {
  const roles = {
    auto: "Placement automatique",
    1: "Couverture",
    2: "Composition",
    3: "Contexte",
    4: "Adversaire",
    5: "Idées fortes",
    6: "Animation défensive",
    7: "Transition OFF / DEF",
    8: "Animation offensive",
    9: "Transition DEF / OFF",
    10: "CPA",
    11: "Conclusion",
  };
  const club = [
    ["celebration-equipe", "Célébration de l’équipe"],
    ["celebration-jeunes", "Célébration des jeunes"],
    ["cercle-equipe", "Rassemblement"],
    ["groupe-piste", "Groupe sur la piste"],
    ["groupe-rouge", "Groupe du club"],
    ["action-ballon", "Action avec ballon"],
    ["atelier-entrainement", "Entraînement"],
    ["course-match", "Course en match"],
    ["duel-match", "Duel"],
    ["echange-joueurs", "Échange entre joueurs"],
    ["encadrement", "Encadrement"],
    ["entree-terrain", "Entrée sur le terrain"],
  ].map(([id, name]) => ({
    id: "club:" + id,
    name,
    url: "assets/photos/" + id + ".jpg",
    personal: false,
  }));
  const owner = () =>
    JSON.stringify([
      clubNetworkSession?.user?.id || "local",
      activeCoach.id,
      activeCoachTeam.id,
    ]);
  let database,
    transfer = Promise.resolve();
  function db() {
    return (
      database ||
      (database = new Promise((resolve, reject) => {
        const req = indexedDB.open("stade-causerie-visuals", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("libraries");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(Error("Stockage des visuels indisponible."));
      }))
    );
  }
  async function read(key) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("libraries"),
        req = tx.objectStore("libraries").get(key);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(Error("Lecture des visuels impossible."));
    });
  }
  async function mutate(key, change) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("libraries", "readwrite"),
        store = tx.objectStore("libraries"),
        req = store.get(key);
      let value;
      req.onsuccess = () => {
        try {
          value = change(req.result || []);
          store.put(value, key);
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
      tx.oncomplete = () => resolve(value);
      tx.onabort = tx.onerror = () =>
        reject(Error("Visuels non enregistrés. Vérifiez l’espace disponible."));
    });
  }
  // Photos of the club library (Paramètres → Détails du club) replace the original
  // club photos on the cover, context, ideas, set pieces and conclusion slides.
  const libraryPhotos = () =>
    (window.clubPhotoLibrary?.cached() || []).map((p) => ({ id: "library:" + p.id, name: p.name, data: p.data, personal: false }));
  function clubDefaults() {
    const library = libraryPhotos();
    if (!library.length)
      return { 1: club[0].id, 3: "club:echange-joueurs", 5: "club:entree-terrain", 10: "club:encadrement", 11: "club:cercle-equipe" };
    return Object.fromEntries([1, 11, 3, 5, 10].map((slide, i) => [slide, library[i % library.length].id]));
  }
  function assign(items) {
    const choices = clubDefaults(),
      slots = [1, 11, 3, 4, 5, 10, 2, 6, 7, 8, 9],
      used = new Set();
    for (const item of items.filter((i) => i.role !== "auto")) {
      if (!used.has(item.role)) {
        choices[item.role] = item.id;
        used.add(item.role);
      }
    }
    for (const item of items.filter((i) => i.role === "auto")) {
      const slide = slots.find((n) => !used.has(String(n)));
      if (!slide) break;
      choices[slide] = item.id;
      used.add(String(slide));
    }
    return { choices, items: structuredClone(items) };
  }
  async function decode(url) {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  }
  function crop(image, ratio, contain = false) {
    const canvas = document.createElement("canvas");
    canvas.width = ratio < 1 ? 780 : 1440;
    canvas.height = Math.round(canvas.width / ratio);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#09182A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = (contain ? Math.min : Math.max)(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight,
      ),
      w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    ctx.drawImage(
      image,
      (canvas.width - w) / 2,
      contain ? (canvas.height - h) / 2 : (canvas.height - h) * 0.3,
      w,
      h,
    );
    return canvas.toDataURL("image/jpeg", 0.88);
  }
  window.causerieExportPhotos = {
    capture() {
      return { automatic: true, owner: owner() };
    },
    async resolve(snapshot) {
      if (snapshot?.owner && snapshot.owner !== owner())
        throw Error("Le compte ou l’équipe a changé. Relancez l’export.");
      await transfer;
      const context = owner(),
        spec = snapshot?.automatic
          ? assign(await read(context))
          : snapshot || assign([]),
        all = [...libraryPhotos(), ...club, ...(spec.items || [])],
        result = {},
        loaded = new Map();
      for (const [n, id] of Object.entries(spec.choices || {})) {
        const source = all.find((i) => i.id === id);
        if (!source) throw Error("Un visuel de la causerie est introuvable.");
        if (!loaded.has(id)) {
          const image = await decode(source.data || source.url);
          loaded.set(id, {
            portrait: crop(image, 4.433333 / 7.5, source.personal),
            landscape: crop(image, 2.4 / 1.3, source.personal),
          });
        }
        result[n] = loaded.get(id);
      }
      if (context !== owner())
        throw Error("Le compte ou l’équipe a changé. Relancez l’export.");
      return result;
    },
    open: () => window.causerieVisualLibrary.open(),
  };
  document.addEventListener("DOMContentLoaded", () => {
    const panel = el("dialog", "completion-dialog causerie-visual-library");
    panel.id = "causerie-visual-library";
    panel.setAttribute("aria-labelledby", "causerie-visual-title");
    const heading = el("div", "section-heading"),
      title = el("h2", "", "Visuels de causerie"),
      close = el("button", "external-modal-close", "×");
    title.id = "causerie-visual-title";
    close.type = "button";
    close.setAttribute("aria-label", "Fermer les visuels");
    close.onclick = () => {
      panel.close();
      $("coach-account-open").focus();
    };
    heading.append(title, close);
    const help = el(
      "p",
      "hint",
      "Déposez vos photos, fonds ou schémas une seule fois. Ils seront insérés automatiquement dans les prochaines causeries de cette équipe. Conservés dans ce navigateur, sans envoi au club. Choisissez un usage pour un placement précis ; le premier visuel de cet usage sera utilisé.",
    );
    const label = el(
        "label",
        "causerie-visual-drop",
        "Ajouter des visuels ou déposer vos fichiers ici",
      ),
      input = el("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/jpeg,image/png,image/webp";
    input.setAttribute("aria-label", "Ajouter des visuels de causerie");
    label.append(input);
    const list = el("div", "causerie-visual-grid"),
      status = el("p", "hint");
    status.setAttribute("role", "status");
    panel.append(heading, help, label, status, list);
    document.body.append(panel);
    let opened = "",
      busy = false;
    async function paint() {
      const context = opened;
      try {
        const items = await read(context);
        if (context !== owner() || opened !== context || !panel.open) return;
        list.replaceChildren();
        for (const item of items) {
          const row = el("article", "causerie-visual-item"),
            image = el("img"),
            name = el("strong", "", item.name),
            select = el("select"),
            remove = el("button", "export", "Supprimer");
          image.src = item.data;
          image.alt = item.name;
          select.setAttribute("aria-label", "Usage · " + item.name);
          for (const [id, text] of Object.entries(roles))
            select.append(new Option(text, id));
          select.value = item.role;
          select.disabled = busy;
          remove.type = "button";
          remove.disabled = busy;
          select.onchange = async () => {
            if (context !== owner()) return;
            try {
              await mutate(context, (rows) =>
                rows.map((r) =>
                  r.id === item.id ? { ...r, role: select.value } : r,
                ),
              );
              if (context !== owner()) return;
              status.textContent =
                "Usage enregistré. Placement automatique prêt.";
              await paint();
            } catch (error) {
              status.textContent = error.message;
            }
          };
          remove.onclick = async () => {
            if (context !== owner()) return;
            try {
              await mutate(context, (rows) =>
                rows.filter((r) => r.id !== item.id),
              );
              if (context !== owner()) return;
              status.textContent = "Visuel retiré de la bibliothèque.";
              await paint();
            } catch (error) {
              status.textContent = error.message;
            }
          };
          row.append(image, name, select, remove);
          list.append(row);
        }
        if (!items.length)
          list.append(
            el(
              "p",
              "hint",
              "Aucun visuel personnel. Les photos du club seront utilisées pour la couverture et la conclusion.",
            ),
          );
      } catch (error) {
        status.textContent = error.message;
      }
    }
    async function upload(files) {
      if (busy || opened !== owner()) return;
      const context = opened;
      busy = true;
      input.disabled = true;
      status.textContent = "Préparation et enregistrement des visuels…";
      await paint();
      try {
        const batch = [];
        if (files.length > 30) throw Error("30 visuels maximum par équipe.");
        for (const file of files) {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 20 * 1024 * 1024
          )
            throw Error(
              "Utilisez des images JPG, PNG ou WebP de moins de 20 Mo.",
            );
          const url = URL.createObjectURL(file);
          try {
            const image = await decode(url);
            if (image.naturalWidth * image.naturalHeight > 60000000)
              throw Error(
                "Image trop grande : utilisez moins de 60 mégapixels.",
              );
            const canvas = document.createElement("canvas"),
              scale = Math.min(
                1,
                1600 / Math.max(image.naturalWidth, image.naturalHeight),
              );
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(
              1,
              Math.round(image.naturalHeight * scale),
            );
            canvas
              .getContext("2d")
              .drawImage(image, 0, 0, canvas.width, canvas.height);
            batch.push({
              id: crypto.randomUUID(),
              name: file.name.slice(0, 100),
              data: canvas.toDataURL("image/png"),
              role: "auto",
              personal: true,
            });
          } finally {
            URL.revokeObjectURL(url);
          }
        }
        if (context !== owner())
          throw Error("L’équipe a changé. Aucun visuel ajouté.");
        await mutate(context, (rows) => {
          if (rows.length + batch.length > 30)
            throw Error("30 visuels maximum par équipe.");
          const next = [...rows, ...batch];
          if (next.reduce((n, i) => n + i.data.length, 0) > 40 * 1024 * 1024)
            throw Error(
              "Bibliothèque limitée à 40 Mo. Retirez des visuels avant de continuer.",
            );
          return next;
        });
        if (context === owner())
          status.textContent =
            batch.length +
            " visuel(s) enregistré(s). Les prochains exports les utiliseront automatiquement.";
      } catch (error) {
        if (context === owner()) status.textContent = error.message;
      } finally {
        busy = false;
        input.disabled = false;
        input.value = "";
        if (context === owner()) await paint();
      }
    }
    input.onchange = () => {
      if (!busy) transfer = upload([...input.files]);
    };
    label.ondragover = (e) => {
      e.preventDefault();
      label.classList.add("drag-over");
    };
    label.ondragleave = () => label.classList.remove("drag-over");
    label.ondrop = (e) => {
      e.preventDefault();
      label.classList.remove("drag-over");
      if (!busy) transfer = upload([...e.dataTransfer.files]);
    };
    const launch = el("button", "export", "Visuels de causerie");
    launch.type = "button";
    launch.id = "causerie-visual-settings";
    launch.onclick = () => {
      const settings = $("settings-menu");
      settings.hidden = true;
      $("coach-account-open").setAttribute("aria-expanded", "false");
      opened = owner();
      status.textContent = "";
      panel.showModal();
      paint();
    };
    document.querySelector(".settings-preferences").append(launch);
    const shortcut = el("button", "export", "Gérer mes visuels");
    shortcut.type = "button";
    shortcut.onclick = () => launch.click();
    document.querySelector(".causerie-direct-actions").after(shortcut);
    window.causerieVisualLibrary = {
      open: () => launch.click(),
      read: () => read(owner()),
      assign,
    };
    $("causerie-download").onclick = () => causerieExport.downloadCurrent();
    const oldClear = clubNetworkClear;
    clubNetworkClear = function (...args) {
      if (panel.open) panel.close();
      opened = "";
      return oldClear.apply(this, args);
    };
  });
})();
