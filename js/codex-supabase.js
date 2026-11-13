/* Shared Supabase browser client for the static CODEX site.
   The publishable key is designed for browser use; database access is still
   restricted by the project's grants and Row Level Security policies. */
(function initializeCodexSupabase() {
  "use strict";

  const projectUrl = "https://iobjehhmoqslbexwmfxg.supabase.co";
  const publishableKey = "sb_publishable_NjEbsmkQ7Q9igkrB5WuqiQ_RCEg8MAV";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("CODEX backend: Supabase library did not load.");
    return;
  }

  const createClient = window.supabase.createClient;

  if (!window.codexSupabase) {
    window.codexSupabase = createClient(projectUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  // Keep visitor chat's temporary anonymous session separate from the
  // administrator's Analytics sign-in session.
  if (!window.codexChatSupabase) {
    window.codexChatSupabase = createClient(projectUrl, publishableKey, {
      auth: {
        storageKey: "codex-chat-anonymous-session",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  window.dispatchEvent(new Event("codex:supabase-ready"));
})();
