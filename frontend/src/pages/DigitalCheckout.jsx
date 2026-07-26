import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { ChevronLeft, CreditCard, Banknote, Building2, Wallet, Store as StoreIcon, Info } from "lucide-react";

export default function DigitalCheckout() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { currency, lang } = useApp();
  const [product, setProduct] = useState(null);
  const [target, setTarget] = useState("");
  const [meta, setMeta] = useState("");
  const [payment, setPayment] = useState("doku");
  const [dokuMethods, setDokuMethods] = useState([]);
  const [dokuSimulated, setDokuSimulated] = useState(true);
  const [dokuMethod, setDokuMethod] = useState("va_bca");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get(`/digital/products/${id}`).then((r) => setProduct(r.data));
    api.get("/payments/doku/methods").then((r) => {
      setDokuMethods(r.data.methods || []);
      setDokuSimulated(r.data.simulated);
    });
  }, [id]);

  if (!product) return <div className="p-8">Loading...</div>;

  const isGame = product.category_slug === "games";
  const needsServer = /Mobile Legends|Genshin|Honor of Kings/.test(product.provider);

  const submit = async () => {
    if (!user) {
      toast.error("Silakan masuk terlebih dulu");
      nav("/login");
      return;
    }
    if (!target.trim()) return toast.error("Isi target ID / nomor tujuan");
    setPlacing(true);
    try {
      const r = await api.post("/digital/order", {
        product_id: product.id,
        target_id: target.trim(),
        target_meta: meta.trim() || null,
        payment_method: payment,
        doku_method: payment === "doku" ? dokuMethod : null,
      });
      toast.success("Pesanan digital dibuat!");
      nav(`/digital/orders/${r.data.id}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setPlacing(false);
  };

  const groupedDoku = {
    va: dokuMethods.filter((m) => m.kind === "va"),
    ewallet: dokuMethods.filter((m) => m.kind === "ewallet"),
    card: dokuMethods.filter((m) => m.kind === "card"),
    o2o: dokuMethods.filter((m) => m.kind === "o2o"),
  };
  const dokuGroupIcon = { va: <Building2 className="h-3.5 w-3.5" />, ewallet: <Wallet className="h-3.5 w-3.5" />, card: <CreditCard className="h-3.5 w-3.5" />, o2o: <StoreIcon className="h-3.5 w-3.5" /> };
  const dokuGroupLabel = { va: "Virtual Account", ewallet: "E-Wallet & QRIS", card: "Kartu Kredit / Debit", o2o: "Convenience Store" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6" data-testid="digital-checkout-page">
      <button onClick={() => nav(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <img src={product.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <div className="text-xs text-muted-foreground">{product.provider}</div>
                <h1 className="font-heading text-lg font-bold">{product.denom_label}</h1>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{product.target_hint}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-bold">Data tujuan</h2>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isGame ? "User ID Game" : product.category_slug === "listrik" ? "Nomor Meter / ID Pelanggan" : "Nomor HP"}
              </span>
              <input
                data-testid="digital-target-input"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={isGame ? "1234567890" : "081234567890"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
            {isGame && needsServer && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Server ID</span>
                <input
                  data-testid="digital-meta-input"
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  placeholder="2033"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-bold">Metode pembayaran</h2>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setPayment("doku")}
                data-testid="digital-pay-doku"
                className={`flex items-center gap-3 rounded-xl border p-3 text-left ${payment === "doku" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                <CreditCard className="h-4 w-4" />
                <div>
                  <div className="text-sm font-bold">DOKU Payment</div>
                  <div className="text-[11px] text-muted-foreground">VA, E-wallet, Kartu, Alfamart</div>
                </div>
              </button>
              <button
                onClick={() => setPayment("cod")}
                data-testid="digital-pay-cod"
                disabled
                className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left opacity-50"
              >
                <Banknote className="h-4 w-4" />
                <div>
                  <div className="text-sm font-bold">COD (n/a untuk digital)</div>
                  <div className="text-[11px] text-muted-foreground">Produk digital tidak mendukung COD</div>
                </div>
              </button>
            </div>

            {payment === "doku" && (
              <div>
                {dokuSimulated && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>Mode simulasi DOKU aktif. Isi <code className="rounded bg-amber-500/20 px-1">DOKU_CLIENT_ID</code> & <code className="rounded bg-amber-500/20 px-1">DOKU_SECRET_KEY</code> untuk sandbox asli.</span>
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
                          data-testid={`digital-doku-${m.code}`}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${dokuMethod === m.code ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-heading font-bold">Ringkasan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{product.denom_label}</span><span>{formatCurrency(product.price, currency, lang)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Biaya admin</span><span>Rp 0</span></div>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex justify-between font-heading text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(product.price, currency, lang)}</span>
          </div>
          <button
            data-testid="digital-place-order"
            onClick={submit}
            disabled={placing}
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {placing ? "Memproses..." : "Bayar sekarang"}
          </button>
        </aside>
      </div>
    </div>
  );
}
