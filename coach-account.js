// Personal presentation settings never change membership rights or document ownership.
const coachAccountKey = "vestiaire-coach-account";
const coachAccountPages = {
  home: "Accueil",
  terrain: "Match",
  training: "Séances",
  agenda: "Agenda",
  report: "Bilans",
  squad: "Votre effectif",
  resources: "Ressources",
  club: "Club",
};
function coachAccountDefaults() {
  return {
    version: 1,
    profile: {
      firstName: "",
      lastName: "",
      role: "Entraîneur",
      contactEmail: "",
      phone: "",
      photo: "",
    },
    preferences: { startPage: "home", compact: false, reducedMotion: false },
    notifications: { training: false, match: false, lead: 30, browser: false },
  };
}
function coachAccountValid(s) {
  return (
    s &&
    s.version === 1 &&
    s.profile &&
    ["firstName", "lastName", "role", "contactEmail", "phone", "photo"].every(
      (k) => typeof s.profile[k] === "string",
    ) &&
    s.profile.firstName.length <= 35 &&
    s.profile.lastName.length <= 35 &&
    s.profile.role.length <= 80 &&
    s.profile.phone.length <= 40 &&
    s.profile.contactEmail.length <= 254 &&
    (!s.profile.contactEmail ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.profile.contactEmail)) &&
    (!s.profile.photo ||
      (s.profile.photo.length <= 120000 &&
        /^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(s.profile.photo))) &&
    s.preferences &&
    Object.hasOwn(coachAccountPages, s.preferences.startPage) &&
    typeof s.preferences.compact === "boolean" &&
    typeof s.preferences.reducedMotion === "boolean" &&
    s.notifications &&
    ["training", "match", "browser"].every(
      (k) => typeof s.notifications[k] === "boolean",
    ) &&
    [15, 30, 60, 120].includes(s.notifications.lead)
  );
}
function coachAccountRead() {
  try {
    const value = JSON.parse(coachStorageGet(coachAccountKey) || "null");
    return coachAccountValid(value) ? value : coachAccountDefaults();
  } catch {
    return coachAccountDefaults();
  }
}
function coachAccountDisplayName() {
  const profile = coachAccountRead().profile;
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
}
function coachAccountDefaultPage() {
  return coachAccountRead().preferences.startPage;
}
function coachAccountApply() {
  const p = coachAccountRead().preferences;
  document.body.classList.toggle("coach-compact", p.compact);
  document.body.classList.toggle("coach-reduced-motion", p.reducedMotion);
}
function coachAccountSaveSection(section, value) {
  const next = { ...coachAccountRead(), [section]: value };
  if (!coachAccountValid(next)) throw Error("Réglages invalides.");
  coachStorageSet(coachAccountKey, JSON.stringify(next));
  coachAccountApply();
  if (section === "profile") renderClubHomeStats();
  return next;
}
async function coachAccountPhoto(file) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw Error("Choisissez une photo JPEG, PNG ou WebP de 5 Mo maximum.");
  let image, url;
  try {
    if (typeof createImageBitmap === "function")
      image = await createImageBitmap(file);
    else {
      url = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(Error("Photo illisible."));
        img.src = url;
      });
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 224;
    const side = Math.min(image.width, image.height);
    canvas
      .getContext("2d")
      .drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        224,
        224,
      );
    const result = canvas.toDataURL("image/jpeg", 0.78);
    if (result.length > 120000)
      throw Error("Cette photo est trop volumineuse.");
    return result;
  } finally {
    image?.close?.();
    if (url) URL.revokeObjectURL(url);
  }
}
let coachAccountReminderBusy = false;
const coachAccountReminderMemory = new Set();
function coachAccountCheckReminders(date = new Date()) {
  if (
    coachAccountReminderBusy ||
    (clubNetworkPrivateRequested && !clubNetworkBound())
  )
    return;
  const settings = coachAccountRead().notifications;
  if (
    (!settings.training && !settings.match) ||
    (!settings.browser &&
      (document.hidden || document.querySelector("dialog[open]")))
  )
    return;
  coachAccountReminderBusy = true;
  try {
    const now = homeClubNow(date).minutes;
    const due = (
      typeof agendaCalendarAllEvents === "function"
        ? agendaCalendarAllEvents({
            from: homeClubNow(date).day,
            to: agendaCalendarAdd(homeClubNow(date).day, 1),
          })
        : agendaCalendarEvents()
    )
      .filter((e) => settings[e.kind] && /^\d{2}:\d{2}$/.test(e.time))
      .map((e) => ({
        event: e,
        delta: Date.parse(e.date + "T" + e.time + ":00Z") / 60000 - now,
      }))
      .filter((x) => x.delta >= 0 && x.delta <= settings.lead)
      .sort((a, b) => a.delta - b.delta);
    let delivered;
    try {
      delivered = JSON.parse(
        coachStorageGet("vestiaire-coach-reminders") || "[]",
      );
      if (!Array.isArray(delivered)) delivered = [];
    } catch {
      delivered = [];
    }
    const keys = new Set(
      delivered.filter((x) => typeof x === "string").slice(-500),
    );
    for (const { event, delta } of due) {
      const key = [
        "slot",
        event.kind,
        event.date,
        event.time,
        event.category || "",
      ].join("|");
      if (keys.has(key) || coachAccountReminderMemory.has(key)) continue;
      coachAccountReminderMemory.add(key);
      keys.add(key);
      try {
        coachStorageSet(
          "vestiaire-coach-reminders",
          JSON.stringify([...keys].slice(-500)),
        );
      } catch {
        /* The in-page guard still prevents repeated reminders. */
      }
      const text =
        event.label +
        " · " +
        event.title +
        " à " +
        event.time +
        " (dans " +
        Math.ceil(delta) +
        " min).";
      notify(text);
      if (
        settings.browser &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("Votre prochain rendez-vous", {
            body: text,
            tag: key,
            icon: "assets/club-logo.jpg",
          });
        } catch {
          /* The in-app reminder remains available. */
        }
      }
      break;
    }
  } finally {
    coachAccountReminderBusy = false;
  }
}
function coachAccountOpen(initialTab = "profile") {
  if ($("coach-account-dialog")?.open || document.querySelector("dialog[open]"))
    return;
  const owner = activeCoach.id,
    settings = coachAccountRead(),
    dialog = el("dialog", "coach-account-dialog");
  dialog.id = "coach-account-dialog";
  dialog.setAttribute("aria-labelledby", "coach-account-title");
  const heading = el("div", "account-heading"),
    title = el("h2", "", "Paramètres"),
    close = el("button", "export", "Fermer");
  title.id = "coach-account-title";
  close.type = "button";
  heading.append(title, close);
  const dirty = new Set();
  let busy = false,
    photoJob = 0,
    photoPending = false;
  const tabs = el("div", "account-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Paramètres du compte");
  const content = el("div", "account-panels"),
    panels = new Map();
  function activate(id, focus = false) {
    for (const [key, { panel, tab }] of panels) {
      panel.hidden = key !== id;
      tab.setAttribute("aria-selected", String(key === id));
      tab.tabIndex = key === id ? 0 : -1;
    }
    dialog.scrollTop = 0;
    if (focus) panels.get(id).tab.focus({ preventScroll: true });
  }
  for (const [id, label] of [
    ["profile", "Mon profil & sécurité"],
    ["club", "Détails du club"],
    ["teams", "Catégories & équipes"],
    ["preferences", "Préférences & déconnexion"],
  ]) {
    const tab = el("button", "", label);
    tab.type = "button";
    tab.id = "account-tab-" + id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "account-panel-" + id);
    const panel = el("section", "account-panel");
    panel.id = "account-panel-" + id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.hidden = true;
    tabs.append(tab);
    content.append(panel);
    panels.set(id, { panel, tab });
    tab.onclick = () => activate(id);
  }
  tabs.onkeydown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const all = [...panels.keys()],
      index = all.findIndex(
        (k) => panels.get(k).tab === document.activeElement,
      );
    if (index < 0) return;
    e.preventDefault();
    activate(
      all[
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? all.length - 1
            : (index + (e.key === "ArrowRight" ? 1 : all.length - 1)) %
              all.length
      ],
      true,
    );
  };
  function section(id, description) {
    let panel;
    if (id === "security") {
      panel = el("section", "account-subsection");
      panel.id = "account-panel-security";
      panel.append(el("h3", "", "Mot de passe et identifiants"));
      panels.get("profile").panel.append(panel);
    } else if (id === "notifications" || id === "support") {
      panel = el("details", "account-extra");
      panel.id = "account-panel-" + id;
      panel.append(
        el(
          "summary",
          "",
          id === "notifications" ? "Rappels et agenda" : "Signaler un problème",
        ),
      );
      panels.get("preferences").panel.append(panel);
    } else panel = panels.get(id).panel;
    panel.append(el("p", "account-description", description));
    return panel;
  }
  function formIn(id, panel) {
    const form = el("form", "account-form"),
      status = el("p", "account-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.addEventListener("input", () => dirty.add(id));
    form.addEventListener("change", () => dirty.add(id));
    panel.append(form, status);
    return { form, status };
  }
  function field(form, label, type, value, limit, required = false) {
    const wrap = el("label", "report-field", label),
      input = el("input");
    input.type = type;
    input.value = value || "";
    input.required = required;
    if (limit) input.maxLength = limit;
    wrap.append(input);
    form.append(wrap);
    return input;
  }
  function submit(form, label) {
    const button = el("button", "primary", label);
    button.type = "submit";
    form.append(button);
    return button;
  }
  const profile = section(
    "profile",
    "Personnalisez votre profil sur cet appareil. Ces informations ne changent pas votre identifiant de connexion ni vos droits dans le club.",
  );
  const pf = formIn("profile", profile),
    photoArea = el("div", "account-photo"),
    photo = document.createElement("img"),
    initial = el("span", "account-initial", "C");
  photo.alt = "Photo de votre profil";
  photoArea.append(photo, initial);
  pf.form.append(photoArea);
  let photoData = settings.profile.photo;
  const upload = field(pf.form, "Photo du coach", "file", "", 0);
  upload.accept = "image/jpeg,image/png,image/webp";
  const removePhoto = el("button", "export", "Retirer la photo");
  removePhoto.type = "button";
  pf.form.append(removePhoto);
  const known =
    (clubNetworkBound() ? clubNetworkMember?.display_name : activeCoach.name) ||
    "";
  const tokens = /^Coach principal/.test(known)
    ? []
    : known.trim().split(/\s+/);
  const first = field(
      pf.form,
      "Prénom",
      "text",
      settings.profile.firstName || tokens[0],
      35,
      true,
    ),
    last = field(
      pf.form,
      "Nom",
      "text",
      settings.profile.lastName || tokens.slice(1).join(" "),
      35,
      true,
    ),
    role = field(pf.form, "Rôle", "text", settings.profile.role, 80),
    email = field(
      pf.form,
      "E-mail de contact",
      "email",
      settings.profile.contactEmail,
      254,
    ),
    phone = field(pf.form, "Téléphone", "tel", settings.profile.phone, 40);
  first.autocomplete = "given-name";
  last.autocomplete = "family-name";
  email.autocomplete = "email";
  phone.autocomplete = "tel";
  role.placeholder = "Ex. Entraîneur Équipe Première";
  const profileSave = submit(pf.form, "Enregistrer mon profil");
  function drawPhoto() {
    photo.hidden = !photoData;
    initial.hidden = !!photoData;
    if (photoData) photo.src = photoData;
    else photo.removeAttribute("src");
    initial.textContent = (first.value || known || "C")
      .slice(0, 1)
      .toUpperCase();
    removePhoto.disabled = !photoData;
  }
  upload.onchange = async () => {
    const file = upload.files[0];
    if (!file) return;
    const job = ++photoJob;
    photoPending = true;
    profileSave.disabled = true;
    try {
      const data = await coachAccountPhoto(file);
      if (job !== photoJob || !dialog.isConnected) return;
      photoData = data;
      dirty.add("profile");
      drawPhoto();
      pf.status.textContent =
        "Photo prête. Enregistrez votre profil pour la conserver.";
    } catch (error) {
      if (job === photoJob) pf.status.textContent = error.message;
    } finally {
      if (job === photoJob) {
        photoPending = false;
        profileSave.disabled = false;
      }
      upload.value = "";
    }
  };
  removePhoto.onclick = () => {
    photoJob++;
    photoPending = false;
    profileSave.disabled = false;
    photoData = "";
    dirty.add("profile");
    drawPhoto();
  };
  first.addEventListener("input", drawPhoto);
  drawPhoto();
  pf.form.onsubmit = (e) => {
    e.preventDefault();
    if (photoPending || activeCoach.id !== owner || !pf.form.reportValidity())
      return;
    if (!first.value.trim() || !last.value.trim()) {
      pf.status.textContent = "Renseignez votre prénom et votre nom.";
      return;
    }
    try {
      coachAccountSaveSection("profile", {
        firstName: first.value.trim(),
        lastName: last.value.trim(),
        role: role.value.trim(),
        contactEmail: email.value.trim(),
        phone: phone.value.trim(),
        photo: photoData,
      });
      dirty.delete("profile");
      pf.status.textContent = "Profil enregistré sur cet appareil.";
    } catch (error) {
      pf.status.textContent = clubNetworkMessage(error);
    }
  };
  const club = section(
    "club",
    "Votre fiche club est conservée sur cet appareil pour votre compte. Elle est commune à vos équipes et ne modifie pas les documents existants ni la charte du site.",
  );
  coachAccountRenderClub({ panel: club, formIn, field, submit, dirty, owner });
  const teams = section(
    "teams",
    "Renseignez librement les équipes et catégories que vous encadrez. Chaque équipe conserve son effectif, ses bilans, son agenda et ses séances.",
  );
  const teamList = el("div", "account-team-list");
  function leaveForTeam(action) {
    if (!mayClose()) return;
    dialog.addEventListener("close", () => action(), { once: true });
    dialog.close();
  }
  function editTeam(edit, team = activeCoachTeam) {
    leaveForTeam(() => {
      const editor = coachTeamAddDialog(edit, team);
      editor.addEventListener(
        "close",
        () => {
          if (!editor.dataset.saved)
            setTimeout(() => coachAccountOpen("teams"), 0);
        },
        { once: true },
      );
    });
  }
  for (const team of coachTeams) {
    const card = el("article", "account-team-card"),
      copy = el("div"),
      actions = el("div", "account-team-actions"),
      active = team.id === activeCoachTeam.id;
    copy.append(
      el("h3", "", team.label),
      el(
        "p",
        "hint",
        [team.category, team.team].filter(Boolean).join(" · ") ||
          "Équipe à configurer",
      ),
    );
    if (active) copy.append(el("span", "account-team-active", "Équipe active"));
    const edit = el("button", "export", "Modifier");
    edit.type = "button";
    edit.setAttribute("aria-label", "Modifier " + team.label);
    edit.onclick = () => editTeam(true, team);
    actions.append(edit);
    if (!active) {
      const open = el("button", "primary", "Sélectionner");
      open.type = "button";
      open.setAttribute("aria-label", "Sélectionner " + team.label);
      open.onclick = () =>
        leaveForTeam(() => {
          if (!coachTeamSwitch(team.id)) coachAccountOpen("teams");
        });
      actions.append(open);
    }
    card.append(copy, actions);
    teamList.append(card);
  }
  const addTeam = el("button", "primary", "+ Ajouter une équipe");
  addTeam.type = "button";
  addTeam.onclick = () => editTeam(false);
  teams.append(teamList, addTeam);
  const preferences = section(
    "preferences",
    "Choisissez votre page au démarrage et le confort d’affichage. Un retour arrière ou un rechargement conserve toujours le travail et la page en cours.",
  );
  const pr = formIn("preferences", preferences),
    startLabel = el("label", "report-field", "Page au démarrage"),
    start = el("select");
  start.id = "account-start-page";
  for (const [key, label] of Object.entries(coachAccountPages))
    start.append(new Option(label, key));
  start.value = settings.preferences.startPage;
  startLabel.append(start);
  pr.form.append(startLabel);
  function checkbox(form, label, checked) {
    const wrap = el("label", "account-check"),
      input = el("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input, document.createTextNode(" " + label));
    form.append(wrap);
    return input;
  }
  const compact = checkbox(
      pr.form,
      "Affichage compact",
      settings.preferences.compact,
    ),
    motion = checkbox(
      pr.form,
      "Réduire les animations et défilements",
      settings.preferences.reducedMotion,
    );
  submit(pr.form, "Enregistrer mes préférences");
  pr.form.onsubmit = (e) => {
    e.preventDefault();
    if (activeCoach.id !== owner) return;
    try {
      coachAccountSaveSection("preferences", {
        startPage: start.value,
        compact: compact.checked,
        reducedMotion: motion.checked,
      });
      dirty.delete("preferences");
      pr.status.textContent =
        "Préférences enregistrées. La page choisie sera utilisée lors d’une nouvelle ouverture.";
    } catch (error) {
      pr.status.textContent = clubNetworkMessage(error);
    }
  };
  const security = section(
    "security",
    "Votre adresse de connexion identifie votre compte du club. Pour la remplacer, contactez le responsable du club ; l’e-mail de contact du profil est indépendant.",
  );
  const sec = formIn("security", security),
    identity = field(
      sec.form,
      "Adresse de connexion",
      "email",
      clubNetworkSession?.user?.email || "",
      254,
    );
  identity.readOnly = true;
  const old = field(sec.form, "Mot de passe actuel", "password", "", 128, true),
    next = field(sec.form, "Nouveau mot de passe", "password", "", 128, true),
    confirmPassword = field(
      sec.form,
      "Confirmer le nouveau mot de passe",
      "password",
      "",
      128,
      true,
    );
  old.autocomplete = "current-password";
  next.autocomplete = confirmPassword.autocomplete = "new-password";
  next.minLength = confirmPassword.minLength = 12;
  const passwordSave = submit(sec.form, "Modifier mon mot de passe");
  if (!clubNetworkBound()) {
    sec.status.textContent =
      "Mode local : connectez-vous à votre compte du club pour modifier votre mot de passe.";
    for (const input of sec.form.elements) input.disabled = true;
  }
  confirmPassword.oninput = () => confirmPassword.setCustomValidity("");
  sec.form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy || !clubNetworkBound() || activeCoach.id !== owner) return;
    confirmPassword.setCustomValidity(
      next.value === confirmPassword.value
        ? ""
        : "Les mots de passe doivent être identiques.",
    );
    if (!sec.form.reportValidity()) return;
    const uid = clubNetworkSession.user.id,
      address = clubNetworkSession.user.email,
      currentPassword = old.value,
      newPassword = next.value;
    busy = true;
    old.disabled = next.disabled = confirmPassword.disabled = true;
    passwordSave.disabled = close.disabled = true;
    sec.status.textContent = "Vérification du mot de passe actuel…";
    try {
      const session = await clubNetworkRequest(
        "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          auth: false,
          body: { email: address, password: currentPassword },
        },
      );
      if (
        !clubNetworkBound() ||
        clubNetworkSession.user.id !== uid ||
        session.user?.id !== uid
      )
        throw clubNetworkError("Compte différent", 403);
      clubNetworkStoreSession(session);
      await clubNetworkRequest("/auth/v1/user", {
        method: "PUT",
        body: { password: newPassword },
      });
      sec.status.textContent = "Mot de passe modifié.";
    } catch (error) {
      sec.status.textContent = clubNetworkMessage(error);
    } finally {
      old.value = next.value = confirmPassword.value = "";
      dirty.delete("security");
      busy = false;
      old.disabled = next.disabled = confirmPassword.disabled = false;
      passwordSave.disabled = close.disabled = false;
    }
  };
  const notifications = section(
    "notifications",
    "Les rappels fonctionnent lorsque le site reste ouvert. Aucun rappel par e-mail ou SMS n’est envoyé. Les notifications du navigateur nécessitent votre autorisation.",
  );
  const nf = formIn("notifications", notifications),
    training = checkbox(
      nf.form,
      "Rappeler mes séances",
      settings.notifications.training,
    ),
    match = checkbox(
      nf.form,
      "Rappeler mes matchs",
      settings.notifications.match,
    ),
    leadLabel = el("label", "report-field", "Délai avant le rendez-vous"),
    lead = el("select");
  lead.id = "account-reminder-lead";
  for (const n of [15, 30, 60, 120])
    lead.append(new Option(n + " minutes", String(n)));
  lead.value = String(settings.notifications.lead);
  leadLabel.append(lead);
  nf.form.append(leadLabel);
  const browser = checkbox(
      nf.form,
      "Afficher aussi une notification du navigateur",
      settings.notifications.browser,
    ),
    authorize = el(
      "button",
      "export",
      "Autoriser les notifications du navigateur",
    );
  authorize.type = "button";
  nf.form.append(authorize);
  authorize.onclick = async () => {
    if (typeof Notification === "undefined" || !window.isSecureContext) {
      nf.status.textContent =
        "Les notifications ne sont pas disponibles ici. Les rappels dans le site restent utilisables.";
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      browser.checked = permission === "granted";
      dirty.add("notifications");
      nf.status.textContent =
        permission === "granted"
          ? "Autorisation accordée. Enregistrez vos rappels."
          : "Autorisation non accordée. Vous pouvez utiliser les rappels dans le site.";
    } catch {
      nf.status.textContent =
        "Autorisation indisponible. Utilisez les rappels dans le site.";
    }
  };
  submit(nf.form, "Enregistrer mes rappels");
  nf.form.onsubmit = (e) => {
    e.preventDefault();
    if (activeCoach.id !== owner) return;
    if (
      browser.checked &&
      (typeof Notification === "undefined" ||
        Notification.permission !== "granted")
    ) {
      nf.status.textContent =
        "Autorisez les notifications du navigateur, ou décochez cette option.";
      return;
    }
    try {
      coachAccountSaveSection("notifications", {
        training: training.checked,
        match: match.checked,
        lead: Number(lead.value),
        browser: browser.checked,
      });
      dirty.delete("notifications");
      nf.status.textContent =
        "Rappels enregistrés pour ce coach sur cet appareil.";
      coachAccountCheckReminders();
    } catch (error) {
      nf.status.textContent = clubNetworkMessage(error);
    }
  };
  const support = section(
    "support",
    "Un problème ? Décrivez les étapes et le résultat attendu. Le signalement sera ouvert dans GitHub pour que vous puissiez le relire avant de le publier.",
  );
  const description = el("textarea");
  description.id = "account-bug-description";
  description.rows = 4;
  description.maxLength = 3000;
  const bugLabel = el("label", "report-field", "Décrire le problème");
  bugLabel.append(description);
  const bug = el("a", "export account-bug", "Préparer un signalement");
  bug.target = "_blank";
  bug.rel = "noopener";
  function bugURL() {
    const url = new URL(
      "https://github.com/Mouchhh/FOOT-U16-2026-2027/issues/new",
    );
    url.searchParams.set("title", "Problème sur Le Vestiaire");
    url.searchParams.set(
      "body",
      (description.value.trim() ||
        "Décrivez ici le problème et les étapes pour le reproduire.") +
        "\n\nPage : " +
        location.origin +
        location.pathname +
        "\nModule : " +
        (window.workspaceFraming?.current().view || "") +
        "\nÉcran : " +
        innerWidth +
        " × " +
        innerHeight,
    );
    bug.href = url.href;
  }
  description.oninput = () => {
    dirty.add("support");
    bugURL();
  };
  bug.onclick = () => dirty.delete("support");
  bugURL();
  const logout = el(
      "button",
      "account-logout",
      clubNetworkBound() ? "Se déconnecter" : "Quitter le mode local",
    ),
    logoutStatus = el("p", "account-status");
  logout.type = "button";
  logoutStatus.setAttribute("role", "status");
  logout.onclick = async () => {
    if (busy) return;
    if (
      dirty.size &&
      !confirm("Quitter sans enregistrer les changements de vos paramètres ?")
    )
      return;
    busy = true;
    logout.disabled = true;
    try {
      if (clubNetworkBound()) {
        logoutStatus.textContent = "Déconnexion en cours…";
        await clubNetworkLogout();
        if (clubNetworkBound())
          logoutStatus.textContent =
            "La déconnexion a été interrompue. Vérifiez les champs de votre travail avant de réessayer.";
      } else {
        if (flushCoachWorkspace()) location.assign("accueil.html");
        else
          logoutStatus.textContent =
            "Vérifiez les champs de votre travail avant de quitter.";
      }
    } catch (error) {
      logoutStatus.textContent = clubNetworkMessage(error);
    } finally {
      busy = false;
      if (dialog.isConnected) logout.disabled = false;
    }
  };
  support.append(
    bugLabel,
    el(
      "p",
      "hint",
      "Ne transmettez aucun mot de passe ni données personnelles de joueurs.",
    ),
    bug,
  );
  preferences.append(
    el("h3", "account-logout-heading", "Déconnexion"),
    logout,
    logoutStatus,
  );
  const mayClose = () =>
    !busy &&
    (!dirty.size ||
      confirm("Fermer sans enregistrer les changements de vos paramètres ?"));
  close.onclick = () => {
    if (mayClose()) dialog.close();
  };
  dialog.addEventListener("cancel", (event) => {
    if (!mayClose()) event.preventDefault();
  });
  dialog.addEventListener(
    "close",
    () => {
      photoJob++;
      old.value = next.value = confirmPassword.value = "";
      dialog.remove();
    },
    { once: true },
  );
  dialog.append(heading, tabs, content);
  document.body.append(dialog);
  activate(panels.has(initialTab) ? initialTab : "profile");
  dialog.showModal();
}
document.addEventListener("DOMContentLoaded", () => {
  const open = el("button", "coach-account-open");
  open.id = "coach-account-open";
  open.type = "button";
  open.setAttribute("aria-label", "Mon compte et paramètres");
  open.setAttribute("aria-haspopup", "dialog");
  open.setAttribute("aria-controls", "coach-account-dialog");
  open.title = "Mon compte";
  open.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3z"/><circle cx="12" cy="12" r="3"/></svg><span>Mon compte</span>';
  open.onclick = () => coachAccountOpen();
  document.querySelector(".header-actions").append(open);
  coachAccountApply();
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === coachStorageKey(coachAccountKey)) {
      coachAccountApply();
      renderClubHomeStats();
    }
  });
  requestAnimationFrame(() => coachAccountCheckReminders());
  document.addEventListener(
    "close",
    () => requestAnimationFrame(() => coachAccountCheckReminders()),
    true,
  );
  setInterval(() => coachAccountCheckReminders(), 30000);
  document.addEventListener("visibilitychange", () =>
    coachAccountCheckReminders(),
  );
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    $("coach-account-dialog")?.close();
    return clear();
  };
});
