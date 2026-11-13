/* ========================================
   CODEX WEB AND DESIGN
   Entry Page JavaScript
======================================== */

(function initializeCodexEntryPage() {
  "use strict";

  const menuToggle = document.getElementById("menuToggle");
  const mainNavigation = document.getElementById("mainNavigation");
  const startupCurrentYear = document.getElementById("startupCurrentYear");

  /* Update the copyright year automatically. */
  if (startupCurrentYear) {
    startupCurrentYear.textContent = new Date().getFullYear();
  }

  /* Stop safely if the navigation elements are unavailable. */
  if (!menuToggle || !mainNavigation) {
    return;
  }

  function openNavigation() {
    mainNavigation.hidden = false;

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
  }

  function closeNavigation() {
    mainNavigation.hidden = true;

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  function toggleNavigation() {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }

  /* Open or close the menu using the hamburger button. */
  menuToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleNavigation();
  });

  /* Close the menu after a navigation link is selected. */
  mainNavigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNavigation);
  });

  /* Close the menu when the user clicks outside it. */
  document.addEventListener("click", function (event) {
    const clickedInsideMenu = mainNavigation.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeNavigation();
    }
  });

  /* Allow the Escape key to close the menu. */
  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeNavigation();
      menuToggle.focus();
    }
  });

  /* Ensure the menu starts closed. */
  closeNavigation();
})();
