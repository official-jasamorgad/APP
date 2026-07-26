import { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Check your email (log) for the reset link");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6" data-testid="forgot-page">
      <h1 className="mb-3 font-heading text-3xl font-bold">Reset password</h1>
      <p className="mb-6 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
      {sent ? (
        <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
          If an account exists, a reset link was sent. Check the backend logs for the link during development.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border p-6">
          <input data-testid="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
          <button data-testid="forgot-submit" disabled={busy} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
