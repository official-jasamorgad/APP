import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";

export default function StoreCard({ store, index = 0 }) {
  return (
    <Link
      to={`/stores/${store.id}`}
      data-testid={`store-card-${store.id}`}
      className="group fade-up overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      <div className="relative h-32 overflow-hidden bg-muted">
        <img
          src={store.banner}
          alt={store.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <img
          src={store.logo}
          alt=""
          className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-background object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold">{store.name}</h3>
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold">{store.rating?.toFixed(1)}</span>
          </div>
        </div>
        <p className="line-clamp-2 mt-1 text-xs text-muted-foreground">{store.description}</p>
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{store.address}</span>
        </div>
      </div>
    </Link>
  );
}
