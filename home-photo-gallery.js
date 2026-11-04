// Show every configured club photo; the old paused background is not a photo grid.
document.addEventListener("DOMContentLoaded", () => {
  Promise.resolve(homeSlidesReady).then(() => {
    const hero = document.querySelector("#home-page-0 .home-hero");
    if (!hero || !homeSlideImages.length) return;
    const section = el("section", "home-photo-gallery");
    section.id = "home-photo-gallery";
    section.setAttribute("aria-labelledby", "home-photo-gallery-title");
    const title = el("h2", "", "La vie du club");
    title.id = "home-photo-gallery-title";
    const grid = el("div", "home-photo-grid");
    grid.setAttribute("role", "list");
    for (const source of homeSlideImages) {
      const item = el("figure");
      item.setAttribute("role", "listitem");
      const img = source.cloneNode(false);
      img.className = "";
      img.alt =
        window.CLUB_HOME_SLIDES.find(
          (photo) => photo.src === source.getAttribute("src"),
        )?.alt || "Photo du Stade Mayennais";
      item.append(img);
      grid.append(item);
    }
    section.append(title, grid);
    hero.append(section);
    document.body.classList.add("home-with-photo-grid");
  });
});
