/* Shared portfolio navigation and visitor-controlled light/dark theme. */
(function initializeSiteExperience() {
  "use strict";

  const root = document.documentElement;
  const themeKey = "codex-site-theme";
  const validTheme = (value) => value === "dark" || value === "light";
  let theme = "light";
  try {
    const saved = localStorage.getItem(themeKey);
    theme = validTheme(saved)
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  } catch {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  root.dataset.theme = theme;

  const destinations = [
    ["index.html", "Startup page"],
    ["codex-home.html", "Home"],
    ["codex-gallery.html", "Completed projects"],
    ["codex-project.html", "Upcoming projects"],
    ["codex-enquiry.html", "Plan a project"],
    ["codex-team.html", "Meet the team"],
    ["codex-about.html", "About CODEX"],
    ["codex-analytics.html", "Analytics dashboard"],
  ];

  const mainContent = document.querySelector("main, .startup-content");
  if (mainContent) {
    if (!mainContent.id) mainContent.id = "mainContent";
    mainContent.setAttribute("tabindex", "-1");
    if (mainContent.classList.contains("startup-content")) {
      mainContent.setAttribute("role", "main");
    }
    const skipLink = document.createElement("a");
    skipLink.className = "site-skip-link";
    skipLink.href = `#${mainContent.id}`;
    skipLink.textContent = "Skip to main content";
    document.body.prepend(skipLink);
  }

  function setTheme(nextTheme) {
    theme = nextTheme;
    root.dataset.theme = theme;
    try {
      localStorage.setItem(themeKey, theme);
    } catch {
      // The selected theme still applies for this page if storage is blocked.
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(updateThemeButton);
  }

  function updateThemeButton(button) {
    const nextLabel = theme === "dark" ? "Use light theme" : "Use dark theme";
    button.textContent = theme === "dark" ? "Light theme" : "Dark theme";
    button.setAttribute("aria-label", nextLabel);
    button.title = nextLabel;
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function addThemeButton(parent) {
    if (!parent || parent.querySelector("[data-theme-toggle]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "site-theme-toggle";
    button.dataset.themeToggle = "";
    button.addEventListener("click", () =>
      setTheme(theme === "dark" ? "light" : "dark"),
    );
    parent.append(button);
    updateThemeButton(button);
  }

  const headerLinks = document.querySelector(".header-navigation-links");
  if (headerLinks) {
    addThemeButton(headerLinks);
    let menu = document.getElementById("mainNavigation") || headerLinks.querySelector(".site-navigation-panel");
    let toggle = headerLinks.querySelector(".menu-toggle, .site-menu-toggle");

    if (!menu) {
      menu = document.createElement("nav");
      menu.className = "site-navigation-panel";
      menu.id = "siteNavigationMenu";
      menu.setAttribute("aria-label", "Main navigation");
      menu.hidden = true;
      const currentFile = location.pathname.split("/").pop() || "index.html";
      destinations.forEach(([href, label]) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        if (href === currentFile) link.setAttribute("aria-current", "page");
        menu.append(link);
      });
      const community = document.createElement("a");
      community.href = "https://chat.whatsapp.com/H5QAHe00jgaHlfQfZCJz6q";
      community.target = "_blank";
      community.rel = "noopener noreferrer";
      community.className = "site-community-link";
      community.textContent = "Join the WhatsApp community";
      menu.append(community);
      headerLinks.append(menu);
    }

    menu.querySelectorAll("a[href]").forEach((link) => {
      try {
        const samePage = new URL(link.href, location.href).pathname === location.pathname;
        if (samePage && !link.target) link.setAttribute("aria-current", "page");
      } catch {
        // Ignore a malformed optional link without blocking the menu.
      }
    });

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "site-menu-toggle";
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.setAttribute("aria-controls", menu.id);
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = "<span></span><span></span><span></span>";
      headerLinks.insertBefore(toggle, menu);
      toggle.addEventListener("click", () => {
        const opening = menu.hidden;
        menu.hidden = !opening;
        toggle.setAttribute("aria-expanded", String(opening));
        toggle.setAttribute(
          "aria-label",
          opening ? "Close navigation menu" : "Open navigation menu",
        );
      });
      menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
      });
      document.addEventListener("click", (event) => {
        if (!headerLinks.contains(event.target)) closeMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !menu.hidden) {
          closeMenu();
          toggle.focus();
        }
      });
      function closeMenu() {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }
    }
  }

  const startupHeader = document.querySelector(".startup-header");
  if (startupHeader) {
    let actions = startupHeader.querySelector(".startup-actions");
    const menuButton = startupHeader.querySelector("#menuToggle");
    if (!actions && menuButton) {
      actions = document.createElement("div");
      actions.className = "startup-actions";
      startupHeader.insertBefore(actions, menuButton);
      actions.append(menuButton);
    }
    addThemeButton(actions);
  }

  const startupMenu = document.querySelector(".startup-navigation");
  if (startupMenu) {
    startupMenu.querySelectorAll("a[href]").forEach((link) => {
      if (new URL(link.href, location.href).pathname === location.pathname) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  const analyticsActions = document.querySelector(".analytics-header-actions");
  if (analyticsActions) addThemeButton(analyticsActions);
})();
