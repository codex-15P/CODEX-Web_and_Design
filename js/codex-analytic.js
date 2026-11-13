/* =========================================
   CODEX WEB AND DESIGN
   ANALYTICS DASHBOARD — V1.0
========================================= */

/* =========================================
   1. SELECT HTML ELEMENTS
========================================= */

const analyticsSidebar = document.getElementById("analyticsSidebar");

const analyticsSidebarToggle = document.getElementById(
  "analyticsSidebarToggle",
);

const sidebarLinks = document.querySelectorAll("[data-view-target]");

const analyticsViews = document.querySelectorAll(".analytics-view");

const analyticsCurrentYear = document.getElementById("analyticsCurrentYear");

const dashboardDateRange = document.getElementById("dashboardDateRange");

const reportsMessage = document.getElementById("reportsMessage");

/* =========================================
   2. AUTOMATIC COPYRIGHT YEAR
========================================= */

if (analyticsCurrentYear) {
  analyticsCurrentYear.textContent = new Date().getFullYear();
}

/* =========================================
   3. SIDEBAR NAVIGATION
========================================= */

function closeAnalyticsSidebar() {
  if (!analyticsSidebar || !analyticsSidebarToggle) {
    return;
  }

  analyticsSidebar.classList.remove("is-open");

  analyticsSidebarToggle.setAttribute("aria-expanded", "false");

  analyticsSidebarToggle.setAttribute(
    "aria-label",
    "Open dashboard navigation",
  );
}

function openAnalyticsSidebar() {
  if (!analyticsSidebar || !analyticsSidebarToggle) {
    return;
  }

  analyticsSidebar.classList.add("is-open");

  analyticsSidebarToggle.setAttribute("aria-expanded", "true");

  analyticsSidebarToggle.setAttribute(
    "aria-label",
    "Close dashboard navigation",
  );
}

function toggleAnalyticsSidebar() {
  if (!analyticsSidebar) {
    return;
  }

  const isOpen = analyticsSidebar.classList.contains("is-open");

  if (isOpen) {
    closeAnalyticsSidebar();
  } else {
    openAnalyticsSidebar();
  }
}

if (analyticsSidebarToggle) {
  analyticsSidebarToggle.addEventListener("click", toggleAnalyticsSidebar);
}

/* =========================================
   4. SWITCH DASHBOARD VIEWS
========================================= */

function showAnalyticsView(targetId) {
  const targetView = document.getElementById(targetId);

  if (!targetView || !targetView.classList.contains("analytics-view")) {
    return;
  }

  /* Hide all dashboard views */

  analyticsViews.forEach((view) => {
    view.classList.remove("active");
    view.hidden = true;
  });

  /* Display the selected view */

  targetView.hidden = false;
  targetView.classList.add("active");

  /* Update active sidebar navigation */

  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.viewTarget === targetId;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  /* Return to the top of the dashboard */

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  /* Close mobile navigation */

  closeAnalyticsSidebar();

  window.dispatchEvent(
    new CustomEvent("codex:analytics-view-change", {
      detail: { viewId: targetId },
    }),
  );
}

/* Connect sidebar buttons */

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.dataset.viewTarget;

    showAnalyticsView(targetId);
  });
});

/* =========================================
   5. CLOSE SIDEBAR WHEN CLICKING OUTSIDE
========================================= */

document.addEventListener("click", (event) => {
  if (!analyticsSidebar || !analyticsSidebarToggle) {
    return;
  }

  const clickedInsideSidebar = analyticsSidebar.contains(event.target);

  const clickedToggle = analyticsSidebarToggle.contains(event.target);

  if (!clickedInsideSidebar && !clickedToggle) {
    closeAnalyticsSidebar();
  }
});

/* =========================================
   6. CLOSE SIDEBAR WITH ESCAPE KEY
========================================= */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAnalyticsSidebar();
  }
});

/* =========================================
   7. RESET SIDEBAR ON LARGER SCREENS
========================================= */

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeAnalyticsSidebar();
  }
});

/* =========================================
   8. REPORTING PERIOD SELECTION
========================================= */

if (dashboardDateRange) {
  dashboardDateRange.addEventListener("change", () => {
    const selectedPeriod = dashboardDateRange.value;

    /*
      This currently records the selected period
      for future analytics integration.

      It does not change statistics because
      real analytics data is not connected yet.
    */

    console.log("Selected analytics reporting period:", selectedPeriod);
  });
}

/* =========================================
   9. REPORT BUTTONS
========================================= */

const reportButtons = document.querySelectorAll("[data-report-period]");

function showReportMessage(message) {
  if (!reportsMessage) {
    return;
  }

  reportsMessage.textContent = message;
  reportsMessage.hidden = false;
}

reportButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const reportPeriod = button.dataset.reportPeriod;

    const reportNames = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };

    const reportName = reportNames[reportPeriod] || "Selected";

    showReportMessage(
      `${reportName} reports will become available when real visitor tracking is connected.`,
    );
  });
});

/* =========================================
   10. CSV TEMPLATE EXPORT
========================================= */

const exportAnalyticsCSV = document.getElementById("exportAnalyticsCSV");

function downloadCSVFile(filename, csvContent) {
  const csvBlob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadURL = URL.createObjectURL(csvBlob);

  const downloadLink = document.createElement("a");

  downloadLink.href = downloadURL;
  downloadLink.download = filename;

  document.body.appendChild(downloadLink);

  downloadLink.click();

  downloadLink.remove();

  // Give the browser time to begin the download before releasing its URL.
  window.setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
}

if (exportAnalyticsCSV) {
  exportAnalyticsCSV.addEventListener("click", () => {
    /*
      This is a CSV TEMPLATE.

      It contains the website page names and
      column headings, not actual visitor data.

      Real statistics will be exported after
      the analytics data source is connected.
    */

    const csvRows = [
      ["Website Page", "Page Views", "Unique Visitors", "Reporting Period"],

      ["Entry Page", "", "", ""],
      ["Home", "", "", ""],
      ["Gallery", "", "", ""],
      ["Projects", "", "", ""],
      ["About", "", "", ""],
      ["Our Team", "", "", ""],
      ["Inquiry", "", "", ""],
    ];

    /* Convert each row into CSV format */

    const csvContent = csvRows
      .map((row) => {
        return row
          .map((value) => {
            const safeValue = String(value).replace(/"/g, '""');

            return `"${safeValue}"`;
          })
          .join(",");
      })
      .join("\n");

    /* Generate filename using current date */

    const currentDate = new Date().toISOString().slice(0, 10);

    const filename = `codex-analytics-template-${currentDate}.csv`;

    /* Download the template */

    downloadCSVFile(filename, csvContent);

    showReportMessage(
      "Your CODEX Analytics CSV template has been downloaded. It does not contain real visitor statistics yet.",
    );
  });
}

/* =========================================
   11. INITIAL DASHBOARD STATE
========================================= */

/*
  Ensure the Dashboard is the first view
  displayed when the page loads.
*/

showAnalyticsView("dashboardView");

/* =========================================
   12. DASHBOARD INITIALIZATION
========================================= */

console.log("CODEX Analytics Dashboard V1.0 initialized.");

console.log("Frontend interface ready. Visitor tracking is not connected.");

/* =========================================
   13. ADMIN-ONLY DASHBOARD SIGN-IN
========================================= */

(function initializeAnalyticsAccess() {
  const authGate = document.getElementById("analyticsAuthGate");
  const loginForm = document.getElementById("analyticsLoginForm");
  const emailInput = document.getElementById("analyticsLoginEmail");
  const passwordInput = document.getElementById("analyticsLoginPassword");
  const loginSubmit = document.getElementById("analyticsLoginSubmit");
  const loginMessage = document.getElementById("analyticsLoginMessage");
  const signOutButton = document.getElementById("analyticsSignOut");
  const adminProfile = document.getElementById("analyticsAdminProfile");
  const supabaseClient = window.codexSupabase;

  if (!authGate || !loginForm) return;

  function showLoginMessage(message) {
    if (loginMessage) loginMessage.textContent = message;
  }

  function lockDashboard() {
    document.body.classList.remove("analytics-authenticated");
    authGate.hidden = false;
    if (signOutButton) signOutButton.hidden = true;
    if (adminProfile) adminProfile.hidden = true;
  }

  async function authorizeAdmin(session) {
    if (!session || !supabaseClient) {
      lockDashboard();
      return false;
    }

    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      lockDashboard();
      showLoginMessage("We could not verify your account. Check your connection and try again.");
      return false;
    }

    if (!profile || profile.role !== "admin") {
      await supabaseClient.auth.signOut();
      lockDashboard();
      showLoginMessage("This account does not have CODEX administrator access.");
      return false;
    }

    document.body.classList.add("analytics-authenticated");
    authGate.hidden = true;
    if (signOutButton) signOutButton.hidden = false;
    if (adminProfile) adminProfile.hidden = false;
    showLoginMessage("");
    window.dispatchEvent(
      new CustomEvent("codex:admin-authenticated", {
        detail: { userId: session.user.id },
      }),
    );
    return true;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showLoginMessage("");

    if (!supabaseClient) {
      showLoginMessage("The CODEX backend did not load. Refresh the page and try again.");
      return;
    }

    loginSubmit.disabled = true;
    loginSubmit.textContent = "Signing in…";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });

    if (error) {
      showLoginMessage("Sign-in failed. Check your email and password, then try again.");
    } else {
      await authorizeAdmin(data.session);
    }

    loginSubmit.disabled = false;
    loginSubmit.textContent = "Sign in";
  });

  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        showLoginMessage("Sign-out failed. Please try again.");
        return;
      }

      loginForm.reset();
      lockDashboard();
    });
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") lockDashboard();
    });

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        showLoginMessage("We could not check your session. Refresh and try again.");
        return;
      }

      if (data.session) authorizeAdmin(data.session);
    });
  } else {
    showLoginMessage("The CODEX backend did not load. Refresh the page and try again.");
  }
})();
