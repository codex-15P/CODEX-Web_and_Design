/* ========================================
   CODEX WEB AND DESIGN — TEAM PAGE
======================================== */

(function initializeCodexTeam() {
  "use strict";

  const teamPage = document.querySelector(".team-page");

  if (!teamPage) return;

  // UPDATE FOOTER YEAR
  const currentYear = teamPage.querySelector("#teamCurrentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // TEAM MEMBER ACCORDIONS
  const memberButtons = teamPage.querySelectorAll(".member-header");

  function closeMember(button) {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId ? document.getElementById(contentId) : null;

    button.setAttribute("aria-expanded", "false");

    const icon = button.querySelector(".toggle-icon");

    if (icon) {
      icon.textContent = "+";
    }

    if (content) {
      content.hidden = true;
    }
  }

  function openMember(button) {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId ? document.getElementById(contentId) : null;

    button.setAttribute("aria-expanded", "true");

    const icon = button.querySelector(".toggle-icon");

    if (icon) {
      icon.textContent = "−";
    }

    if (content) {
      content.hidden = false;
    }
  }

  memberButtons.forEach((button) => {
    const contentId = button.getAttribute("aria-controls");
    const content = contentId ? document.getElementById(contentId) : null;

    // Show complete profiles on arrival so this page reads as a team page,
    // while keeping the names available as an accessible accordion control.
    button.setAttribute("aria-expanded", "true");

    const icon = button.querySelector(".toggle-icon");
    if (icon) icon.textContent = "−";

    if (content) content.hidden = false;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";

      memberButtons.forEach((otherButton) => {
        closeMember(otherButton);
      });

      if (!isOpen) {
        openMember(button);
      }
    });
  });

  // IMAGE VIEWER
  const imageViewer = teamPage.querySelector("#imageViewer");
  const fullTeamImage = teamPage.querySelector("#fullTeamImage");
  const imageViewerClose = teamPage.querySelector("#imageViewerClose");
  const memberPictures = teamPage.querySelectorAll(".member-picture");

  if (!imageViewer || !fullTeamImage || !imageViewerClose) {
    return;
  }

  let previouslyFocusedElement = null;

  function openImageViewer(picture) {
    if (!picture || !picture.src) return;

    previouslyFocusedElement = picture;

    fullTeamImage.src = picture.src;
    fullTeamImage.alt = picture.alt || "Enlarged team photograph";

    imageViewer.hidden = false;
    document.body.style.overflow = "hidden";

    imageViewerClose.focus();
  }

  function closeImageViewer() {
    if (imageViewer.hidden) return;

    imageViewer.hidden = true;
    fullTeamImage.removeAttribute("src");
    fullTeamImage.alt = "";

    document.body.style.overflow = "";

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  memberPictures.forEach((picture) => {
    picture.setAttribute("tabindex", "0");
    picture.setAttribute("role", "button");
    picture.setAttribute(
      "aria-label",
      `View larger image: ${picture.alt || "Team member"}`,
    );

    picture.addEventListener("click", () => {
      openImageViewer(picture);
    });

    picture.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageViewer(picture);
      }
    });
  });

  imageViewerClose.addEventListener("click", closeImageViewer);

  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) {
      closeImageViewer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imageViewer.hidden) {
      closeImageViewer();
      return;
    }

    if (event.key === "Tab" && !imageViewer.hidden) {
      event.preventDefault();
      imageViewerClose.focus();
    }
  });
})();
