import { describe, expect, it } from "vitest";
import { receiptData, receiptGeometry, type ReceiptRecord } from "@/lib/restoration-receipt";

const record: ReceiptRecord = {
  restoration_number: "REST-0001", customer_name: "Ana Conceição", whatsapp: "85999999999", figure_name: "Figure Águia",
  service_description: "Restauração da pintura", notes: "Cuidado com a peça", total_value: 150, paid_value: 50.5,
  payment_method: "pix", received_at: "2026-11-11", expected_delivery_at: "2026-11-20", delivered_at: null,
};

describe("restoration receipt data", () => {
  it("uses the selected service and customer without modifying the record", () => {
    const original = structuredClone(record);
    const receipt = receiptData(record);
    expect(receipt.number).toBe("REST-0001");
    expect(receipt.customer).toBe("Ana Conceição");
    expect(receipt.phone).toBe("85999999999");
    expect(record).toEqual(original);
  });
  it("calculates saved financial amounts in BRL", () => {
    const r = receiptData(record);
    expect(r.total).toBe("R$\u00a0150,00");
    expect(r.paid).toBe("R$\u00a050,50");
    expect(r.balance).toBe("R$\u00a099,50");
    expect(r.method).toBe("Pix");
  });
  it.each([[0, "Pendente"], [50, "Parcialmente pago"], [150, "Pago"]])("calculates payment status for %s paid", (paid, status) => {
    expect(receiptData({ ...record, paid_value: Number(paid) }).payment).toBe(status);
  });
  it("uses a 110 mm roll and an initial 100 mm useful area", () => {
    expect(receiptGeometry()).toEqual({ paperWidthMm: 110, usefulWidthMm: 100, sideMarginMm: 5 });
  });
  it("adjusts internal margins while preserving the physical paper width", () => {
    expect(receiptGeometry(96)).toEqual({ paperWidthMm: 110, usefulWidthMm: 96, sideMarginMm: 7 });
  });
  it("keeps received and delivery dates without timezone shifts", () => {
    const r = receiptData({ ...record, delivered_at: "2026-11-19" });
    expect(r.received).toBe("11/11/2026");
    expect(r.expected).toBe("20/11/2026");
    expect(r.delivered).toBe("19/11/2026");
    expect(receiptData(record).delivered).toBeNull();
  });
  it("dates a reissued receipt in São Paulo without changing the service number", () => {
    const first = receiptData(record, new Date("2026-11-12T01:00:00Z"));
    const next = receiptData(record, new Date("2026-11-13T01:00:00Z"));
    expect(first.issuedAt).toBe("11/11/2026, 22:00:00");
    expect(next.issuedAt).toBe("12/11/2026, 22:00:00");
    expect(first.number).toBe(next.number);
  });
});