import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ImagePlus, LogOut, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/SiteLayout";
import { AdminAccess } from "@/components/site/AdminAccess";
import { AdminOrdersLink } from "@/components/site/AdminOrdersLink";
import { formatPrice } from "@/lib/config";
import type { AdminCreds } from "@/lib/admin-orders";
import { PAYMENT_METHODS, remainingBalance, restorationSchema } from "@/lib/restorations";
import { adminCreateRestoration, adminUploadRestorationImage } from "@/lib/restorations.functions";

export const Route = createFileRoute("/admin/restauracoes")({
  head: () => ({ meta: [
    { title: "Restaurações | Admin Nine Lives Lab" }, { name: "description", content: "Cadastro privado de serviços de restauração da Nine Lives Lab." },
    { property: "og:title", content: "Restaurações | Admin Nine Lives Lab" }, { property: "og:description", content: "Área administrativa de restaurações." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: RestorationsPage,
});

const field = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function RestorationsPage() {
  const [creating, setCreating] = useState(false);
  return <AdminAccess>{(creds, logout) => <div className="mx-auto max-w-7xl px-4 py-6">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div><Logo /><p className="mt-2 text-sm font-bold tracking-widest text-primary">PAINEL NINE LIVES LAB</p></div>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Button asChild variant="ghost"><Link to="/admin" search={{ aba: "produtos" }}>Produtos</Link></Button>
        <Button asChild variant="ghost"><Link to="/admin" search={{ aba: "categorias" }}>Categorias</Link></Button>
        <AdminOrdersLink creds={creds} />
        <Button asChild variant="secondary"><Link to="/admin/restauracoes">Restaurações</Link></Button>
        <Button asChild variant="ghost"><Link to="/">Ver site</Link></Button>
        <Button variant="ghost" onClick={logout}><LogOut /> Sair</Button>
      </nav>
    </header>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">Restaurações</h1>
      {!creating && <Button onClick={() => setCreating(true)}><Plus /> Nova restauração</Button>}
    </div>
    {creating
      ? <RestorationForm creds={creds} onDone={() => setCreating(false)} />
      : <p className="rounded-2xl border bg-card p-8 text-muted-foreground">Clique em "Nova restauração" para cadastrar um serviço.</p>}
  </div>}</AdminAccess>;
}

type Picked = { file: File; url: string };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function RestorationForm({ creds, onDone }: { creds: AdminCreds; onDone: () => void }) {
  const upload = useServerFn(adminUploadRestorationImage);
  const create = useServerFn(adminCreateRestoration);
  const [f, setF] = useState({
    customer_name: "", whatsapp: "", email: "", figure_name: "", damage_description: "", service_description: "", notes: "",
    total_value: "", paid_value: "0", payment_method: "pix" as keyof typeof PAYMENT_METHODS,
    received_at: "", expected_delivery_at: "", delivered_at: "",
  });
  const [before, setBefore] = useState<Picked[]>([]);
  const [after, setAfter] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const num = (v: string) => Number(v.replace(",", ".")) || 0;
  const remaining = remainingBalance(num(f.total_value), num(f.paid_value));

  useEffect(() => () => { [...before, ...after].forEach((p) => URL.revokeObjectURL(p.url)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const base = {
      customer_name: f.customer_name, whatsapp: f.whatsapp, email: f.email.trim() || null,
      figure_name: f.figure_name, damage_description: f.damage_description, service_description: f.service_description, notes: f.notes,
      total_value: num(f.total_value), paid_value: num(f.paid_value), payment_method: f.payment_method,
      received_at: f.received_at || null, expected_delivery_at: f.expected_delivery_at || null, delivered_at: f.delivered_at || null,
      before_images: [] as string[], after_images: [] as string[],
    };
    const check = restorationSchema.safeParse(base);
    if (!check.success) { toast.error(check.error.issues[0]?.message ?? "Confira os dados"); return; }
    setBusy(true);
    try {
      const send = async (list: Picked[]) => Promise.all(list.map(async (p) =>
        (await upload({ data: { creds, filename: p.file.name, contentType: p.file.type, base64: await toBase64(p.file) } })).path));
      base.before_images = await send(before);
      base.after_images = await send(after);
      const row = await create({ data: { creds, restoration: base } });
      toast.success(`Restauração ${row.restoration_number} cadastrada!`);
      onDone();
    } catch {
      toast.error("Não foi possível salvar. Seus dados foram mantidos; tente novamente.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-6">
    <Section title="Dados do cliente">
      <L label="Nome completo *"><input required maxLength={150} className={field} value={f.customer_name} onChange={set("customer_name")} /></L>
      <L label="Telefone/WhatsApp *"><input required maxLength={30} inputMode="tel" className={field} value={f.whatsapp} onChange={set("whatsapp")} /></L>
      <L label="E-mail"><input type="email" maxLength={255} className={field} value={f.email} onChange={set("email")} /></L>
    </Section>
    <Section title="Dados da peça">
      <L label="Nome da figure"><input maxLength={200} className={field} value={f.figure_name} onChange={set("figure_name")} /></L>
      <L label="Danos ou problemas apresentados" wide><textarea rows={3} maxLength={5000} className={field} value={f.damage_description} onChange={set("damage_description")} /></L>
      <L label="Serviço de restauração" wide><textarea rows={3} maxLength={5000} className={field} value={f.service_description} onChange={set("service_description")} /></L>
      <L label="Observações adicionais" wide><textarea rows={2} maxLength={5000} className={field} value={f.notes} onChange={set("notes")} /></L>
    </Section>
    <Section title="Dados financeiros">
      <L label="Valor total do serviço (R$)"><input inputMode="decimal" className={field} placeholder="0,00" value={f.total_value} onChange={set("total_value")} /></L>
      <L label="Valor pago inicialmente (R$)"><input inputMode="decimal" className={field} value={f.paid_value} onChange={set("paid_value")} /></L>
      <L label="Saldo restante"><p className={`${field} font-bold ${remaining < 0 ? "text-destructive" : "text-primary"}`}>{formatPrice(remaining)}</p></L>
      <L label="Forma de pagamento"><select className={field} value={f.payment_method} onChange={set("payment_method")}>{Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></L>
    </Section>
    <Section title="Datas">
      <L label="Recebimento da peça"><input type="date" className={field} value={f.received_at} onChange={set("received_at")} /></L>
      <L label="Previsão de entrega"><input type="date" className={field} value={f.expected_delivery_at} onChange={set("expected_delivery_at")} /></L>
      <L label="Entrega efetiva"><input type="date" className={field} value={f.delivered_at} onChange={set("delivered_at")} /></L>
    </Section>
    <Section title="Fotografias">
      <Photos label="Antes da restauração" list={before} setList={setBefore} />
      <Photos label="Depois da restauração" list={after} setList={setAfter} />
    </Section>
    <div className="flex flex-wrap gap-3">
      <Button disabled={busy} className="h-11 px-6 font-bold">{busy ? "Salvando…" : "Salvar restauração"}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={onDone}>Cancelar</Button>
    </div>
  </form>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="rounded-2xl border bg-card p-5"><legend className="px-2 font-bold text-primary">{title}</legend><div className="grid gap-4 md:grid-cols-2">{children}</div></fieldset>;
}
function L({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block space-y-1.5 text-sm ${wide ? "md:col-span-2" : ""}`}><span className="font-medium">{label}</span>{children}</label>;
}
function Photos({ label, list, setList }: { label: string; list: Picked[]; setList: React.Dispatch<React.SetStateAction<Picked[]>> }) {
  return <div className="space-y-2 text-sm"><span className="font-medium">{label}</span>
    <div className="flex flex-wrap gap-2">
      {list.map((p, i) => <div key={p.url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
        <img src={p.url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
        <button type="button" aria-label="Remover imagem" onClick={() => { URL.revokeObjectURL(p.url); setList((s) => s.filter((x) => x !== p)); }} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"><X className="h-4 w-4" /></button>
      </div>)}
      {list.length < 20 && <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary">
        <ImagePlus aria-hidden />
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" aria-label={`Adicionar fotos: ${label}`} onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const ok = files.filter((file) => file.size <= 10 * 1024 * 1024);
          if (ok.length < files.length) toast.error("Imagens acima de 10 MB foram ignoradas.");
          setList((s) => [...s, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 20));
          e.target.value = "";
        }} />
      </label>}
    </div>
  </div>;
}
