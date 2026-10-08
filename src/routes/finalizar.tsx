import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MessageCircle, ShoppingCart } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/config";

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
  const items = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const [form, setForm] = useState<Form>({ nome: "", whatsapp: "", cidade: "", email: "", obs: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [ready, setReady] = useState(false);
  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof Form] ??= i.message;
      setErrors(errs);
      setReady(false);
      return;
    }
    setErrors({});
    setReady(true);
  };

  const openCart = () => window.dispatchEvent(new Event("nll-open-cart"));

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-4 text-sm">
          <button onClick={openCart} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Voltar ao carrinho</button>
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
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
            <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-card/50 p-5 md:p-6">
              <h2 className="font-display text-xl font-bold">Seus dados</h2>
              <Field label="Nome completo *" error={errors.nome}><input className={input} value={form.nome} onChange={upd("nome")} maxLength={100} autoComplete="name" /></Field>
              <Field label="WhatsApp *" error={errors.whatsapp}><input className={input} value={form.whatsapp} onChange={upd("whatsapp")} maxLength={30} inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" /></Field>
              <Field label="Cidade *" error={errors.cidade}><input className={input} value={form.cidade} onChange={upd("cidade")} maxLength={100} /></Field>
              <Field label="E-mail (opcional)" error={errors.email}><input className={input} type="email" value={form.email} onChange={upd("email")} maxLength={255} autoComplete="email" /></Field>
              <Field label="Observação / detalhes do pedido (opcional)"><textarea className={input} rows={4} value={form.obs} onChange={upd("obs")} maxLength={1000} /></Field>
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Você não será cobrado agora. Após enviar o pedido, entraremos em contato pelo WhatsApp para confirmar disponibilidade, prazo, entrega e forma de pagamento.</p>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-glow">
                <MessageCircle className="h-5 w-5" /> Enviar pedido pelo WhatsApp
              </button>
              {ready && <p className="text-center text-sm text-primary">Dados conferidos! O envio pelo WhatsApp será ativado na próxima etapa.</p>}
            </form>

            <aside className="h-fit rounded-2xl border bg-card/50 p-5 md:p-6">
              <h2 className="font-display text-xl font-bold">Resumo do pedido</h2>
              <ul className="mt-4 divide-y">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.qty} × {formatPrice(i.price)}</p>
                    </div>
                    <span className="shrink-0 font-display font-bold">{formatPrice(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-display text-xl font-bold text-primary">{formatPrice(subtotal)}</span>
              </div>
            </aside>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
