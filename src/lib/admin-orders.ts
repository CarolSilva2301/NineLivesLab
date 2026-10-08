import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export const ORDER_STATUSES = {
  novo: "Novo",
  em_contato: "Em contato",
  aguardando_confirmacao: "Aguardando confirmação",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
} as const;
export const orderStatusSchema = z.enum(["novo", "em_contato", "aguardando_confirmacao", "finalizado", "cancelado"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type AdminCreds = { user: string; pass: string };
export type OrderSummary = Pick<Tables<"orders">, "id" | "order_number" | "customer_name" | "total" | "created_at" | "status">;
export type OrderDetail = Omit<Tables<"orders">, "request_id" | "request_fingerprint"> & {
  items: (Tables<"order_items"> & { image_url: string | null })[];
};
export function customerContactMessage(order: Pick<OrderSummary, "customer_name" | "order_number">) {
  return `Olá, ${order.customer_name}! 😊\n\nAqui é da Nine Lives Lab.\n\nRecebemos seu pedido #${order.order_number} pelo nosso site e estou entrando em contato para confirmar os detalhes do seu pedido.`;
}
export function customerWhatsapp(phone: string, message: string) {
  let number = phone.replace(/\D/g, "");
  if (number.length === 10 || number.length === 11) number = `55${number}`;
  if (!/^\d{10,15}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export function orderDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}