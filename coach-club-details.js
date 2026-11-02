// The coach's local club directory is shared by their teams, never an implicit club-wide update.
const coachClubDetailsKey = "vestiaire-club-details";
function coachClubDetailsDefaults() {
  return {
    version: 1,
    name: "Stade Mayennais",
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
  logo.src = "assets/club-logo.jpg";
  logo.alt = "Logo du Stade Mayennais";
  logo.width = 80;
  logo.height = 80;
  const identity = el("div");
  identity.append(
    el("h3", "", "Identité du club"),
    el("p", "hint", "Logo et couleurs de référence de l’application."),
  );
  brand.append(logo, identity);
  panel.append(brand);
  const colors = el("ul", "account-club-colors");
  colors.setAttribute("aria-label", "Couleurs officielles");
  for (const [label, color] of [
    ["Bleu", "#2855a2"],
    ["Blanc", "#ffffff"],
    ["Rouge", "#e41f28"],
  ]) {
    const item = el("li"),
      swatch = el("span", "account-color-swatch");
    swatch.style.backgroundColor = color;
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, document.createTextNode(label + " · " + color));
    colors.append(item);
  }
  panel.append(colors);
  const pf = formIn("club", panel),
    name = field(pf.form, "Nom du club", "text", data.name, 70, true),
    city = field(pf.form, "Ville", "text", data.city, 80),
    stadium = field(pf.form, "Nom du stade", "text", data.stadium, 120),
    email = field(pf.form, "E-mail du club", "email", data.email, 254),
    phone = field(pf.form, "Téléphone du club", "tel", data.phone, 40);
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
      pf.status.textContent =
        "Fiche club enregistrée pour votre compte sur cet appareil, commune à vos équipes.";
    } catch (error) {
      pf.status.textContent = clubNetworkMessage(error);
    }
  };
}
