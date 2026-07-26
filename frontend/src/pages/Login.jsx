import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { tr } from "@/lib/i18n";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Login() {
  const { login } = useAuth();
  const { lang } = useApp();
  const t = (k) => tr(lang, k);
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      toast.success("Welcome back!");
      const from = loc.state?.from || (res.user.role === "admin" ? "/dashboard/admin" : res.user.role === "store_owner" ? "/dashboard/store" : "/");
      nav(from);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center px-4 sm:px-6" data-testid="login-page">
      <div className="grid w-full gap-8 md:grid-cols-2">
        <div className="hidden overflow-hidden rounded-3xl border border-border md:block">
          <img src="https://images.pexels.com/photos/36745909/pexels-photo-36745909.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="" className="h-full w-full object-cover" />
        </div>
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-8">
          <h1 className="font-heading text-3xl font-bold">{t("auth.login.title")}</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue shopping and booking on JASAMORGAD.</p>
          <GoogleSignInButton />
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue with email <span className="h-px flex-1 bg-border" />
          </div>
          {error && <div data-testid="login-error" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.email")}</label>
            <input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.password")}</label>
            <input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="text-primary hover:underline">{t("auth.forgot")}</Link>
          </div>
          <button data-testid="login-submit" disabled={busy} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {busy ? "Signing in..." : t("nav.login")}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">{t("nav.register")}</Link>
          </p>
          <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground">Demo accounts</div>
            <div>Customer: customer@marketplace.id / Customer@12345</div>
            <div>Owner: owner@marketplace.id / Owner@12345</div>
            <div>Admin: admin@marketplace.id / Admin@12345</div>
          </div>
        </form>
      </div>
    </div>
  );
}
