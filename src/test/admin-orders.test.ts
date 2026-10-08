import { afterEach, describe, expect, it, vi } from "vitest";
import { customerContactMessage, customerWhatsapp, orderStatusSchema } from "@/lib/admin-orders";
import { assertAdmin } from "@/lib/admin-auth.server";

describe("Admin order rules", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("accepts exactly the five requested statuses", () => {
    for (const status of ["novo", "em_contato", "aguardando_confirmacao", "finalizado", "cancelado"]) expect(orderStatusSchema.parse(status)).toBe(status);
    expect(orderStatusSchema.safeParse("pago").success).toBe(false);
  });
  it("contacts the saved customer number rather than the store", () => {
    expect(new URL(customerWhatsapp("(85) 99999-1234", "Olá") ?? "").pathname).toBe("/5585999991234");
    expect(new URL(customerWhatsapp("+55 85 99999-1234", "Olá") ?? "").pathname).toBe("/5585999991234");
    expect(customerWhatsapp("abc", "Olá")).toBeNull();
  });
  it("includes customer and stored number without internal notes", () => {
    const order = { customer_name: "Maria", order_number: "NL-0011", internal_note: "Segredo do administrador" };
    const message = customerContactMessage(order);
    expect(message).toBe("Olá, Maria! 😊\n\nAqui é da Nine Lives Lab.\n\nRecebemos seu pedido #NL-0011 pelo nosso site e estou entrando em contato para confirmar os detalhes do seu pedido.");
    expect(message).not.toContain(order.internal_note);
  });
  it("validates admin credentials on the server", () => {
    vi.stubEnv("ADMIN_USER", "admin"); vi.stubEnv("ADMIN_PASSWORD", "test-only-password");
    expect(() => assertAdmin({ user: "admin", pass: "test-only-password" })).not.toThrow();
    expect(() => assertAdmin({ user: "admin", pass: "wrong-password" })).toThrow();
    expect(() => assertAdmin({ user: "customer", pass: "test-only-password" })).toThrow();
  });
});