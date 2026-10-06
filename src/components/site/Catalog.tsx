import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { CATEGORIES, type ProductType } from "@/lib/config";
import { productsQuery, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";

export function ProductGrid({ items, empty }: { items: Product[]; empty?: string }) {
  const [open, setOpen] = useState<Product | null>(null);
  return (
    <>
      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{empty ?? "Nenhum produto encontrado."}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}
        </div>
      )}
      <ProductModal p={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function Catalog({ type, title, subtitle, placeholder }: { type: ProductType; title: string; subtitle: string; placeholder: string }) {
  const { data } = useSuspenseQuery(productsQuery);
  const [cat, setCat] = useState(() => {
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("categoria") || "Todos";
  }
  return "Todos";
});
  const [q, setQ] = useState("");
  const cats = ["Todos", ...CATEGORIES[type]];
  const items = useMemo(() => data.filter((p) =>
    p.product_type === type &&
    (cat === "Todos" || p.category === cat) &&
    p.name.toLowerCase().includes(q.trim().toLowerCase())), [data, type, cat, q]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="snow relative -mx-4 mb-8 overflow-hidden border-b px-4 py-12 md:py-16">
        <p className="text-sm text-gold">🎄 Edição de Natal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
      </div>
      <div className="sticky top-16 z-30 -mx-4 mb-6 space-y-3 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
              className="h-11 w-full rounded-lg border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)}
            className="hidden h-11 rounded-lg border bg-card px-3 text-sm outline-none focus:border-primary sm:block">
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/60"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <ProductGrid items={items} />
    </div>
  );
}
