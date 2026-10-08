import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, ShoppingCart } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buyNow, useCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/config";
import { orderTotal, orderWhatsapp } from "@/lib/checkout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/finalizar")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido | Nine Lives Lab" },
      { name: "description", content: "Confira seus produtos e informe seus dados para enviar o pedido à Nine Lives Lab." },
      { property: "og:title", content: "Finalizar pedido | Nine Lives Lab" },
      { property: "og:description", content: "Revise seu carrinho e envie seu pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { modo?: "comprar" } => (s["modo"] === "comprar" ? { modo: "comprar" } : {}),
  component: Checkout,
});

const schema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome completo").max(100),
  whatsapp: z.string().trim().min(1, "Informe seu WhatsApp").max(30),
  cidade: z.string().trim().min(1, "Informe sua cidade").max(100),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(255)]),
  obs: z.string().max(1000),
});
type Form = z.infer<typeof schema>;

const input = "w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function Checkout() {
  const { modo } = Route.useSearch();
  const cartItems = useCart();
  const [buyItems, setBuyItems] = useState<CartItem[]>([]);
  useEffect(() => { if (modo === "comprar") setBuyItems(buyNow.get()); }, [modo]);
  const items = modo === "comprar" ? buyItems : cartItems;
  const subtotal = orderTotal(items);
  const [form, setForm] = useState<Form>({ nome: "", whatsapp: "", cidade: "", email: "", obs: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [ready, setReady] = useState(false);
  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof Form] ??= i.message;
      setErrors(errs);
      setReady(false);
      return;
    }
    setErrors({});
    window.open(orderWhatsapp(items, r.data), "_blank", "noopener,noreferrer");
    setReady(true);
  };

  const openCart = () => window.dispatchEvent(new Event("nll-open-cart"));

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-4 text-sm">
          <Button variant="link" onClick={openCart} className="h-auto gap-1 p-0 text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Voltar ao carrinho</Button>
          <Link to="/figures" className="text-muted-foreground hover:text-primary">Continuar comprando</Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold md:text-4xl">Finalizar <span className="text-primary">pedido</span></h1>
        <p className="mt-2 text-muted-foreground">Confira seus produtos e informe seus dados para continuar.</p>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border bg-card p-10 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <p className="font-display text-lg font-bold">Seu carrinho está vazio</p>
            <Link to="/figures" className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-glow">Ver produtos</Link>
          </div>
        ) : (
          <div className="mx-auto mt-8 grid max-w-3xl gap-6">
            <aside className="min-w-0 rounded-2xl border bg-card/50 p-5 md:p-6">
              <h2 className="font-display text-xl font-bold">Resumo do pedido</h2>
              <ul className="mt-4 divide-y">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">Quantidade: {i.qty}</p>
                      <p className="text-xs text-muted-foreground">Preço unitário: {formatPrice(i.price)}</p>
                      <p className="text-sm font-bold">Subtotal: {formatPrice(i.price * i.qty)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Total do pedido:</span>
                <span className="font-display text-xl font-bold text-primary">{formatPrice(subtotal)}</span>
              </div>
            </aside>
            <form onSubmit={submit} noValidate className="min-w-0 space-y-4 rounded-2xl border bg-card/50 p-5 md:p-6">
              <h2 className="font-display text-xl font-bold">Seus dados</h2>
              <Field label="Nome completo *" error={errors.nome}><input className={input} value={form.nome} onChange={upd("nome")} maxLength={100} autoComplete="name" /></Field>
              <Field label="WhatsApp *" error={errors.whatsapp}><input className={input} value={form.whatsapp} onChange={upd("whatsapp")} maxLength={30} inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" /></Field>
              <Field label="Cidade *" error={errors.cidade}><input className={input} value={form.cidade} onChange={upd("cidade")} maxLength={100} /></Field>
              <Field label="E-mail (opcional)" error={errors.email}><input className={input} type="email" value={form.email} onChange={upd("email")} maxLength={255} autoComplete="email" /></Field>
              <Field label="Observação / detalhes do pedido (opcional)"><textarea className={input} rows={4} value={form.obs} onChange={upd("obs")} maxLength={1000} /></Field>
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Você não será cobrado agora. Após enviar o pedido, entraremos em contato pelo WhatsApp para confirmar disponibilidade, prazo, entrega e forma de pagamento.</p>
              <Button type="submit" className="h-auto w-full whitespace-normal rounded-xl px-4 py-4 font-bold shadow-glow">
                <MessageCircle className="h-5 w-5" /> Enviar pedido pelo WhatsApp
              </Button>
              {ready && <p className="text-center text-sm text-primary">Pedido preparado! Confirme o envio no WhatsApp.</p>}
            </form>

          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
