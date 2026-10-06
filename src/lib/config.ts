// Configurações fáceis de alterar
export const SITE_CONFIG = {
  brand: "Nine Lives Lab",
  whatsappNumber: "5511999999999", // DDI + DDD + número, só dígitos
  instagramUrl: "https://instagram.com/nineliveslab",
  instagramHandle: "@nineliveslab",
};

export type ProductType = "figure" | "filamento";

export const CATEGORIES: Record<ProductType, string[]> = {
  figure: ["Games", "Anime", "Filmes e Séries", "Terror", "Geek", "Outros"],
  filamento: [
    "Utilidades", "Decoração", "Organização", "Casa", "Escritório",
    "Setup Gamer", "Geek", "Kits", "Natal", "Outros",
  ],
};

export const TYPE_LABEL: Record<ProductType, string> = {
  figure: "Figure",
  filamento: "Filamento 3D",
};

export const BADGES: Record<string, string> = {
  nenhum: "Nenhum",
  novo: "✨ Novo",
  promocao: "🔥 Promoção",
  natal: "🎄 Natal",
  destaque: "⭐ Destaque",
  sob_encomenda: "🛠 Sob encomenda",
};

export const STATUS: Record<string, string> = {
  disponivel: "Disponível",
  sob_encomenda: "Sob encomenda",
};

export function formatPrice(v: number | null | undefined) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function productWhatsapp(p: { name: string; price: number; promo_price: number | null }) {
  const price = formatPrice(p.promo_price ?? p.price);
  return whatsappLink(
    `Olá! Tenho interesse no produto:\n\n${p.name}\n\n${price}\n\nVi o produto no site da Nine Lives Lab.`,
  );
}
