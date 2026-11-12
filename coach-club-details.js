// The coach's local club directory is shared by their teams, never an implicit club-wide update.
const coachClubDetailsKey = "vestiaire-club-details";
function coachClubDetailsDefaults() {
  return {
    version: 1,
    name: "Club démo",
    city: "",
    stadium: "",
    email: "",
    phone: "",
    contacts: [
      { department: "Bureau", name: "", role: "", email: "", phone: "" },
      {
        department: "Direction sportive",
        name: "",
        role: "",
        email: "",
        phone: "",
      },
    ],
  };
}
function coachClubDetailsValid(value) {
  const text = (v, n) => typeof v === "string" && v.length <= n,
    email = (v) => text(v, 254) && (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  return (
    value &&
    value.version === 1 &&
    text(value.name, 70) &&
    value.name.trim().length > 0 &&
    text(value.city, 80) &&
    text(value.stadium, 120) &&
    email(value.email) &&
    text(value.phone, 40) &&
    // Club identity (optional): colours applied to the site and logo.
    (value.primaryColor === undefined || /^#[0-9a-f]{6}$/i.test(value.primaryColor)) &&
    (value.secondaryColor === undefined || /^#[0-9a-f]{6}$/i.test(value.secondaryColor)) &&
    (value.logo === undefined ||
      (typeof value.logo === "string" &&
        value.logo.length <= 200000 &&
        /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(value.logo))) &&
    Array.isArray(value.contacts) &&
    value.contacts.length <= 12 &&
    value.contacts.every(
      (c) =>
        c &&
        ["Bureau", "Direction sportive", "Autre contact"].includes(
          c.department,
        ) &&
        text(c.name, 70) &&
        text(c.role, 80) &&
        email(c.email) &&
        text(c.phone, 40),
    )
  );
}
function coachClubDetailsRead() {
  try {
    const value = JSON.parse(coachStorageGet(coachClubDetailsKey) || "null");
    return coachClubDetailsValid(value) ? value : coachClubDetailsDefaults();
  } catch {
    return coachClubDetailsDefaults();
  }
}
function coachAccountRenderClub({
  panel,
  formIn,
  field,
  submit,
  dirty,
  owner,
}) {
  const data = coachClubDetailsRead(),
    brand = el("div", "account-club-brand"),
    logo = el("img");
  let logoValue = data.logo || "";
  const showLogo = () => {
    logo.src = logoValue || "assets/cruza-logo.svg";
    logo.alt = logoValue ? "Logo du club" : "Logo du Club démo";
  };
  showLogo();
  logo.width = 80;
  logo.height = 80;
  const identity = el("div");
  identity.append(
    el("h3", "", "Identité du club"),
    el("p", "hint", "Logo et couleurs du club : ils s’appliquent à tout le site sur cet appareil."),
  );
  brand.append(logo, identity);
  panel.append(brand);
  const pf = formIn("club", panel),
    name = field(pf.form, "Nom du club", "text", data.name, 70, true),
    city = field(pf.form, "Ville", "text", data.city, 80),
    stadium = field(pf.form, "Nom du stade", "text", data.stadium, 120),
    email = field(pf.form, "E-mail du club", "email", data.email, 254),
    phone = field(pf.form, "Téléphone du club", "tel", data.phone, 40);
  // Colours and logo, saved with the club sheet.
  const identityBox = el("fieldset", "account-club-identity");
  identityBox.append(el("legend", "", "Couleurs et logo du club"));
  const colorField = (label, value, fallback) => {
    const wrap = el("label", "report-field account-club-color", label),
      input = el("input"),
      applied = el("small", "hint");
    input.type = "color";
    input.value = value || fallback;
    input.setAttribute("aria-label", label);
    const paint = () => {
      const used = clubTheme.readable(input.value);
      applied.textContent = used.toLowerCase() === input.value.toLowerCase() ? "" : "Assombrie à " + used + " pour garder le texte blanc lisible.";
    };
    input.oninput = () => {
      dirty.add("club");
      paint();
    };
    paint();
    wrap.append(input, applied);
    identityBox.append(wrap);
    return input;
  };
  const primary = colorField("Couleur principale", data.primaryColor, clubTheme.defaults.primary),
    secondary = colorField("Couleur secondaire", data.secondaryColor, clubTheme.defaults.secondary),
    reset = el("button", "export", "Couleurs d’origine"),
    logoLabel = el("label", "report-field", "Logo du club (PNG ou JPEG)"),
    logoInput = el("input"),
    logoRemove = el("button", "export", "Retirer le logo");
  reset.type = logoRemove.type = "button";
  reset.onclick = () => {
    primary.value = clubTheme.defaults.primary;
    secondary.value = clubTheme.defaults.secondary;
    primary.oninput();
    secondary.oninput();
  };
  logoInput.type = "file";
  logoInput.accept = "image/png,image/jpeg,image/webp";
  logoInput.setAttribute("aria-label", "Logo du club");
  logoLabel.append(logoInput);
  logoRemove.hidden = !logoValue;
  logoRemove.onclick = () => {
    logoValue = "";
    logoInput.value = "";
    logoRemove.hidden = true;
    showLogo();
    dirty.add("club");
  };
  logoInput.onchange = async () => {
    const file = logoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return (pf.status.textContent = "Choisissez une image de moins de 15 Mo.");
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas"),
        side = 256,
        scale = Math.min(side / bitmap.width, side / bitmap.height);
      canvas.width = canvas.height = side;
      const w = Math.round(bitmap.width * scale),
        h = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, (side - w) / 2, (side - h) / 2, w, h);
      // PNG keeps a transparent background; JPEG if the PNG is too heavy.
      let value = canvas.toDataURL("image/png");
      if (value.length > 200000) value = canvas.toDataURL("image/jpeg", 0.85);
      logoValue = value;
      logoRemove.hidden = false;
      showLogo();
      dirty.add("club");
    } catch {
      pf.status.textContent = "Image illisible : essayez un PNG ou un JPEG.";
    } finally {
      bitmap?.close();
    }
  };
  identityBox.append(reset, logoLabel, logoRemove);
  pf.form.prepend(identityBox);
  city.placeholder = "À renseigner";
  stadium.placeholder = "À renseigner";
  phone.autocomplete = "tel";
  email.autocomplete = "email";
  const contacts = el("div", "account-club-contacts"),
    rows = [];
  contacts.append(el("h3", "", "Contacts utiles"));
  pf.form.append(contacts);
  function contactRow(contact) {
    const card = el("fieldset", "account-club-contact"),
      legend = el("legend", "", contact.department),
      row = { card };
    card.append(legend);
    const departmentLabel = el("label", "report-field", "Service"),
      department = el("select");
    for (const option of ["Bureau", "Direction sportive", "Autre contact"])
      department.append(new Option(option, option));
    department.value = contact.department;
    department.onchange = () => (legend.textContent = department.value);
    departmentLabel.append(department);
    card.append(departmentLabel);
    row.department = department;
    row.name = field(card, "Nom du contact", "text", contact.name, 70);
    row.role = field(card, "Fonction", "text", contact.role, 80);
    row.email = field(card, "E-mail du contact", "email", contact.email, 254);
    row.phone = field(card, "Téléphone du contact", "tel", contact.phone, 40);
    const remove = el("button", "account-contact-remove", "Retirer ce contact");
    remove.type = "button";
    remove.onclick = () => {
      rows.splice(rows.indexOf(row), 1);
      card.remove();
      dirty.add("club");
      add.disabled = rows.length >= 12;
    };
    card.append(remove);
    contacts.append(card);
    rows.push(row);
  }
  const add = el("button", "export", "+ Ajouter un contact");
  add.type = "button";
  add.onclick = () => {
    if (rows.length >= 12) return;
    contactRow({
      department: "Autre contact",
      name: "",
      role: "",
      email: "",
      phone: "",
    });
    dirty.add("club");
    add.disabled = rows.length >= 12;
    rows.at(-1).name.focus();
  };
  data.contacts.forEach(contactRow);
  add.disabled = rows.length >= 12;
  pf.form.append(add);
  submit(pf.form, "Enregistrer les détails du club");
  pf.form.onsubmit = (e) => {
    e.preventDefault();
    if (activeCoach.id !== owner || !pf.form.reportValidity()) return;
    const value = {
      version: 1,
      name: name.value.trim(),
      city: city.value.trim(),
      stadium: stadium.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      ...(primary.value.toLowerCase() !== clubTheme.defaults.primary ? { primaryColor: primary.value.toLowerCase() } : {}),
      ...(secondary.value.toLowerCase() !== clubTheme.defaults.secondary ? { secondaryColor: secondary.value.toLowerCase() } : {}),
      ...(logoValue ? { logo: logoValue } : {}),
      contacts: rows.map((row) => ({
        department: row.department.value,
        name: row.name.value.trim(),
        role: row.role.value.trim(),
        email: row.email.value.trim(),
        phone: row.phone.value.trim(),
      })),
    };
    if (!coachClubDetailsValid(value)) {
      pf.status.textContent = "Vérifiez le nom et les coordonnées saisis.";
      return;
    }
    try {
      coachStorageSet(coachClubDetailsKey, JSON.stringify(value));
      dirty.delete("club");
      clubTheme.apply(value);
      pf.status.textContent =
        "Fiche club enregistrée pour votre compte sur cet appareil, commune à vos équipes.";
    } catch (error) {
      pf.status.textContent = clubNetworkMessage(error);
    }
  };
}
