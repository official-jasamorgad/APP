import { Link } from "react-router-dom";
import { Clock, MapPin, Star, Wrench } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";

export default function ServiceCard({ service, index = 0 }) {
  const { lang, currency } = useApp();
  return (
    <Link
      to={`/services/${service.id}`}
      data-testid={`service-card-${service.id}`}
      className="group fade-up flex overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      <div className="w-32 flex-shrink-0 overflow-hidden bg-muted">
        <img
          src={service.images?.[0]}
          alt={service.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>{service.rating?.toFixed(1) || "—"}</span>
            <span>({service.review_count || 0})</span>
          </div>
          <h3 className="font-heading text-base font-bold">{service.name}</h3>
          <p className="line-clamp-2 mt-1 text-xs text-muted-foreground">{service.description}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{service.duration_min}m</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{service.service_area}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">from</div>
            <div className="font-heading text-sm font-bold text-primary">
              {formatCurrency(service.starting_price, currency, lang)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
