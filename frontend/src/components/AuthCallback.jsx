import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/**
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 * Handles the redirect from Emergent Google Auth. Reads session_id from URL fragment,
 * exchanges it for a session cookie via backend, then navigates to home.
 */
export default function AuthCallback() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    if (!sessionId) {
      nav("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        await api.post("/auth/google/session", { session_id: sessionId });
        await refresh();
        // Clean up URL and go home
        window.history.replaceState({}, document.title, "/");
        toast.success("Signed in with Google");
        nav("/", { replace: true });
      } catch (e) {
        toast.error("Google sign-in failed");
        nav("/login", { replace: true });
      }
    })();
  }, [nav, refresh]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Menyelesaikan login Google...</p>
      </div>
    </div>
  );
}
