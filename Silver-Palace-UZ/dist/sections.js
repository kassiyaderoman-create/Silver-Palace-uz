const filters = document.querySelector(".filters");
const news = document.querySelectorAll(".news-list article");

if (filters) {
  filters.hidden = false;
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;

    const category = button.dataset.filter;
    for (const filter of filters.querySelectorAll("button")) {
      filter.setAttribute("aria-pressed", String(filter === button));
    }
    for (const article of news) {
      article.hidden = category !== "all" && article.dataset.category !== category;
    }
  });

  const newsPhoto = document.querySelector(".news-photo");
  const newsImage = newsPhoto.querySelector("img");
  const newsCaption = newsPhoto.querySelector("figcaption");
  function previewNews(article) {
    const headline = article.querySelector("h3").textContent.replace(/\s*↗$/, "");
    newsImage.src = "/official/" + article.dataset.cover + "-cover.webp";
    newsImage.alt = "";
    newsCaption.textContent = headline + " · Elementa";
  }
  for (const article of news) {
    article.addEventListener("pointerenter", () => previewNews(article));
    article.addEventListener("focusin", () => previewNews(article));
  }
  filters.addEventListener("click", (event) => {
    if (event.target.closest("button[data-filter]")) {
      previewNews(Array.from(news).find((article) => !article.hidden));
    }
  });
}

const dialog = document.getElementById("video-dialog");
const frameContainer = document.getElementById("video-frame");
const videoTitle = document.getElementById("video-title");
const externalLink = document.getElementById("video-external");

for (const link of document.querySelectorAll("[data-video]")) {
  link.addEventListener("click", (event) => {
    if (!dialog?.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    videoTitle.textContent = link.dataset.videoTitle ?? link.querySelector("h3").textContent;
    externalLink.href = link.href;
    const frame = document.createElement("iframe");
    frame.title = videoTitle.textContent;
    frame.src = "https://www.youtube-nocookie.com/embed/" + link.dataset.video;
    frame.allowFullscreen = true;
    frameContainer.replaceChildren(frame);
    dialog.showModal();
  });
}

dialog?.addEventListener("close", () => frameContainer.replaceChildren());

const menu = document.querySelector(".site-menu");
const menuTrigger = menu.querySelector("summary");
const menuLinks = menu.querySelectorAll("nav a");

function markMenuLocation() {
  const section = document.getElementById(location.hash.slice(1))?.closest("section[id]");
  const current = section ? "#" + section.id : location.hash || "#main";
  for (const link of menuLinks) {
    const matches = link.hash === current &&
      document.getElementById(link.hash.slice(1)) !== null;
    if (matches) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

menu.addEventListener("click", (event) => {
  if (event.target.closest("nav a")) menu.open = false;
});
document.querySelector(".menu-shade").addEventListener("click", () => {
  menu.open = false;
  menuTrigger.focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.open) {
    menu.open = false;
    menuTrigger.focus();
  }
});
window.addEventListener("hashchange", markMenuLocation);
markMenuLocation();

const hero = document.querySelector(".official-hero");
if (hero && matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty("--shift-x", ((event.clientX - bounds.left) / bounds.width - 0.5) * 22 + "px");
    hero.style.setProperty("--shift-y", ((event.clientY - bounds.top) / bounds.height - 0.5) * 14 + "px");
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.removeProperty("--shift-x");
    hero.style.removeProperty("--shift-y");
  });
}

for (const showcase of document.querySelectorAll("[data-showcase]")) {
  const buttons = Array.from(showcase.querySelectorAll("[data-pick]"));
  const panels = buttons.map((button) => document.getElementById(button.dataset.pick));

  const picker = showcase.querySelector(".role-picker");

  function select(index) {
    buttons.forEach((button, position) => {
      button.setAttribute("aria-pressed", String(position === index));
      panels[position].hidden = position !== index;
    });
    const selected = buttons[index];
    if (picker && selected && !selected.hidden) {
      const item = selected.getBoundingClientRect();
      const strip = picker.getBoundingClientRect();
      picker.scrollLeft += (item.left + item.right - strip.left - strip.right) / 2;
    }
  }

  const controls = showcase.querySelector(".role-controls");
  const search = document.getElementById("cast-query");
  if (controls) {
    controls.hidden = false;
    search.parentElement.hidden = false;
    let matches = buttons;
    const normalize = (value) => value.toLocaleLowerCase("uz").replace(/[‘’ʻʼ`]/g, "'");
    const updateResults = () => {
      const query = normalize(search.value.trim());
      matches = buttons.filter((button) => normalize(button.dataset.search).includes(query));
      const active = matches.find((button) => button.getAttribute("aria-pressed") === "true");
      buttons.forEach((button) => { button.hidden = !matches.includes(button); });
      select(buttons.indexOf(active ?? matches[0]));
      controls.hidden = matches.length === 0;
      for (const step of controls.querySelectorAll("[data-role-step]")) {
        step.disabled = matches.length < 2;
      }
      document.querySelector(".cast-results").textContent = matches.length
        ? matches.length + " ta profil"
        : "Mos qahramon topilmadi.";
    };
    search.addEventListener("input", updateResults);
    for (const step of controls.querySelectorAll("[data-role-step]")) {
      step.addEventListener("click", () => {
        const current = matches.findIndex((button) => button.getAttribute("aria-pressed") === "true");
        const next = (current + Number(step.dataset.roleStep) + matches.length) % matches.length;
        select(buttons.indexOf(matches[next]));
      });
    }
    updateResults();
  } else {
    buttons[0].parentElement.hidden = false;
    select(0);
  }

  function openLinkedPanel() {
    const index = panels.findIndex((panel) => "#" + panel.id === location.hash);
    if (index < 0) return;
    if (controls && buttons[index].hidden) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
    }
    select(index);
    panels[index].scrollIntoView({ block: "start" });
  }

  window.addEventListener("hashchange", openLinkedPanel);
  openLinkedPanel();
  buttons.forEach((button, index) => button.addEventListener("click", () => {
    select(index);
    if (controls && !matchMedia("(min-width: 691px)").matches) {
      panels[index].scrollIntoView({ block: "nearest" });
    }
  }));
}

function openLinkedTerm() {
  if (!location.hash.startsWith("#atama-")) return;
  const term = document.getElementById(location.hash.slice(1));
  if (term instanceof HTMLDetailsElement) {
    term.open = true;
    term.scrollIntoView({ block: "start" });
  }
}

window.addEventListener("hashchange", openLinkedTerm);
openLinkedTerm();
