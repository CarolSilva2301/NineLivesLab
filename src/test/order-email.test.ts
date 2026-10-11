import { describe, expect, it } from "vitest";
import { orderGmailCompose } from "@/lib/admin-orders";

const order = {
  email: "cliente+pedido@example.com", customer_name: "João & Ana", order_number: "NL-00123", total: 1234.56,
  items: [
    { product_name: "Decoração & Gato #1", quantity: 2, subtotal: 1000 },
    { product_name: "Peça + suporte", quantity: 3, subtotal: 234.56 },
  ],
  internal_note: "CONFIDENCIAL", notes: "Observação privada", whatsapp: "85999999999",
};
function params(value = order) {
  const url = orderGmailCompose(value);
  if (!url) throw new Error("Expected valid compose URL");
  return new URL(url);
}
describe("Manual Gmail preparation", () => {
  it("opens a Gmail compose URL addressed only to the saved email with stored order number", () => {
    const url = params();
    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("to")).toBe("cliente+pedido@example.com");
    expect(url.searchParams.get("su")).toBe("Confirmação do seu pedido NL-00123 - Nine Lives Lab");
  });
  it("preserves all item quantities, stored subtotals, accents and BRL total through URL encoding", () => {
    const body = params().searchParams.get("body") ?? "";
    expect(body).toContain("Olá, João & Ana! Tudo bem?\n\n");
    expect(body).toContain("Pedido: NL-00123");
    expect(body).toContain("- Decoração & Gato #1 — Quantidade: 2 — Valor: R$\u00a01.000,00");
    expect(body).toContain("- Peça + suporte — Quantidade: 3 — Valor: R$\u00a0234,56");
    expect(body).toContain("Total do pedido: R$\u00a01.234,56");
  });
  it("excludes private notes and unnecessary customer details", () => {
    const url = params().toString();
    expect(url).not.toContain(order.internal_note);
    expect(decodeURIComponent(url)).not.toContain(order.notes);
    expect(url).not.toContain(order.whatsapp);
  });
  it.each([null, "", "invalido", "nome@", "a@example.com\r\nBcc: other@example.com"])("disallows preparation with missing or invalid email %s", (email) => {
    expect(orderGmailCompose({ ...order, email })).toBeNull();
  });
  it("uses a generic greeting for a missing name", () => {
    expect(params({ ...order, customer_name: " " }).searchParams.get("body")).toMatch(/^Olá! Tudo bem\?/);
  });
});