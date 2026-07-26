import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { CheckCircle2, Package, Truck, Home, Copy, CreditCard, Building2, Wallet, Store as StoreIcon, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function OrderDetail() {
  const { id } = useParams();
  const { currency, lang } = useApp();
  const [order, setOrder] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  // Tick every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!order) return <div className="p-8">Loading...</div>;

  const steps = ["pending", "paid", "processing", "shipped", "delivered"];
  const currentIdx = steps.indexOf(order.status);
  const doku = order.doku_instructions;
  const isCancelled = order.status === "cancelled";

  const expiresMs = order.expires_at ? new Date(order.expires_at).getTime() : null;
  const remaining = expiresMs ? expiresMs - now : null;
  const expired = remaining !== null && remaining <= 0;
  const canCancel = ["pending", "paid", "processing"].includes(order.status);

  const copyToClipboard = (val, label) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} disalin`);
  };

  const cancelOrder = async () => {
    if (!window.confirm("Batalkan pesanan ini? Stok akan dikembalikan.")) return;
    setCancelling(true);
    try {
      const r = await api.post(`/orders/${id}/cancel`);
      setOrder(r.data);
      toast.success("Pesanan dibatalkan");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setCancelling(false);
  };

  const fmtCountdown = (ms) => {
    if (ms <= 0) return "00:00";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" data-testid="order-detail-page">
      <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-5 ${isCancelled ? "border-destructive/40 bg-destructive/5" : "border-border bg-primary/5"}`}>
        {isCancelled ? <XCircle className="h-8 w-8 text-destructive" /> : <CheckCircle2 className="h-8 w-8 text-primary" />}
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold">{isCancelled ? "Order cancelled" : "Order confirmed"}</h1>
          <p className="text-sm text-muted-foreground">AWB: {order.tracking_number}{order.cancel_reason ? ` · ${order.cancel_reason}` : ""}</p>
        </div>
        {canCancel && (
          <button
            onClick={cancelOrder}
            disabled={cancelling}
            data-testid="cancel-order-btn"
            className="rounded-full border border-destructive px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          >
            {cancelling ? "..." : "Batalkan"}
          </button>
        )}
      </div>

      {!isCancelled && expiresMs && order.status === "pending" && (
        <div
          data-testid="expiry-countdown"
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${expired ? "border-destructive/50 bg-destructive/10" : "border-amber-500/50 bg-amber-500/10"}`}
        >
          <Clock className={`h-6 w-6 ${expired ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`} />
          <div className="flex-1">
            <div className="text-sm font-bold">
              {expired ? "Waktu pembayaran habis" : "Selesaikan pembayaran dalam"}
            </div>
            <div className="text-xs text-muted-foreground">
              {expired
                ? "Pesanan akan otomatis dibatalkan dan stok dikembalikan."
                : "Setelah lewat batas waktu, pesanan otomatis dibatalkan dan stok dikembalikan."}
            </div>
          </div>
          <div className={`font-heading text-3xl font-extrabold tabular-nums ${expired ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>
            {fmtCountdown(remaining)}
          </div>
        </div>
      )}

      {doku && (
        <div className="mb-6 rounded-2xl border-2 border-primary/40 bg-card p-5" data-testid="doku-instructions">
          <div className="mb-3 flex items-center gap-2">
            {doku.method?.startsWith("va_") && <Building2 className="h-5 w-5 text-primary" />}
            {doku.method === "credit_card" && <CreditCard className="h-5 w-5 text-primary" />}
            {["ovo", "dana", "shopeepay", "linkaja"].includes(doku.method) && <Wallet className="h-5 w-5 text-primary" />}
            {["alfamart", "indomaret"].includes(doku.method) && <StoreIcon className="h-5 w-5 text-primary" />}
            <div>
              <h2 className="font-heading text-lg font-bold">Instruksi Pembayaran DOKU</h2>
              <p className="text-xs text-muted-foreground">{doku.method_label} · Status: {doku.status}</p>
            </div>
            {doku.simulated && (
              <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Simulasi</span>
            )}
          </div>

          {doku.virtual_account_number && (
            <div className="mb-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Nomor Virtual Account</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-heading text-2xl font-extrabold tracking-widest">{doku.virtual_account_number}</span>
                <button data-testid="copy-va" onClick={() => copyToClipboard(doku.virtual_account_number, "VA Number")} className="rounded-full border border-border p-1.5 hover:bg-background">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Transfer tepat <span className="font-bold text-foreground">{formatCurrency(doku.amount, currency, lang)}</span> ke VA di atas. Berlaku {doku.expiry_minutes || 60} menit.
              </div>
            </div>
          )}

          {doku.payment_code && (
            <div className="mb-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Kode Pembayaran</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-heading text-2xl font-extrabold tracking-widest">{doku.payment_code}</span>
                <button data-testid="copy-code" onClick={() => copyToClipboard(doku.payment_code, "Payment Code")} className="rounded-full border border-border p-1.5 hover:bg-background">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Bawa kode ke kasir {doku.method_label}. Bayar {formatCurrency(doku.amount, currency, lang)}.</div>
            </div>
          )}

          {doku.qr_url && (
            <div className="mb-3 flex items-start gap-4 rounded-xl border border-border bg-muted/40 p-4">
              <img src={doku.qr_url} alt="QR code" className="h-32 w-32 rounded-lg bg-white p-1" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Scan untuk bayar</div>
                <div className="mt-1 text-sm">Buka aplikasi {doku.method_label}, tekan Scan QR, lalu bayar {formatCurrency(doku.amount, currency, lang)}.</div>
                {doku.deeplink && (
                  <a href={doku.deeplink} target="_blank" rel="noreferrer" data-testid="doku-deeplink" className="mt-2 inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Buka {doku.method_label}</a>
                )}
              </div>
            </div>
          )}

          {doku.payment_url && !doku.qr_url && (
            <a href={doku.payment_url} target="_blank" rel="noreferrer" data-testid="doku-payment-url" className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Lanjutkan ke halaman pembayaran
            </a>
          )}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border p-5">
        <h2 className="mb-4 font-heading text-lg font-bold">Shipping status</h2>
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center text-center">
              <div className={`grid h-9 w-9 place-items-center rounded-full border-2 ${
                i <= currentIdx ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
              }`}>
                {i === 0 && <Package className="h-4 w-4" />}
                {i === 1 && <CheckCircle2 className="h-4 w-4" />}
                {i === 2 && <Package className="h-4 w-4" />}
                {i === 3 && <Truck className="h-4 w-4" />}
                {i === 4 && <Home className="h-4 w-4" />}
              </div>
              <div className="mt-1 text-[11px] font-semibold capitalize">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 font-heading font-bold">Items</h3>
          {order.items.map((it) => (
            <div key={it.product_id} className="mb-2 flex items-center gap-3">
              <img src={it.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.qty} × {formatCurrency(it.price, currency, lang)}</div>
              </div>
              <div className="text-sm font-bold">{formatCurrency(it.line_total, currency, lang)}</div>
            </div>
          ))}
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal, currency, lang)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping ({order.courier_code.toUpperCase()} {order.courier_service})</span><span>{formatCurrency(order.shipping_cost, currency, lang)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>−{formatCurrency(order.discount, currency, lang)}</span></div>}
            <div className="flex justify-between font-heading text-base font-bold pt-2 border-t border-border"><span>Total</span><span>{formatCurrency(order.total, currency, lang)}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border p-5">
            <h3 className="mb-2 font-heading font-bold">Shipping to</h3>
            <div className="text-sm">
              <div className="font-semibold">{order.address.recipient}</div>
              <div className="text-muted-foreground">{order.address.phone}</div>
              <div className="text-muted-foreground">{order.address.line1}, {order.address.city}, {order.address.province} {order.address.postal_code}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <h3 className="mb-2 font-heading font-bold">Payment</h3>
            <div className="text-sm text-muted-foreground">
              {order.payment_method === "cod" ? "Cash on Delivery" : `DOKU · ${order.doku_instructions?.method_label || order.doku_method || "—"}`}
            </div>
          </div>
        </div>
      </div>
      <Link to="/dashboard/customer" className="mt-6 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold">Go to my orders</Link>
    </div>
  );
}
