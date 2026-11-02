(function initializeCodexAbout() {
  "use strict";

  const aboutPage = document.querySelector(".about-page");

  if (!aboutPage) return;

  // Update the footer year automatically.
  const currentYear = aboutPage.querySelector("#aboutCurrentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Find all accordion buttons.
  const accordionButtons = aboutPage.querySelectorAll(
    ".about-accordion-button, .about-section-toggle",
  );

  if (!accordionButtons.length) return;

  function closeSection(button) {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId
      ? aboutPage.querySelector(`#${CSS.escape(contentId)}`)
      : null;

    button.setAttribute("aria-expanded", "false");

    const icon = button.querySelector(".about-accordion-icon, .toggle-icon");

    if (icon) {
      icon.textContent = "+";
    }

    if (content) {
      content.hidden = true;
    }
  }

  function openSection(button) {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId
      ? aboutPage.querySelector(`#${CSS.escape(contentId)}`)
      : null;

    button.setAttribute("aria-expanded", "true");

    const icon = button.querySelector(".about-accordion-icon, .toggle-icon");

    if (icon) {
      icon.textContent = "−";
    }

    if (content) {
      content.hidden = false;
    }
  }

  accordionButtons.forEach((button) => {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId
      ? aboutPage.querySelector(`#${CSS.escape(contentId)}`)
      : null;

    // Start with every accordion section closed.
    button.setAttribute("aria-expanded", "false");

    if (content) {
      content.hidden = true;
    }

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";

      // Close all sections before opening another.
      accordionButtons.forEach((otherButton) => {
        closeSection(otherButton);
      });

      // Clicking an open section keeps it closed.
      if (!isOpen) {
        openSection(button);
      }
    });
  });
})();
