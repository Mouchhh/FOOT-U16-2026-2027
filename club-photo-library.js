// Club photo library (per coach, this device): the photos offered in causeries.
// Stored in IndexedDB (photos are too heavy for localStorage), resized in the browser.
(() => {
  const DB = "club-photo-library",
    STORE = "photos",
    MAX = 30;
  let cache = [],
    loadedFor = null;
  const coach = () => (typeof activeCoach !== "undefined" ? activeCoach.id : "local");
  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(Error("IndexedDB indisponible"));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("coach", "coach");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode),
        result = fn(t.objectStore(STORE));
      t.oncomplete = () => {
        db.close();
        resolve(result?.result ?? result);
      };
      t.onerror = t.onabort = () => {
        db.close();
        reject(t.error || Error("Bibliothèque indisponible"));
      };
    });
  }
  async function list() {
    const owner = coach();
    const rows = await tx("readonly", (s) => s.index("coach").getAll(owner));
    cache = (rows || []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    loadedFor = owner;
    document.dispatchEvent(new CustomEvent("club-photos-updated"));
    return cache;
  }
  async function resize(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024)
      throw Error("Photo refusée : JPEG, PNG ou WebP de 20 Mo maximum.");
    const bitmap = await createImageBitmap(file);
    try {
      // 1600 px maximum, re-encoded in JPEG: no EXIF metadata is kept.
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.8);
    } finally {
      bitmap.close();
    }
  }
  async function add(files) {
    const owner = coach(),
      current = await list(),
      room = MAX - current.length;
    if (room <= 0) throw Error(MAX + " photos maximum dans la bibliothèque.");
    const accepted = [...files].slice(0, room),
      rows = [];
    for (const file of accepted) {
      const id = crypto.randomUUID();
      rows.push({
        key: owner + ":" + id,
        id,
        coach: owner,
        name: String(file.name || "Photo").replace(/\.[a-z0-9]+$/i, "").slice(0, 60) || "Photo",
        data: await resize(file),
        createdAt: new Date().toISOString(),
      });
    }
    // The limit is enforced again inside the write transaction (other tabs, other batches).
    let stored = 0;
    await tx("readwrite", (store) => {
      const count = store.index("coach").count(owner);
      count.onsuccess = () => {
        const free = Math.max(0, MAX - count.result);
        rows.slice(0, free).forEach((r) => store.put(r));
        stored = Math.min(free, rows.length);
      };
    });
    await list();
    return { added: stored, skipped: files.length - stored };
  }
  async function rename(id, name) {
    const owner = coach(),
      row = cache.find((r) => r.id === id);
    if (!row) return;
    await tx("readwrite", (s) => s.put({ ...row, coach: owner, name: String(name).trim().slice(0, 60) || "Photo" }));
    await list();
  }
  async function remove(id) {
    await tx("readwrite", (s) => s.delete(coach() + ":" + id));
    await list();
  }
  window.clubPhotoLibrary = {
    list,
    add,
    rename,
    remove,
    max: MAX,
    cached: () => (loadedFor === coach() ? cache : []),
  };
  list().catch(() => {});
  document.addEventListener("club-session-ready", () => list().catch(() => {}));

  // Paramètres → Détails du club : section « Bibliothèque photos ».
  if (typeof coachAccountRenderClub === "function") {
    const renderBefore = coachAccountRenderClub;
    coachAccountRenderClub = function (options) {
      const value = renderBefore.apply(this, arguments);
      const section = el("section", "club-photo-library"),
        status = el("p", "hint"),
        grid = el("div", "club-photo-grid"),
        label = el("label", "report-field", "Ajouter des photos"),
        input = el("input");
      status.setAttribute("role", "status");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";
      input.multiple = true;
      input.setAttribute("aria-label", "Ajouter des photos à la bibliothèque du club");
      label.append(input);
      section.append(
        el("h3", "", "Bibliothèque photos"),
        el("p", "hint", "Ces photos sont proposées dans vos causeries (photos des slides). Enregistrées tout de suite sur cet appareil, " + MAX + " maximum."),
        label,
        status,
        grid,
      );
      options.panel.append(section);
      function paint() {
        grid.replaceChildren();
        const rows = window.clubPhotoLibrary.cached();
        if (!rows.length) grid.append(el("p", "hint", "Aucune photo : les causeries utilisent les photos d’origine du club."));
        for (const row of rows) {
          const item = el("div", "club-photo-item"),
            img = el("img"),
            name = el("input"),
            del = el("button", "", "Supprimer");
          img.src = row.data;
          img.alt = row.name;
          name.value = row.name;
          name.maxLength = 60;
          name.setAttribute("aria-label", "Nom de la photo " + row.name);
          name.onchange = () => window.clubPhotoLibrary.rename(row.id, name.value).catch((e) => (status.textContent = e.message));
          del.type = "button";
          del.setAttribute("aria-label", "Supprimer la photo " + row.name);
          del.onclick = () => {
            if (!confirm("Supprimer la photo « " + row.name + " » de la bibliothèque ?")) return;
            window.clubPhotoLibrary.remove(row.id).catch((e) => (status.textContent = e.message));
          };
          item.append(img, name, del);
          grid.append(item);
        }
      }
      input.onchange = async () => {
        if (!input.files.length) return;
        status.textContent = "Préparation des photos…";
        input.disabled = true;
        try {
          const { added, skipped } = await window.clubPhotoLibrary.add(input.files);
          status.textContent = added + " photo(s) ajoutée(s)." + (skipped ? " " + skipped + " ignorée(s) : bibliothèque pleine." : "");
        } catch (error) {
          status.textContent = error.message || "Photos non ajoutées.";
        }
        input.value = "";
        input.disabled = false;
      };
      document.addEventListener("club-photos-updated", paint);
      paint();
      window.clubPhotoLibrary.list().catch(() => {
        status.textContent = "Bibliothèque indisponible dans ce navigateur (navigation privée ?).";
      });
      return value;
    };
  }
})();
