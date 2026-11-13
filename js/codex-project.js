/* =========================================
   CODEX WEB AND DESIGN
   PROJECTS PAGE JAVASCRIPT

   FEATURES:
   1. Automatic copyright year
   2. Multiple project listings
   3. Individual publication dates
   4. Live publication countdown
   5. Publication date formatting
========================================= */

(function initializeCodexProjects() {
  "use strict";

  /* =====================================
     1. FIND THE PROJECTS PAGE
  ====================================== */

  const projectsPage = document.querySelector(".projects-page");

  if (!projectsPage) return;

  /* =====================================
     2. AUTOMATIC COPYRIGHT YEAR
  ====================================== */

  const currentYear = projectsPage.querySelector("#projectsCurrentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  /* =====================================
     3. FIND ALL PROJECT CARDS
  ====================================== */

  const projectCards = projectsPage.querySelectorAll(".projects-card");

  /* =====================================
     4. FORMAT PUBLICATION DATE
  ====================================== */

  function formatPublicationDate(date) {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Lagos",
    }).format(date);
  }

  /* =====================================
     5. UPDATE ONE PROJECT COUNTDOWN
  ====================================== */

  function updateProjectCountdown(card) {
    const publicationValue = card.dataset.publication;

    const publicationDateElement = card.querySelector(
      ".projects-publication-date",
    );

    const countdownMessage = card.querySelector(".projects-countdown-message");

    const countdownDays = card.querySelector("[data-countdown-days]");

    const countdownHours = card.querySelector("[data-countdown-hours]");

    const countdownMinutes = card.querySelector("[data-countdown-minutes]");

    const countdownSeconds = card.querySelector("[data-countdown-seconds]");

    // Stop if the project has no publication date.

    if (!publicationValue) {
      if (publicationDateElement) {
        publicationDateElement.textContent = "To be announced";
      }

      if (countdownMessage) {
        countdownMessage.textContent =
          "Countdown will appear when a publication date is announced.";
      }

      return;
    }

    // Convert the publication date into a JavaScript date.

    const publicationDate = new Date(publicationValue);

    // Check whether the date is valid.

    if (Number.isNaN(publicationDate.getTime())) {
      if (publicationDateElement) {
        publicationDateElement.textContent = "Date unavailable";
      }

      if (countdownMessage) {
        countdownMessage.textContent =
          "Please check the publication date entered for this project.";
      }

      return;
    }

    // Display the formatted publication date.

    if (publicationDateElement) {
      publicationDateElement.textContent =
        formatPublicationDate(publicationDate);

      publicationDateElement.dateTime = publicationValue;
    }

    // Calculate the remaining time.

    const currentTime = new Date();

    const remainingTime = publicationDate.getTime() - currentTime.getTime();

    // Check whether publication time has arrived.

    if (remainingTime <= 0) {
      if (countdownDays) countdownDays.textContent = "00";
      if (countdownHours) countdownHours.textContent = "00";
      if (countdownMinutes) countdownMinutes.textContent = "00";
      if (countdownSeconds) countdownSeconds.textContent = "00";

      if (countdownMessage) {
        countdownMessage.textContent =
          "The scheduled publication time has arrived. Check back for the release.";
      }

      return;
    }

    // Convert remaining milliseconds into time units.

    const totalSeconds = Math.floor(remainingTime / 1000);

    const days = Math.floor(totalSeconds / 86400);

    const hours = Math.floor((totalSeconds % 86400) / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    // Display the countdown.

    if (countdownDays) {
      countdownDays.textContent = String(days).padStart(2, "0");
    }

    if (countdownHours) {
      countdownHours.textContent = String(hours).padStart(2, "0");
    }

    if (countdownMinutes) {
      countdownMinutes.textContent = String(minutes).padStart(2, "0");
    }

    if (countdownSeconds) {
      countdownSeconds.textContent = String(seconds).padStart(2, "0");
    }

    // Update the countdown message.

    if (countdownMessage) {
      countdownMessage.textContent =
        "Time remaining until the scheduled publication.";
    }
  }

  /* =====================================
     6. UPDATE ALL PROJECTS
  ====================================== */

  function updateAllProjectCountdowns() {
    projectCards.forEach(function (card) {
      updateProjectCountdown(card);
    });
  }

  /* =====================================
     7. START THE COUNTDOWN
  ====================================== */

  updateAllProjectCountdowns();

  // Refresh every second.

  const countdownInterval = window.setInterval(function () {
    updateAllProjectCountdowns();
  }, 1000);

  // Stop the timer if the page is being unloaded.

  window.addEventListener("pagehide", function () {
    window.clearInterval(countdownInterval);
  });
})();
