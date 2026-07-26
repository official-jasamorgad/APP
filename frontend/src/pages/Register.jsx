import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import SliderCaptcha from "@/components/SliderCaptcha";
import OtpVerifier from "@/components/OtpVerifier";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "customer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [step, setStep] = useState("form"); // form → otp

  const submit = async (e) => {
    e.preventDefault();
    if (!captchaOk) return toast.error("Selesaikan verifikasi CAPTCHA");
    setBusy(true);
    setError("");
    const res = await register(form);
    setBusy(false);
    if (res.ok) {
      toast.success("Akun dibuat! Verifikasi email Anda.");
      setStep("otp");
    } else setError(res.error);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center px-4 sm:px-6" data-testid="register-page">
      <div className="grid w-full gap-8 md:grid-cols-2">
        {step === "form" ? (
          <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-8">
            <h1 className="font-heading text-3xl font-bold">Buat akun baru</h1>
            <p className="text-sm text-muted-foreground">Gabung JASAMORGAD untuk belanja & booking instan.</p>

            <GoogleSignInButton label="Daftar dengan Google" />
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> atau daftar dengan email <span className="h-px flex-1 bg-border" />
            </div>

            {error && <div data-testid="register-error" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama lengkap</label>
              <input data-testid="register-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input data-testid="register-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nomor HP</label>
              <input data-testid="register-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kata sandi</label>
              <input data-testid="register-password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saya adalah</label>
              <div className="flex gap-2">
                <button type="button" data-testid="role-customer" onClick={() => setForm({ ...form, role: "customer" })} className={`flex-1 rounded-lg border border-border py-2 text-xs font-semibold ${form.role === "customer" ? "bg-primary text-primary-foreground" : ""}`}>Pelanggan</button>
                <button type="button" data-testid="role-owner" onClick={() => setForm({ ...form, role: "store_owner" })} className={`flex-1 rounded-lg border border-border py-2 text-xs font-semibold ${form.role === "store_owner" ? "bg-primary text-primary-foreground" : ""}`}>Pemilik toko</button>
              </div>
            </div>
            <SliderCaptcha onVerified={() => setCaptchaOk(true)} />
            <button data-testid="register-submit" disabled={busy || !captchaOk} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? "Membuat..." : "Buat akun"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Sudah punya akun? <Link to="/login" className="font-semibold text-primary hover:underline">Masuk</Link>
            </p>
          </form>
        ) : (
          <div className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-8">
            <h1 className="font-heading text-3xl font-bold">Verifikasi email</h1>
            <p className="text-sm text-muted-foreground">Cek email Anda untuk kode 6-digit. Setelah verifikasi, Anda bisa langsung belanja.</p>
            <OtpVerifier email={form.email} onVerified={() => { toast.success("Selamat datang!"); nav("/"); }} />
            <button data-testid="skip-otp" onClick={() => nav("/")} className="w-full rounded-full border border-border py-2.5 text-xs font-semibold">Lewati untuk sekarang</button>
          </div>
        )}
        <div className="hidden overflow-hidden rounded-3xl border border-border md:block">
          <img src="https://images.pexels.com/photos/32549955/pexels-photo-32549955.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}
