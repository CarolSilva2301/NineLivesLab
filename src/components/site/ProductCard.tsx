import { useState } from "react";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { BADGES, formatPrice, productWhatsapp } from "@/lib/config";
import type { Product } from "@/lib/products";
import { cart } from "@/lib/cart";

export function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
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
        <button onClick={add}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 md:text-sm">
          {added ? "Adicionado ao carrinho ✓" : <><ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho</>}
        </button>
        <a href={productWhatsapp(p)} target="_blank" rel="noreferrer"
          className="mt-1.5 flex items-center justify-center gap-1.5 rounded-lg bg-whatsapp py-2 text-xs font-bold text-whatsapp-foreground transition hover:opacity-90 md:text-sm">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>
    </div>
  );
}
