import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, remove, setQty, subtotal } = useCart();
  const { currency, lang } = useApp();
  const nav = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="cart-page">
      <h1 className="mb-6 font-heading text-3xl font-bold sm:text-4xl">Your cart</h1>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/products" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Browse products</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((i) => {
              const eff = i.price - Math.round((i.price * (i.discount || 0)) / 100);
              return (
                <div key={i.product_id} data-testid={`cart-item-${i.product_id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <img src={i.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{i.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(eff, currency, lang)} each</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-border">
                        <button data-testid={`cart-dec-${i.product_id}`} onClick={() => setQty(i.product_id, i.qty - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-xs font-semibold">{i.qty}</span>
                        <button data-testid={`cart-inc-${i.product_id}`} onClick={() => setQty(i.product_id, i.qty + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button data-testid={`cart-remove-${i.product_id}`} onClick={() => remove(i.product_id)} className="flex items-center gap-1 text-xs text-destructive">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(eff * i.qty, currency, lang)}</div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-heading font-bold">Order summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span data-testid="cart-subtotal" className="font-semibold">{formatCurrency(subtotal, currency, lang)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>Calculated at checkout</span></div>
            </div>
            <div className="my-3 border-t border-border" />
            <button data-testid="checkout-btn" onClick={() => nav("/checkout")} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground">Checkout</button>
          </aside>
        </div>
      )}
    </div>
  );
}
