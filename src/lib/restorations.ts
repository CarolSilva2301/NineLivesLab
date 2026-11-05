import { z } from "zod";

export const PAYMENT_METHODS = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão", outro: "Outro" } as const;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const money = z.number().finite().min(0).max(10_000_000);

export const restorationSchema = z.object({
  customer_name: z.string().trim().min(1, "Informe o nome").max(150),
  whatsapp: z.string().trim().min(8, "Informe o telefone").max(30),
  email: z.string().trim().email("E-mail inválido").max(255).nullable(),
  figure_name: z.string().trim().max(200),
  damage_description: z.string().trim().max(5000),
  service_description: z.string().trim().max(5000),
  notes: z.string().trim().max(5000),
  total_value: money,
  paid_value: money,
  payment_method: z.enum(["pix", "dinheiro", "cartao", "outro"]),
  received_at: date,
  expected_delivery_at: date,
  delivered_at: date,
  before_images: z.array(z.string().regex(/^[a-f0-9-]{36}\.[a-z0-9]{1,5}$/i)).max(20),
  after_images: z.array(z.string().regex(/^[a-f0-9-]{36}\.[a-z0-9]{1,5}$/i)).max(20),
}).refine((v) => v.paid_value <= v.total_value, { message: "O valor pago não pode ser maior que o total", path: ["paid_value"] });

export type RestorationInput = z.infer<typeof restorationSchema>;

export function remainingBalance(total: number, paid: number) {
  return Math.round((total - paid) * 100) / 100;
}
