import { formatPrice } from "@/lib/config";
import { PAYMENT_METHODS, PAYMENT_STATUSES, paymentStatus, remainingBalance } from "@/lib/restorations";

export const RECEIPT_PRINT = { paperWidthMm: 110, usefulWidthMm: 100, minUsefulWidthMm: 80, maxUsefulWidthMm: 106, verticalMarginMm: 3 } as const;

export type ReceiptRecord = {
  restoration_number: string; customer_name: string; whatsapp: string; figure_name: string;
  service_description: string; notes: string; total_value: number; paid_value: number; payment_method: string;
  received_at: string | null; expected_delivery_at: string | null; delivered_at: string | null;
};

function date(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function receiptData(record: ReceiptRecord, issuedAt = new Date()) {
  return {
    number: record.restoration_number,
    issuedAt: issuedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    customer: record.customer_name, phone: record.whatsapp, figure: record.figure_name || "—",
    service: record.service_description || "—", notes: record.notes.trim(),
    total: formatPrice(record.total_value), paid: formatPrice(record.paid_value),
    balance: formatPrice(remainingBalance(record.total_value, record.paid_value)),
    method: PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS] ?? record.payment_method,
    payment: PAYMENT_STATUSES[paymentStatus(record.total_value, record.paid_value)],
    received: date(record.received_at), expected: date(record.expected_delivery_at),
    delivered: record.delivered_at ? date(record.delivered_at) : null,
  };
}

export function receiptGeometry(usefulWidthMm = Number(RECEIPT_PRINT.usefulWidthMm)) {
  const width = Number.isFinite(usefulWidthMm)
    ? Math.min(RECEIPT_PRINT.maxUsefulWidthMm, Math.max(RECEIPT_PRINT.minUsefulWidthMm, usefulWidthMm))
    : RECEIPT_PRINT.usefulWidthMm;
  return { paperWidthMm: RECEIPT_PRINT.paperWidthMm, usefulWidthMm: width, sideMarginMm: (RECEIPT_PRINT.paperWidthMm - width) / 2 };
}

// Only the receipt allowlist is rendered; saved photographs and credentials never enter the print document.
export function receiptHtml(record: ReceiptRecord, issuedAt: Date) {
  const r = receiptData(record, issuedAt);
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
  const row = (label: string, value: string) => `<div class="receipt-row"><dt>${label}</dt><dd>${escape(value)}</dd></div>`;
  const section = (title: string, rows: string) => `<section><h2>${title}</h2><dl>${rows}</dl></section>`;
  return `<article class="restoration-receipt"><header><h1>NINE LIVES LAB</h1><p class="receipt-title">RECIBO DE RESTAURAÇÃO DE FIGURE</p><p><strong>${escape(r.number)}</strong></p><p>Emissão: ${escape(r.issuedAt)}</p></header>
    ${section("DADOS DO CLIENTE", row("Nome completo", r.customer) + row("Telefone/WhatsApp", r.phone))}
    ${section("DADOS DA PEÇA", row("Nome da figure", r.figure) + row("Serviço de restauração", r.service) + (r.notes ? row("Observações", r.notes) : ""))}
    ${section("DADOS FINANCEIROS", row("Valor total do serviço", r.total) + row("Valor pago", r.paid) + row("Saldo restante", r.balance) + row("Forma de pagamento", r.method) + row("Status financeiro", r.payment))}
    ${section("DATAS", row("Recebimento da peça", r.received) + row("Previsão de entrega", r.expected) + (r.delivered ? row("Entrega efetiva", r.delivered) : ""))}
    <footer><p>Peça recebida para realização do serviço de restauração descrito neste recibo. Agradecemos pela confiança na Nine Lives Lab!</p><div class="receipt-signature">Assinatura do cliente</div><div class="receipt-signature">Assinatura do responsável pelo serviço</div></footer></article>`;
}