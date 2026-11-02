/* =========================================
   CODEX WEB AND DESIGN
   INQUIRY PAGE JAVASCRIPT
   ========================================= */

(function initializeCodexEnquiry() {
  "use strict";

  const enquiryPage = document.querySelector(".enquiry-page");

  if (!enquiryPage) return;

  const enquiryForm = enquiryPage.querySelector("#codexEnquiryForm");
  const formMessage = enquiryPage.querySelector("#enquiryFormMessage");
  const currentYear = enquiryPage.querySelector("#enquiryCurrentYear");
  const deadlineInput = enquiryPage.querySelector("#projectDeadline");

  // Automatically update the copyright year.
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  if (!enquiryForm) return;

  // Set the earliest selectable deadline to today.
  if (deadlineInput) {
    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];

    deadlineInput.min = localToday;
  }

  // CODEX WhatsApp business number.
  const CODEX_WHATSAPP_NUMBER = "2349113234337";

  function showMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.dataset.type = type || "info";

    if (type === "error") {
      formMessage.style.color = "#FF6B6B";
    } else if (type === "success") {
      formMessage.style.color = "#34D399";
    } else {
      formMessage.style.color = "#C5CBD5";
    }
  }

  function getFieldValue(fieldId) {
    const field = enquiryPage.querySelector(`#${fieldId}`);

    return field ? field.value.trim() : "";
  }

  enquiryForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Let the browser handle required-field validation.
    if (!enquiryForm.checkValidity()) {
      enquiryForm.reportValidity();
      return;
    }

    const clientName = getFieldValue("clientName");
    const clientWhatsApp = getFieldValue("clientWhatsApp");
    const projectType = getFieldValue("projectType");
    const projectTitle = getFieldValue("projectTitle");
    const projectDescription = getFieldValue("projectDescription");
    const projectBudget = getFieldValue("projectBudget");
    const projectDeadline = getFieldValue("projectDeadline");
    const projectReferences = getFieldValue("projectReferences");

    // Validate the selected deadline.
    if (projectDeadline) {
      const today = new Date();
      const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split("T")[0];

      if (projectDeadline < localToday) {
        showMessage(
          "Please select today or a future project deadline.",
          "error",
        );

        deadlineInput.focus();
        return;
      }
    }

    // Format the deadline for the message.
    let formattedDeadline = "Not specified";

    if (projectDeadline) {
      const dateParts = projectDeadline.split("-");
      formattedDeadline = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }

    // Build the WhatsApp message.
    const whatsappMessage = `
Hello CODEX Web and Design!

I would like to make a project inquiry.

CLIENT DETAILS
Name: ${clientName}
WhatsApp Number: ${clientWhatsApp}

PROJECT DETAILS
Category: ${projectType}
Project Title: ${projectTitle}

Description:
${projectDescription}

Estimated Budget: ${projectBudget || "Not specified"}
Expected Deadline: ${formattedDeadline}

Reference Links / Additional Information:
${projectReferences || "None provided"}

I look forward to discussing this project with CODEX.

Thank you!
    `.trim();

    const whatsappURL =
      "https://wa.me/" +
      CODEX_WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(whatsappMessage);

    showMessage(
      "Your inquiry is ready. WhatsApp will open so you can review and send it.",
      "success",
    );

    // Open WhatsApp for the visitor to review the message.
    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  });
})();
