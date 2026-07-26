import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Truck, CreditCard, Banknote, MapPin, CheckCircle2, Wallet, Building2, Store as StoreIcon, Info } from "lucide-react";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const { currency, lang } = useApp();

  const [addr, setAddr] = useState({
    label: "Home",
    recipient: user?.name || "",
    phone: user?.phone || "",
    line1: user?.addresses?.[0]?.line1 || "",
    city: user?.addresses?.[0]?.city || "Jakarta",
    province: user?.addresses?.[0]?.province || "DKI Jakarta",
    postal_code: user?.addresses?.[0]?.postal_code || "10220",
  });
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [payment, setPayment] = useState("doku"); // "cod" | "doku"
  const [dokuMethods, setDokuMethods] = useState([]);
  const [dokuSimulated, setDokuSimulated] = useState(true);
  const [dokuMethod, setDokuMethod] = useState("va_bca");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    api.post("/shipping/quote", { destination_city: addr.city, weight_grams: items.length * 1000 })
      .then((r) => {
        setCouriers(r.data.options);
        setSelectedCourier(r.data.options[0]);
      });
  }, [addr.city, items.length]);

  useEffect(() => {
    api.get("/payments/doku/methods").then((r) => {
      setDokuMethods(r.data.methods || []);
      setDokuSimulated(r.data.simulated);
    });
  }, []);

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const r = await api.post("/coupons/validate", { code: coupon, subtotal });
      setDiscount(r.data.discount);
      setCouponMsg(`Applied ${r.data.coupon.code}: −${formatCurrency(r.data.discount, currency, lang)}`);
      toast.success("Coupon applied");
    } catch (e) {
      setDiscount(0);
      setCouponMsg("");
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const shipping = selectedCourier?.cost || 0;
  const total = subtotal + shipping - discount;

  const placeOrder = async () => {
    if (!items.length) return toast.error("Cart is empty");
    if (!selectedCourier) return toast.error("Select a courier");
    if (payment === "doku" && !dokuMethod) return toast.error("Pilih metode DOKU");
    setPlacing(true);
    try {
      const r = await api.post("/orders", {
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        address: addr,
        payment_method: payment,
        doku_method: payment === "doku" ? dokuMethod : null,
        courier_code: selectedCourier.courier_code,
        courier_service: selectedCourier.service,
        shipping_cost: selectedCourier.cost,
        coupon_code: coupon || null,
      });
      toast.success("Order placed!");
      clear();
      nav(`/orders/${r.data.id}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setPlacing(false);
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
      </div>
    );
  }

  const groupedDoku = {
    va: dokuMethods.filter((m) => m.kind === "va"),
    ewallet: dokuMethods.filter((m) => m.kind === "ewallet"),
    card: dokuMethods.filter((m) => m.kind === "card"),
    o2o: dokuMethods.filter((m) => m.kind === "o2o"),
  };

  const dokuGroupIcon = {
    va: <Building2 className="h-3.5 w-3.5" />,
    ewallet: <Wallet className="h-3.5 w-3.5" />,
    card: <CreditCard className="h-3.5 w-3.5" />,
    o2o: <StoreIcon className="h-3.5 w-3.5" />,
  };
  const dokuGroupLabel = { va: "Virtual Account", ewallet: "E-Wallet & QRIS", card: "Kartu Kredit / Debit", o2o: "Convenience Store" };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="checkout-page">
      <h1 className="mb-6 font-heading text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold"><MapPin className="h-5 w-5" /> Shipping address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Recipient" value={addr.recipient} onChange={(v) => setAddr({ ...addr, recipient: v })} testid="addr-recipient" />
              <Field label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} testid="addr-phone" />
              <Field label="Address line" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} className="sm:col-span-2" testid="addr-line1" />
              <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} testid="addr-city" />
              <Field label="Province" value={addr.province} onChange={(v) => setAddr({ ...addr, province: v })} testid="addr-province" />
              <Field label="Postal code" value={addr.postal_code} onChange={(v) => setAddr({ ...addr, postal_code: v })} testid="addr-postal" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold"><Truck className="h-5 w-5" /> Courier</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {couriers.map((c) => {
                const key = `${c.courier_code}-${c.service}`;
                const active = selectedCourier && selectedCourier.courier_code === c.courier_code && selectedCourier.service === c.service;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCourier(c)}
                    data-testid={`courier-${key}`}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{c.courier_name} · {c.service}</div>
                      <div className="text-[11px] text-muted-foreground">{c.etd}</div>
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(c.cost, currency, lang)}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5" data-testid="payment-section">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold"><CreditCard className="h-5 w-5" /> Payment method</h2>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <PayOpt active={payment === "doku"} onClick={() => setPayment("doku")} testid="pay-doku" icon={<CreditCard className="h-4 w-4" />} title="DOKU Payment" subtitle="VA, E-wallet, Kartu, Alfamart" />
              <PayOpt active={payment === "cod"} onClick={() => setPayment("cod")} testid="pay-cod" icon={<Banknote className="h-4 w-4" />} title="Cash on Delivery" subtitle="Bayar saat barang tiba" />
            </div>

            {payment === "doku" && (
              <div data-testid="doku-methods">
                {dokuSimulated && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>Mode simulasi DOKU aktif. Instruksi pembayaran akan dibuat lokal untuk testing UI. Isi <code className="rounded bg-amber-500/20 px-1">DOKU_CLIENT_ID</code> & <code className="rounded bg-amber-500/20 px-1">DOKU_SECRET_KEY</code> di backend .env untuk aktivasi sandbox asli.</span>
                  </div>
                )}
                {Object.entries(groupedDoku).map(([kind, list]) => list.length > 0 && (
                  <div key={kind} className="mb-3">
                    <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {dokuGroupIcon[kind]} {dokuGroupLabel[kind]}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {list.map((m) => (
                        <button
                          key={m.code}
                          onClick={() => setDokuMethod(m.code)}
                          data-testid={`doku-method-${m.code}`}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${
                            dokuMethod === m.code ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-heading font-bold">Order summary</h3>
          <div className="mb-3 space-y-2">
            {items.map((i) => (
              <div key={i.product_id} className="flex items-center gap-2 text-xs">
                <img src={i.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 truncate">{i.name} × {i.qty}</div>
              </div>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <input data-testid="coupon-input" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon (HEMAT30)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs" />
            <button data-testid="coupon-apply" onClick={applyCoupon} className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">Apply</button>
          </div>
          {couponMsg && <div data-testid="coupon-msg" className="mb-2 text-xs text-primary">{couponMsg}</div>}
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal, currency, lang)} />
            <Row label="Shipping" value={formatCurrency(shipping, currency, lang)} />
            {discount > 0 && <Row label="Discount" value={`−${formatCurrency(discount, currency, lang)}`} accent />}
          </div>
          <div className="my-3 border-t border-border" />
          <Row label="Total" value={formatCurrency(total, currency, lang)} big />
          <button data-testid="place-order-btn" disabled={placing} onClick={placeOrder} className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {placing ? "Placing..." : "Place order"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = "", testid }) {
  return (
    <label className={`flex flex-col text-xs ${className}`}>
      <span className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}

function PayOpt({ active, onClick, icon, title, subtitle, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted">{icon}</div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
      {active && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
    </button>
  );
}

function Row({ label, value, big, accent }) {
  return (
    <div className="flex justify-between">
      <span className={big ? "font-heading text-base font-bold" : "text-muted-foreground"}>{label}</span>
      <span className={`${big ? "font-heading text-lg font-bold" : ""} ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
