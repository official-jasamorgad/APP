import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, effectivePrice } from "@/lib/format";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ProductCard({ product, index = 0 }) {
  const { add } = useCart();
  const { currency, lang } = useApp();
  const { user } = useAuth();
  const [wished, setWished] = useState(false);
  const [pop, setPop] = useState(false);

  const eff = effectivePrice(product);
  const hasDisc = product.discount > 0;

  const onWish = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to save to wishlist");
      return;
    }
    try {
      if (!wished) {
        await api.post(`/wishlist/${product.id}`);
        setWished(true);
        setPop(true);
        setTimeout(() => setPop(false), 400);
        toast.success("Added to wishlist");
      } else {
        await api.delete(`/wishlist/${product.id}`);
        setWished(false);
      }
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const onAdd = (e) => {
    e.preventDefault();
    add(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group fade-up relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
      style={{ animationDelay: `${(index % 8) * 40}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images?.[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasDisc && (
          <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
            -{product.discount}%
          </span>
        )}
        <button
          onClick={onWish}
          data-testid={`wishlist-btn-${product.id}`}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-border bg-background/90 backdrop-blur transition-colors hover:bg-background ${
            pop ? "heart-pop" : ""
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-secondary text-secondary" : "text-foreground"}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span>{product.rating?.toFixed(1) || "—"}</span>
          <span>({product.review_count || 0})</span>
        </div>
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-heading text-base font-bold text-foreground">
            {formatCurrency(eff, currency, lang)}
          </span>
          {hasDisc && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.price, currency, lang)}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          data-testid={`add-to-cart-btn-${product.id}`}
          className="mt-3 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          + Cart
        </button>
      </div>
    </Link>
  );
}
