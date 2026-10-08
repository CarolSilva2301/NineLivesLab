import { describe, expect, it } from "vitest";
import { customerSchema, orderInputSchema } from "@/lib/order-schema";
import { orderWhatsapp, orderContactWhatsapp } from "@/lib/checkout";

const customer = { nome: "Maria", whatsapp: "85999999999", cidade: "Fortaleza", email: "", obs: "Entregar à tarde" };

describe("Order storage validation", () => {
  it("uses the stored order number in the optional contact message", () => {
    const url = new URL(orderContactWhatsapp("NL-00021"));
    expect(url.pathname).toBe("/5585996313296");
    expect(url.searchParams.get("text")).toBe("Olá! Acabei de realizar o pedido #NL-00021 na Nine Lives Lab. Gostaria de falar sobre meu pedido. 😊");
  });
  for (const field of ["nome", "whatsapp", "cidade"] as const) {
    it(`rejects missing required ${field}`, () => {
      expect(customerSchema.safeParse({ ...customer, [field]: "   " }).success).toBe(false);
    });
  }
  it("allows empty email and preserves notes", () => {
    expect(customerSchema.parse(customer)).toEqual(customer);
  });
  it("requires a real product id and positive integer quantity", () => {
    const input = { requestId: "34d2a73a-e6a0-4b83-96cf-a2e366993070", customer, items: [{ product_id: "34d2a73a-e6a0-4b83-96cf-a2e366993071", quantity: 3, unit_price: 49.9 }] };
    expect(orderInputSchema.parse(input).items[0]?.quantity).toBe(3);
    expect(orderInputSchema.safeParse({ ...input, items: [{ ...input.items[0], quantity: 0 }] }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...input, items: [{ ...input.items[0], product_id: "fake" }] }).success).toBe(false);
  });
  it("adds the friendly stored number without dropping WhatsApp order details", () => {
    const message = new URL(orderWhatsapp([{ id: "C", name: "Produto C", price: 49.9, qty: 1, image_url: null }], customer, "NL-00021")).searchParams.get("text");
    expect(message).toContain("Pedido: #NL-00021");
    expect(message).toContain("Produto C");
    expect(message).toContain("Entregar à tarde");
  });
});