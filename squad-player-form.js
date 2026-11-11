// One player profile form shared by « Mes joueurs » and the composition picker.
// A profile never stores a shirt number: numbers belong to each match composition.
function squadPlayerForm(options = {}) {
  const root = el("div", "squad-player-form");
  const field = (label, max, extra = "") => {
    const wrap = el("label", "report-field" + extra, label),
      input = el("input");
    input.type = "text";
    input.maxLength = max;
    input.setAttribute("aria-label", label);
    wrap.append(input);
    root.append(wrap);
    return input;
  };
  const first = field("Prénom", 25),
    last = field("Nom (facultatif)", 25),
    nickname = field("Surnom (facultatif)", 20),
    license = field("Numéro de licence (facultatif)", 20, " squad-player-form-wide");
  first.required = true;
  first.autocomplete = "given-name";
  last.autocomplete = "family-name";
  license.inputMode = "numeric";
  license.pattern = "[A-Za-z0-9 \\-]*";
  const positions = el("fieldset", "squad-player-positions");
  positions.append(el("legend", "", "Postes (un ou plusieurs)"));
  root.append(positions);
  const footLabel = el("label", "report-field squad-player-form-wide", "Pied préféré"),
    foot = el("select");
  foot.setAttribute("aria-label", "Pied préféré");
  for (const [value, label] of [
    ["", "Non précisé"],
    ["Droit", "Droit"],
    ["Gauche", "Gauche"],
    ["Les deux", "Les deux"],
  ])
    foot.append(new Option(label, value));
  footLabel.append(foot);
  root.append(footLabel);
  const photoLabel = el(
      "label",
      "report-field squad-player-form-wide",
      "Photo du joueur (facultatif)",
    ),
    file = el("input");
  file.type = "file";
  file.accept = "image/*";
  file.setAttribute("aria-label", "Photo du joueur (facultatif)");
  photoLabel.append(file);
  const preview = el("img", "squad-photo-preview");
  preview.alt = "Photo du joueur";
  preview.hidden = true;
  const removePhoto = el("button", "export", "Retirer la photo");
  removePhoto.type = "button";
  removePhoto.hidden = true;
  root.append(photoLabel, preview, removePhoto);
  let photo = "",
    version = 0,
    pending = false;
  const busy = (on) => {
    pending = on;
    options.onBusy?.(on);
  };
  const showPhoto = () => {
    preview.hidden = removePhoto.hidden = !photo;
    if (photo) preview.src = photo;
    else preview.removeAttribute("src");
  };
  removePhoto.onclick = () => {
    version++;
    photo = "";
    file.value = "";
    busy(false);
    showPhoto();
  };
  file.onchange = async () => {
    const image = file.files[0];
    if (!image) return;
    if (!image.type.startsWith("image/") || image.size > 15 * 1024 * 1024)
      return options.message?.("Choisissez une photo de moins de 15 Mo.");
    const current = ++version;
    busy(true);
    let bitmap;
    try {
      bitmap = await createImageBitmap(image);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 180;
      const side = Math.min(bitmap.width, bitmap.height);
      canvas
        .getContext("2d")
        .drawImage(
          bitmap,
          (bitmap.width - side) / 2,
          (bitmap.height - side) / 2,
          side,
          side,
          0,
          0,
          180,
          180,
        );
      if (current !== version || options.alive?.() === false) return;
      photo = canvas.toDataURL("image/jpeg", 0.72);
      showPhoto();
    } catch {
      if (current === version)
        options.message?.("Photo illisible : essayez un JPEG ou un PNG.");
    } finally {
      bitmap?.close();
      if (current === version) busy(false);
    }
  };
  function renderPositions(selected) {
    positions.querySelectorAll("label").forEach((n) => n.remove());
    const values = [
      ...squadPositions,
      ...selected.filter((p) => !squadPositions.includes(p)),
    ];
    for (const value of values) {
      const label = el("label", "squad-player-position"),
        box = el("input");
      box.type = "checkbox";
      box.value = value;
      box.checked = selected.includes(value);
      label.append(box, document.createTextNode(" " + value));
      positions.append(label);
    }
  }
  return {
    root,
    fill(player) {
      const split = squadSplitName(player);
      first.value = split.firstName;
      last.value = split.lastName;
      nickname.value = player?.nickname || "";
      license.value = player?.license || "";
      foot.value = player?.foot || "";
      renderPositions(squadPlayerPositions(player));
      photo = player?.photo || "";
      version++;
      file.value = "";
      busy(false);
      showPhoto();
      for (const input of root.querySelectorAll("input,select,button"))
        input.disabled = false;
    },
    busy: () => pending,
    focus: () => first.focus(),
    disable() {
      for (const input of root.querySelectorAll("input,select,button"))
        input.disabled = true;
    },
    validate() {
      if (!first.value.trim()) return "Renseignez le prénom du joueur.";
      if ((first.value.trim() + " " + last.value.trim()).trim().length > 25)
        return "Le prénom et le nom réunis doivent tenir sur 25 caractères.";
      if (license.value.trim() && !/^[A-Za-z0-9 -]{1,20}$/.test(license.value.trim()))
        return "Le numéro de licence ne contient que des chiffres et des lettres.";
      if (squadPlayerFormPositions(positions).length > 4)
        return "Choisissez 4 postes au maximum.";
      return "";
    },
    value() {
      const firstName = first.value.trim(),
        lastName = last.value.trim(),
        chosen = squadPlayerFormPositions(positions);
      return {
        name: (firstName + " " + lastName).trim(),
        firstName,
        lastName,
        nickname: nickname.value.trim(),
        license: license.value.trim(),
        positions: chosen,
        position: chosen[0] || "",
        foot: foot.value,
        photo,
      };
    },
  };
}
function squadPlayerFormPositions(fieldset) {
  return [...fieldset.querySelectorAll("input:checked")].map((b) => b.value);
}
