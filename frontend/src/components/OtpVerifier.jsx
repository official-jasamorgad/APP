import { useState } from "react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Mail } from "lucide-react";

/**
 * Reusable OTP verification widget. Sends a 6-digit code to the given email,
 * then asks user to enter it. Calls onVerified() when successful.
 */
export default function OtpVerifier({ email, onVerified }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const send = async () => {
    if (!email) return toast.error("Isi email dulu");
    setSending(true);
    try {
      await api.post("/auth/otp/send", { email });
      setSent(true);
      toast.success("Kode OTP dikirim ke email. Cek log server (dev mode).");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setSending(false);
  };

  const verify = async () => {
    if (code.length !== 6) return toast.error("Kode harus 6 digit");
    setVerifying(true);
    try {
      await api.post("/auth/otp/verify", { email, code });
      toast.success("Email terverifikasi!");
      onVerified?.();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setVerifying(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4" data-testid="otp-verifier">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold">
        <Mail className="h-4 w-4" /> Verifikasi Email
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Kami akan mengirim kode 6-digit ke <span className="font-semibold text-foreground">{email || "email Anda"}</span>.
      </p>
      {!sent ? (
        <button
          data-testid="otp-send-btn"
          onClick={send}
          disabled={sending || !email}
          className="w-full rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          {sending ? "Mengirim..." : "Kirim kode OTP"}
        </button>
      ) : (
        <div className="space-y-2">
          <input
            data-testid="otp-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-center font-heading text-2xl font-bold tracking-[0.5em]"
          />
          <div className="flex gap-2">
            <button
              data-testid="otp-verify-btn"
              onClick={verify}
              disabled={verifying || code.length !== 6}
              className="flex-1 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {verifying ? "Memverifikasi..." : "Verifikasi"}
            </button>
            <button
              data-testid="otp-resend-btn"
              onClick={send}
              disabled={sending}
              className="rounded-full border border-border px-3 py-2.5 text-xs font-semibold"
            >
              Kirim ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
