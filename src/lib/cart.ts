import { useSyncExternalStore } from "react";
import type { Product } from "@/lib/products";

export type CartItem = { id: string; name: string; price: number; image_url: string | null; qty: number };

const KEY = "nll-cart";
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { items = []; }
}
function set(next: CartItem[]) {
  items = next;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export const cart = {
  add(p: Product) {
    load();
    const ex = items.find((i) => i.id === p.id);
    if (ex) set(items.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)));
    else set([...items, { id: p.id, name: p.name, price: Number(p.promo_price ?? p.price), image_url: p.image_url, qty: 1 }]);
  },
  inc(id: string) { set(items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))); },
  dec(id: string) { set(items.flatMap((i) => (i.id !== id ? [i] : i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []))); },
  remove(id: string) { set(items.filter((i) => i.id !== id)); },
};

export function useCart() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => { load(); return items; },
    () => EMPTY,
  );
}
