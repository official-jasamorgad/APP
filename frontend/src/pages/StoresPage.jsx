import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StoreCard from "@/components/StoreCard";

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  useEffect(() => {
    api.get("/stores").then((r) => setStores(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="stores-page">
      <h1 className="mb-6 font-heading text-3xl font-bold sm:text-4xl">All Stores</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((s, i) => <StoreCard key={s.id} store={s} index={i} />)}
      </div>
    </div>
  );
}
