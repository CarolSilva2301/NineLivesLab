import { describe, expect, it } from "vitest";
import { remainingBalance, restorationSchema } from "@/lib/restorations";

const base = {
  customer_name: "Ana", whatsapp: "85999999999", email: null, figure_name: "", damage_description: "", service_description: "", notes: "",
  total_value: 150, paid_value: 0, payment_method: "pix" as const, received_at: null, expected_delivery_at: null, delivered_at: null,
  before_images: [], after_images: [],
};

describe("restaurações", () => {
  it("saldo restante = total - pago", () => { expect(remainingBalance(150, 50.5)).toBe(99.5); });
  it("nome e telefone são obrigatórios", () => {
    expect(restorationSchema.safeParse({ ...base, customer_name: " " }).success).toBe(false);
    expect(restorationSchema.safeParse({ ...base, whatsapp: "" }).success).toBe(false);
  });
  it("e-mail é opcional", () => { expect(restorationSchema.safeParse(base).success).toBe(true); });
  it("pago não pode exceder o total", () => { expect(restorationSchema.safeParse({ ...base, paid_value: 200 }).success).toBe(false); });
});
