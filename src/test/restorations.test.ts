import { describe, expect, it } from "vitest";
import { paymentStatus, remainingBalance, restorationSchema, restorationStatusSchema } from "@/lib/restorations";

const base = {
  customer_name: "Ana", whatsapp: "85999999999", email: null, figure_name: "", damage_description: "", service_description: "", notes: "",
  total_value: 150, paid_value: 0, payment_method: "pix" as const, received_at: null, expected_delivery_at: null, delivered_at: null,
  before_images: [], after_images: [], status: "recebida" as const,
};

describe("restaurações", () => {
  it("saldo restante = total - pago", () => { expect(remainingBalance(150, 50.5)).toBe(99.5); });
  it("nome e telefone são obrigatórios", () => {
    expect(restorationSchema.safeParse({ ...base, customer_name: " " }).success).toBe(false);
    expect(restorationSchema.safeParse({ ...base, whatsapp: "" }).success).toBe(false);
  });
  it("e-mail é opcional", () => { expect(restorationSchema.safeParse(base).success).toBe(true); });
  it("pago não pode exceder o total", () => { expect(restorationSchema.safeParse({ ...base, paid_value: 200 }).success).toBe(false); });
  it("valores financeiros negativos são rejeitados", () => {
    expect(restorationSchema.safeParse({ ...base, total_value: -1 }).success).toBe(false);
    expect(restorationSchema.safeParse({ ...base, paid_value: -1 }).success).toBe(false);
  });
  it("status da restauração aceita apenas as 4 etapas", () => {
    for (const s of ["recebida", "em_restauracao", "pronta", "entregue"]) expect(restorationStatusSchema.safeParse(s).success).toBe(true);
    expect(restorationStatusSchema.safeParse("cancelada").success).toBe(false);
    expect(restorationSchema.safeParse({ ...base, status: "cancelada" }).success).toBe(false);
  });
  it("status financeiro: zero = pendente, parcial = parcial, quitado = pago", () => {
    expect(paymentStatus(150, 0)).toBe("pendente");
    expect(paymentStatus(150, 50)).toBe("parcial");
    expect(paymentStatus(150, 150)).toBe("pago");
    expect(paymentStatus(150, 200)).toBe("pago");
  });
});
