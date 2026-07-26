import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Copy, Clock } from "lucide-react";

export default function DigitalOrderDetail() {
  const { id } = useParams();
  const { currency, lang } = useApp();
  const [order, setOrder] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.get(`/digital/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!order) return <div className="p-8">Loading...</div>;

  const doku = order.doku_instructions;
  const isCancelled = order.status === "cancelled";
  const expiresMs = order.expires_at ? new Date(order.expires_at).getTime() : null;
  const remaining = expiresMs ? expiresMs - now : null;
  const expired = remaining !== null && remaining <= 0;
  const copy = (v, l) => { navigator.clipboard.writeText(v); toast.success(`${l} disalin`); };
  const fmt = (ms) => {
    if (ms <= 0) return "00:00";
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" data-testid="digital-order-detail">
      <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-5 ${isCancelled ? "border-destructive/40 bg-destructive/5" : "border-border bg-primary/5"}`}>
        {isCancelled ? <XCircle className="h-8 w-8 text-destructive" /> : <CheckCircle2 className="h-8 w-8 text-primary" />}
        <div>
          <h1 className="font-heading text-xl font-bold">{isCancelled ? "Pesanan dibatalkan" : "Pesanan digital dibuat"}</h1>
          <p className="text-sm text-muted-foreground">{order.product_name} → <span className="font-mono">{order.target_id}</span></p>
        </div>
      </div>

      {!isCancelled && expiresMs && order.status === "pending" && (
        <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${expired ? "border-destructive/50 bg-destructive/10" : "border-amber-500/50 bg-amber-500/10"}`}>
          <Clock className={`h-6 w-6 ${expired ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`} />
          <div className="flex-1">
            <div className="text-sm font-bold">{expired ? "Waktu habis" : "Bayar dalam"}</div>
            <div className="text-xs text-muted-foreground">Kalau lewat, order otomatis dibatalkan.</div>
          </div>
          <div className={`font-heading text-3xl font-extrabold tabular-nums ${expired ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>{fmt(remaining)}</div>
        </div>
      )}

      {doku && (
        <div className="mb-6 rounded-2xl border-2 border-primary/40 bg-card p-5" data-testid="digital-doku-instructions">
          <h2 className="mb-3 font-heading text-lg font-bold">Instruksi Pembayaran DOKU · {doku.method_label}</h2>
          {doku.virtual_account_number && (
            <div className="mb-3 rounded-xl bg-muted/40 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Nomor Virtual Account</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-heading text-2xl font-extrabold tracking-widest">{doku.virtual_account_number}</span>
                <button onClick={() => copy(doku.virtual_account_number, "VA")} className="rounded-full border border-border p-1.5"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Bayar <span className="font-bold text-foreground">{formatCurrency(doku.amount, currency, lang)}</span></div>
            </div>
          )}
          {doku.payment_code && (
            <div className="mb-3 rounded-xl bg-muted/40 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Kode Pembayaran</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-heading text-2xl font-extrabold">{doku.payment_code}</span>
                <button onClick={() => copy(doku.payment_code, "Kode")} className="rounded-full border border-border p-1.5"><Copy className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
          {doku.qr_url && (
            <div className="flex items-start gap-3">
              <img src={doku.qr_url} alt="" className="h-32 w-32 rounded-lg bg-white p-1" />
              <p className="text-sm">Scan QR di aplikasi {doku.method_label}, lalu bayar {formatCurrency(doku.amount, currency, lang)}.</p>
            </div>
          )}
        </div>
      )}

      <Link to="/dashboard/customer" className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold">Kembali ke Dasbor</Link>
    </div>
  );
}
