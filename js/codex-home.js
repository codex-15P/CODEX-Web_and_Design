(function initializeCodexHome() {
  "use strict";

  const homePage = document.querySelector(".home-page");

  if (!homePage) return;

  const menuToggle = homePage.querySelector("#menuToggle");
  const mainNavigation = homePage.querySelector("#mainNavigation");
  const currentYear = homePage.querySelector("#homeCurrentYear");

  // Update the copyright year automatically.
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Stop if the navigation elements are missing.
  if (!menuToggle || !mainNavigation) return;

  // Keep the mobile navigation closed when the page loads.
  mainNavigation.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");

  // Open or close the navigation menu.
  function toggleNavigation() {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    mainNavigation.hidden = isOpen;
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu",
    );
  }

  // Close the navigation menu.
  function closeNavigation() {
    mainNavigation.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  // Toggle the menu when the hamburger button is clicked.
  menuToggle.addEventListener("click", toggleNavigation);

  // Close the menu after a navigation link is selected.
  mainNavigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNavigation);
  });

  // Close the menu when the user clicks outside it.
  document.addEventListener("click", function (event) {
    const clickedInsideMenu = mainNavigation.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeNavigation();
    }
  });

  // Close the menu with Escape and return focus to the button.
  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeNavigation();
      menuToggle.focus();
    }
  });
})();
