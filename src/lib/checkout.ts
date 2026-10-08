import type { CartItem } from "@/lib/cart";
import { formatPrice, whatsappLink } from "@/lib/config";

export type CustomerDetails = { nome: string; whatsapp: string; cidade: string; email: string; obs: string };

export function orderTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function orderWhatsapp(items: CartItem[], customer: CustomerDetails) {
  return whatsappLink([
    "Olá! Quero fazer um pedido na Nine Lives Lab.",
    "",
    ...items.map((item) => `${item.name}\nQuantidade: ${item.qty}\nPreço unitário: ${formatPrice(item.price)}\nSubtotal: ${formatPrice(item.price * item.qty)}\n`),
    `Total do pedido: ${formatPrice(orderTotal(items))}`,
    "",
    `Nome: ${customer.nome}`,
    `WhatsApp: ${customer.whatsapp}`,
    `Cidade: ${customer.cidade}`,
    ...(customer.email ? [`E-mail: ${customer.email}`] : []),
    ...(customer.obs ? [`Observação: ${customer.obs}`] : []),
  ].join("\n"));
}