import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Zap } from "lucide-react";
import { BADGES, formatPrice } from "@/lib/config";
import type { Product } from "@/lib/products";
import { buyNow, cart } from "@/lib/cart";

export function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const add = () => {
    cart.add(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:border-primary/60">
      <button onClick={() => onOpen(p)} className="relative aspect-square overflow-hidden bg-muted text-left">
        {p.image_url && (
          <img src={p.image_url} alt={p.name} loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        {p.badge !== "nenhum" && (
          <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {BADGES[p.badge]}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <span className="text-[11px] uppercase tracking-wider text-primary">{p.category}</span>
        <button onClick={() => onOpen(p)} className="line-clamp-2 text-left text-sm font-semibold md:text-base">{p.name}</button>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-display text-lg font-bold">{formatPrice(p.promo_price ?? p.price)}</span>
          {p.promo_price != null && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>}
        </div>
        <button onClick={() => { buyNow.start(p); navigate({ to: "/finalizar", search: { modo: "comprar" } }); }}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:opacity-90 md:text-sm">
          <Zap className="h-4 w-4" /> Comprar
        </button>
        <button onClick={add}
          className="mt-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-primary/50 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 md:text-sm">
          {added ? "Adicionado ✓" : <><ShoppingCart className="h-4 w-4 shrink-0" /> <span className="truncate">Adicionar ao carrinho</span></>}
        </button>
      </div>
    </div>
  );
}
