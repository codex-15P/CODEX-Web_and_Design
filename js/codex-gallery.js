(function initializeCodexGallery() {
  "use strict";

  const galleryPage = document.querySelector(".project-gallery-page");

  if (!galleryPage) return;

  // =====================================
  // COPYRIGHT YEAR
  // =====================================

  const currentYear = galleryPage.querySelector("#galleryCurrentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // =====================================
  // GALLERY ELEMENTS
  // =====================================

  const filterButtons = galleryPage.querySelectorAll(".gallery-filter-button");

  const projectGrid = galleryPage.querySelector("#galleryProjectGrid");

  const emptyState = galleryPage.querySelector("#galleryEmptyState");

  const showAllButton = galleryPage.querySelector(".gallery-show-all-button");

  // Check that the essential elements exist.
  if (!filterButtons.length || !projectGrid || !emptyState) {
    console.warn(
      "CODEX Gallery: A required gallery element could not be found.",
    );

    return;
  }

  // =====================================
  // PROJECT FILTERING
  // =====================================

  function filterGalleryProjects(selectedCategory) {
    // Get the current project cards whenever filtering happens.
    // This makes the gallery easier to expand in the future.

    const projectCards = Array.from(
      projectGrid.querySelectorAll(".gallery-project-card"),
    );

    let visibleProjects = 0;

    projectCards.forEach(function (card) {
      const projectCategory = card.getAttribute("data-category");

      const shouldShow =
        selectedCategory === "all" || projectCategory === selectedCategory;

      card.hidden = !shouldShow;

      if (shouldShow) {
        visibleProjects++;
      }
    });

    // Update the selected category button.
    filterButtons.forEach(function (button) {
      const isSelected =
        button.getAttribute("data-category") === selectedCategory;

      button.classList.toggle("active", isSelected);

      button.setAttribute("aria-pressed", String(isSelected));
    });

    // Display the empty message if no projects match.
    const hasNoProjects = visibleProjects === 0;

    emptyState.hidden = !hasNoProjects;
    projectGrid.hidden = hasNoProjects;
  }

  // =====================================
  // FILTER BUTTON EVENTS
  // =====================================

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selectedCategory = button.getAttribute("data-category");

      if (!selectedCategory) return;

      filterGalleryProjects(selectedCategory);
    });
  });

  // =====================================
  // VIEW ALL WORK BUTTON
  // =====================================

  if (showAllButton) {
    showAllButton.addEventListener("click", function () {
      filterGalleryProjects("all");
    });
  }

  // =====================================
  // INITIAL GALLERY DISPLAY
  // =====================================

  filterGalleryProjects("all");
})();
