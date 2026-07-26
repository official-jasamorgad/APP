import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          image: (product.images && product.images[0]) || "",
          price: product.price,
          discount: product.discount || 0,
          qty,
        },
      ];
    });
  };

  const remove = (product_id) =>
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));

  const setQty = (product_id, qty) =>
    setItems((prev) =>
      prev
        .map((i) => (i.product_id === product_id ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0)
    );

  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => {
    const eff = i.price - Math.round((i.price * (i.discount || 0)) / 100);
    return s + eff * i.qty;
  }, 0);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
