import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BADGES, STATUS, TYPE_LABEL, formatPrice, productWhatsapp, type ProductType } from "@/lib/config";
import type { Product } from "@/lib/products";

export function ProductModal({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => setImg(p?.image_url ?? null), [p]);
  if (!p) return null;
  const images = [p.image_url, ...p.extra_images].filter(Boolean) as string[];
  const rows: [string, string][] = [
    ["Dimensões", p.dimensions], ["Material", p.material], ["Cores", p.colors], ["Disponibilidade", STATUS[p.status] ?? ""],
  ];
  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
        <div className="grid md:grid-cols-2">
          <div className="bg-muted">
            {img && <img src={img} alt={p.name} className="aspect-square w-full object-cover" />}
            {images.length > 1 && (
              <div className="flex gap-2 p-3">
                {images.map((src) => (
                  <button key={src} onClick={() => setImg(src)} className={`h-14 w-14 overflow-hidden rounded-md border-2 ${img === src ? "border-primary" : "border-transparent"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2.5 py-1">{TYPE_LABEL[p.product_type as ProductType]} · {p.category}</span>
              {p.badge !== "nenhum" && <span className="rounded-full bg-secondary px-2.5 py-1">{BADGES[p.badge]}</span>}
            </div>
            <DialogTitle className="font-display text-2xl font-bold">{p.name}</DialogTitle>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{formatPrice(p.promo_price ?? p.price)}</span>
              {p.promo_price != null && <span className="text-muted-foreground line-through">{formatPrice(p.price)}</span>}
            </div>
            {p.description && <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
            <dl className="divide-y rounded-lg border text-sm">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
              ))}
            </dl>
            <a href={productWhatsapp(p)} target="_blank" rel="noreferrer"
              className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-whatsapp py-4 font-bold text-whatsapp-foreground shadow-glow transition hover:opacity-90">
              <MessageCircle className="h-5 w-5" /> PEDIR PELO WHATSAPP
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
