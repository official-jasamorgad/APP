import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { tr } from "@/lib/i18n";
import { Truck } from "lucide-react";

const COURIERS = ["JNE", "J&T Express", "SiCepat", "POS Indonesia", "AnterAja", "Ninja Xpress", "TIKI", "Lion Parcel", "SAP Express", "ID Express"];

export default function Footer() {
  const { lang } = useApp();
  const t = (k) => tr(lang, k);
  return (
    <footer className="mt-24 border-t border-border bg-muted/40" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[2px] shadow-[0_4px_20px_-4px_rgba(217,119,6,0.5)] ring-1 ring-amber-500/40">
              <div className="grid h-full w-full place-items-center rounded-[14px] bg-neutral-900">
                <img src="/logo.png" alt="JASAMORGAD" width={40} height={40} className="h-9 w-9 object-contain" style={{ filter: "contrast(1.15) saturate(1.2)" }} />
              </div>
            </div>
            <span className="font-heading text-lg font-black tracking-tight bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">{t("brand.name")}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("brand.tag")}</p>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider">{t("footer.about")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/stores">Stores</Link></li>
            <li><a href="#">{t("footer.contact")}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#">{t("footer.terms")}</a></li>
            <li><a href="#">{t("footer.privacy")}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider">
            <Truck className="h-4 w-4" /> {t("footer.couriers")}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {COURIERS.map((c) => (
              <span key={c} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium">{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        {t("footer.copy")}
      </div>
    </footer>
  );
}
