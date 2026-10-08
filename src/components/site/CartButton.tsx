import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cart, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/config";

export function CartButton() {
  const items = useCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("nll-open-cart", h);
    return () => window.removeEventListener("nll-open-cart", h);
  }, []);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Carrinho" className="relative rounded-full p-2 hover:bg-secondary">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{count}</span>
        )}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="font-display">Carrinho {count > 0 && <span className="text-primary">({count})</span>}</SheetTitle>
          </SheetHeader>
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 font-display text-lg font-bold">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione produtos para começar seu pedido.</p>
              <Link to="/figures" onClick={() => setOpen(false)} className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-glow">Ver produtos</Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y overflow-y-auto">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold">{i.name}</p>
                        <button onClick={() => cart.remove(i.id)} aria-label="Remover" className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatPrice(i.price)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border">
                          <button onClick={() => cart.dec(i.id)} aria-label="Diminuir" className="grid h-9 w-9 place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                          <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                          <button onClick={() => cart.inc(i.id)} aria-label="Aumentar" className="grid h-9 w-9 place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
                        </div>
                        <span className="font-display font-bold">{formatPrice(i.price * i.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-display text-xl font-bold text-primary">{formatPrice(subtotal)}</span>
                </div>
                <Link to="/finalizar" onClick={() => setOpen(false)} className="block w-full rounded-xl bg-primary px-6 py-3 text-center font-bold text-primary-foreground shadow-glow">Finalizar pedido</Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
