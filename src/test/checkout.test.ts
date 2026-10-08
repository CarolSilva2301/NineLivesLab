import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITE_CONFIG, productWhatsapp, whatsappLink } from "@/lib/config";
import { orderTotal, orderWhatsapp } from "@/lib/checkout";
import type { Product } from "@/lib/products";

const product = (id: string, price = 10) => ({ id, name: `Produto ${id}`, price, promo_price: null, image_url: null }) as Product;
const customer = { nome: "Cliente teste", whatsapp: "85999999999", cidade: "Fortaleza", email: "", obs: "" };

describe("Purchase rules", () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.resetModules(); });

  it("keeps A and B intact when buying only C at quantity 1", async () => {
    const { cart, buyNow } = await import("@/lib/cart");
    cart.add(product("A"), 2);
    cart.add(product("B", 20));
    const saved = localStorage.getItem("nll-cart");
    buyNow.start(product("C", 30));
    expect(buyNow.get()).toEqual([{ id: "C", name: "Produto C", price: 30, qty: 1, image_url: null }]);
    orderWhatsapp(buyNow.get(), customer);
    expect(localStorage.getItem("nll-cart")).toBe(saved);
  });

  it("adds to the existing main cart without replacing products", async () => {
    const { cart } = await import("@/lib/cart");
    cart.add(product("A")); cart.add(product("B")); cart.add(product("A"));
    const items = JSON.parse(localStorage.getItem("nll-cart") ?? "[]");
    expect(items.map((i: { id: string; qty: number }) => [i.id, i.qty])).toEqual([["A", 2], ["B", 1]]);
  });

  it("calculates cart total using every quantity", () => {
    expect(orderTotal([{ id: "A", name: "A", price: 10, qty: 2, image_url: null }, { id: "B", name: "B", price: 20, qty: 3, image_url: null }])).toBe(80);
  });

  it("calculates immediate purchase total using only C", async () => {
    const { buyNow } = await import("@/lib/cart");
    buyNow.start(product("C", 30));
    expect(orderTotal(buyNow.get())).toBe(30);
  });

  it("uses the official WhatsApp for every message helper", () => {
    expect(SITE_CONFIG.whatsappNumber).toBe("5585996313296");
    for (const url of [whatsappLink(), productWhatsapp(product("C")), orderWhatsapp([], customer)]) {
      expect(new URL(url).pathname).toBe("/5585996313296");
    }
  });

  it("uses the official Instagram account", () => {
    expect(SITE_CONFIG.instagramHandle).toBe("@ninelives.3d");
    expect(SITE_CONFIG.instagramUrl).toBe("https://instagram.com/ninelives.3d");
  });
});