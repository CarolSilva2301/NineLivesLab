import { z } from "zod";

export const customerSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome completo").max(100),
  whatsapp: z.string().trim().min(1, "Informe seu WhatsApp").max(30),
  cidade: z.string().trim().min(1, "Informe sua cidade").max(100),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(255)]),
  obs: z.string().max(1000),
});

export const orderInputSchema = z.object({
  requestId: z.string().uuid(),
  customer: customerSchema,
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(999),
    unit_price: z.number().finite().min(0),
  })).min(1).max(100),
});