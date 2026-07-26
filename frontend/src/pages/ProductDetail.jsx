import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, effectivePrice } from "@/lib/format";
import { Heart, Star, Store as StoreIcon, ShoppingCart, Zap, Minus, Plus, ChevronLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { currency, lang } = useApp();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);
      api.get(`/stores/${r.data.store_id}`).then((s) => setStore(s.data)).catch(() => {});
    });
    loadReviews();
  }, [id]);

  const loadReviews = () =>
    api.get(`/reviews?target_type=product&target_id=${id}`).then((r) => setReviews(r.data)).catch(() => {});

  if (!product) return <div className="mx-auto max-w-7xl p-8">Loading...</div>;

  const eff = effectivePrice(product);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to write a review");
    try {
      await api.post("/reviews", { target_type: "product", target_id: id, rating, comment });
      toast.success("Review submitted");
      setComment("");
      loadReviews();
    } catch (e) {
      toast.error("Failed to submit review");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="product-detail-page">
      <button onClick={() => nav(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted">
          <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold text-foreground">{product.rating?.toFixed(1)}</span>
            <span>({product.review_count} reviews)</span>
            <span>·</span>
            <span>SKU {product.sku}</span>
          </div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-extrabold text-primary">{formatCurrency(eff, currency, lang)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCurrency(product.price, currency, lang)}</span>
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">-{product.discount}%</span>
              </>
            )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Stock: <span className="font-semibold text-foreground">{product.stock} available</span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button data-testid="qty-dec" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2"><Minus className="h-4 w-4" /></button>
              <span data-testid="qty-value" className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button data-testid="qty-inc" onClick={() => setQty((q) => q + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              data-testid="detail-add-to-cart"
              onClick={() => { add(product, qty); toast.success("Added to cart"); }}
              className="flex items-center gap-2 rounded-full border border-primary bg-background px-5 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </button>
            <button
              data-testid="detail-buy-now"
              onClick={() => { add(product, qty); nav("/checkout"); }}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Zap className="h-4 w-4" /> Buy now
            </button>
          </div>

          {store && (
            <Link to={`/stores/${store.id}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-3" data-testid="store-link">
              <img src={store.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm font-bold"><StoreIcon className="h-3.5 w-3.5" /> {store.name}</div>
                <div className="text-xs text-muted-foreground">{store.address}</div>
              </div>
              <a
                href={`https://wa.me/${store.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Link>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="mb-4 font-heading text-2xl font-bold">Reviews</h2>
        {user && (
          <form onSubmit={submitReview} className="mb-6 rounded-2xl border border-border p-4" data-testid="review-form">
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  data-testid={`rating-${n}`}
                  className="p-1"
                >
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              data-testid="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
              rows={3}
            />
            <button data-testid="submit-review" className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Post review
            </button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border p-4" data-testid={`review-${r.id}`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-sm">{r.user_name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
