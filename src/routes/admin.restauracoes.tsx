import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LogOut, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Logo } from "@/components/site/SiteLayout";
import { AdminAccess } from "@/components/site/AdminAccess";
import { AdminOrdersLink } from "@/components/site/AdminOrdersLink";
import { formatPrice } from "@/lib/config";
import type { AdminCreds } from "@/lib/admin-orders";
import { PAYMENT_METHODS, PAYMENT_STATUSES, RESTORATION_STATUSES, remainingBalance, restorationSchema, restorationStatusSchema, type PaymentStatus, type RestorationStatus } from "@/lib/restorations";
import { adminCreateRestoration, adminDeleteRestoration, adminGetRestoration, adminListRestorations, adminUpdateRestoration, adminUpdateRestorationStatus, adminUploadRestorationImage } from "@/lib/restorations.functions";

export const Route = createFileRoute("/admin/restauracoes")({
  head: () => ({ meta: [
    { title: "Restaurações | Admin Nine Lives Lab" }, { name: "description", content: "Gerenciamento privado de restaurações da Nine Lives Lab." },
    { property: "og:title", content: "Restaurações | Admin Nine Lives Lab" }, { property: "og:description", content: "Área administrativa de restaurações." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: RestorationsPage,
});

const field = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

type Detail = {
  id: string; restoration_number: string; customer_name: string; whatsapp: string; email: string | null;
  figure_name: string; damage_description: string; service_description: string; notes: string;
  total_value: number; paid_value: number; payment_method: string; status: string; payment_status: PaymentStatus;
  received_at: string | null; expected_delivery_at: string | null; delivered_at: string | null;
  before: { path: string; url: string }[]; after: { path: string; url: string }[];
};

function brDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function StatusBadge({ value }: { value: string }) {
  const color = value === "recebida" ? "bg-order-awaiting" : value === "em_restauracao" ? "bg-gold" : value === "pronta" ? "bg-primary" : "bg-whatsapp";
  return <span className="inline-flex items-center gap-2 text-sm"><span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />{RESTORATION_STATUSES[value as RestorationStatus] ?? value}</span>;
}

function PaymentBadge({ value }: { value: string }) {
  const color = value === "pendente" ? "bg-destructive" : value === "parcial" ? "bg-gold" : "bg-whatsapp";
  return <span className="inline-flex items-center gap-2 text-sm"><span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />{PAYMENT_STATUSES[value as PaymentStatus] ?? value}</span>;
}

function RestorationsPage() {
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "create" } | { kind: "edit"; initial: Detail }>({ kind: "list" });
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
    {mode.kind === "list"
      ? <RestorationList creds={creds} onCreate={() => setMode({ kind: "create" })} onEdit={(initial) => setMode({ kind: "edit", initial })} />
      : <>
        <Button variant="ghost" className="mb-4" onClick={() => setMode({ kind: "list" })}>← Voltar para a lista</Button>
        <RestorationForm creds={creds} initial={mode.kind === "edit" ? mode.initial : undefined} onDone={() => setMode({ kind: "list" })} />
      </>}
  </div>}</AdminAccess>;
}

type Filters = { search: string; status: string; payment: string; from: string; to: string };
const emptyFilters: Filters = { search: "", status: "", payment: "", from: "", to: "" };

function RestorationList({ creds, onCreate, onEdit }: { creds: AdminCreds; onCreate: () => void; onEdit: (d: Detail) => void }) {
  const list = useServerFn(adminListRestorations);
  const setStatus = useServerFn(adminUpdateRestorationStatus);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selected, setSelected] = useState<string | null>(null);
  const status = restorationStatusSchema.safeParse(filters.status);
  const payment = filters.payment === "pendente" || filters.payment === "parcial" || filters.payment === "pago" ? filters.payment : undefined;
  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ["admin-restorations", filters],
    queryFn: () => list({ data: {
      creds,
      search: filters.search || undefined,
      status: status.success ? status.data : undefined,
      payment,
      from: filters.from || null,
      to: filters.to || null,
    } }),
  });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["admin-restorations"] }); };
  const changeStatus = (id: string, value: string) => {
    const parsed = restorationStatusSchema.safeParse(value);
    if (!parsed.success) return;
    setStatus({ data: { creds, id, status: parsed.data } })
      .then(() => { toast.success("Status atualizado"); refresh(); })
      .catch(() => toast.error("Não foi possível atualizar o status."));
  };
  const stats = data?.stats;
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">Restaurações</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" title="Atualizar" aria-label="Atualizar restaurações" disabled={isFetching} onClick={() => refetch()}><RefreshCw /></Button>
        <Button onClick={onCreate}><Plus /> Nova restauração</Button>
      </div>
    </div>
    {stats && <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {([["Total", stats.total], ["Recebidas", stats.recebida], ["Em restauração", stats.em_restauracao], ["Prontas", stats.pronta], ["Entregues", stats.entregue], ["Pagamentos em aberto", stats.pagamento_aberto]] as const).map(([label, value]) =>
        <div key={label} className="rounded-xl border bg-card p-3 text-center"><p className="text-2xl font-bold text-primary">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}
    </div>}
    <div className="mb-5 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
      <input className={field} placeholder="Buscar cliente, telefone, peça ou nº" aria-label="Pesquisar restaurações" value={filters.search} onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))} />
      <select className={field} aria-label="Filtrar por status da restauração" value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}>
        <option value="">Status: todos</option>
        {Object.entries(RESTORATION_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select className={field} aria-label="Filtrar por status do pagamento" value={filters.payment} onChange={(e) => setFilters((s) => ({ ...s, payment: e.target.value }))}>
        <option value="">Pagamento: todos</option>
        {Object.entries(PAYMENT_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label className="space-y-1 text-xs text-muted-foreground">Recebidas de<input type="date" className={field} value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} /></label>
      <label className="space-y-1 text-xs text-muted-foreground">Até<input type="date" className={field} value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} /></label>
      <div className="flex items-end"><Button variant="outline" className="w-full" onClick={() => setFilters(emptyFilters)}>Limpar filtros</Button></div>
    </div>
    {isLoading ? <p role="status" className="py-8 text-muted-foreground">Carregando restaurações…</p>
      : !data || data.rows.length === 0 ? <p className="border-y py-12 text-center text-muted-foreground">Nenhuma restauração encontrada.</p>
      : <>
        <div className="hidden overflow-x-auto rounded-lg border md:block"><table className="w-full text-left text-sm">
          <thead className="bg-card text-muted-foreground"><tr>{["Serviço", "Peça", "Cliente", "Telefone", "Recebimento", "Previsão", "Total", "Pago", "Saldo", "Status", "Pagamento"].map((l) => <th key={l} className="px-3 py-3 font-medium">{l}</th>)}</tr></thead>
          <tbody className="divide-y">{data.rows.map((r) => <tr key={r.id} className="hover:bg-secondary/50">
            <td className="px-3 py-3"><Button variant="link" className="h-auto p-0 font-bold" onClick={() => setSelected(r.id)}>{r.restoration_number}</Button></td>
            <td className="max-w-40 break-words px-3 py-3">{r.figure_name || "—"}</td>
            <td className="max-w-36 break-words px-3 py-3">{r.customer_name}</td>
            <td className="px-3 py-3">{r.whatsapp}</td>
            <td className="px-3 py-3">{brDate(r.received_at)}</td>
            <td className="px-3 py-3">{brDate(r.expected_delivery_at)}</td>
            <td className="px-3 py-3">{formatPrice(r.total_value)}</td>
            <td className="px-3 py-3">{formatPrice(r.paid_value)}</td>
            <td className="px-3 py-3">{formatPrice(remainingBalance(r.total_value, r.paid_value))}</td>
            <td className="px-3 py-3"><select aria-label={`Status de ${r.restoration_number}`} className="rounded-lg border bg-background px-2 py-1.5 text-sm" value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>{Object.entries(RESTORATION_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
            <td className="px-3 py-3"><PaymentBadge value={r.payment_status} /></td>
          </tr>)}</tbody>
        </table></div>
        <div className="grid gap-3 md:hidden">{data.rows.map((r) => <article key={r.id} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="link" className="h-auto p-0 font-bold" onClick={() => setSelected(r.id)}>{r.restoration_number}</Button>
            <PaymentBadge value={r.payment_status} />
          </div>
          <p className="break-words font-medium">{r.figure_name || "Peça sem nome"} · {r.customer_name}</p>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{formatPrice(r.total_value)}</span><span className="text-muted-foreground">Saldo: {formatPrice(remainingBalance(r.total_value, r.paid_value))}</span></div>
          <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground"><span>Recebida: {brDate(r.received_at)}</span><span>Previsão: {brDate(r.expected_delivery_at)}</span></div>
          <select aria-label={`Status de ${r.restoration_number}`} className={field} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>{Object.entries(RESTORATION_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </article>)}</div>
      </>}
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>Detalhes da restauração</DialogTitle><DialogDescription>Serviço, cliente, valores e fotografias</DialogDescription></DialogHeader>
        {selected && <RestorationView key={selected} id={selected} creds={creds} onChange={refresh} onEdit={(d) => { setSelected(null); onEdit(d); }} onDelete={() => { setSelected(null); refresh(); }} />}
      </DialogContent>
    </Dialog>
  </>;
}

function RestorationView({ id, creds, onChange, onEdit, onDelete }: { id: string; creds: AdminCreds; onChange: () => Promise<void>; onEdit: (d: Detail) => void; onDelete: () => void }) {
  const get = useServerFn(adminGetRestoration);
  const setStatus = useServerFn(adminUpdateRestorationStatus);
  const remove = useServerFn(adminDeleteRestoration);
  const { data: r, isError, refetch } = useQuery({ queryKey: ["admin-restorations", "detail", id], queryFn: () => get({ data: { creds, id } }) });
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  if (isError) return <div role="alert"><p>Não foi possível carregar esta restauração.</p><Button onClick={() => refetch()}>Tentar novamente</Button></div>;
  if (!r) return <p role="status">Carregando restauração…</p>;
  const detail = r as Detail;
  const photos = (label: string, list: { path: string; url: string }[]) => <section className="border-t pt-5">
    <h3 className="mb-3 font-bold">{label}</h3>
    {list.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma fotografia.</p> : <div className="flex flex-wrap gap-2">
      {list.map((p, i) => <button key={p.path} type="button" aria-label={`Ampliar foto ${i + 1} de ${label}`} onClick={() => setZoom(p.url)} className="h-24 w-24 overflow-hidden rounded-lg border focus:border-primary"><img src={p.url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" /></button>)}
    </div>}
  </section>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold">{detail.restoration_number}</h2>
      <PaymentBadge value={detail.payment_status} />
    </div>
    <label className="block space-y-2"><span className="text-sm font-medium">Status da restauração</span>
      <select className={field} aria-label="Status da restauração" disabled={busy} value={detail.status} onChange={(e) => {
        const parsed = restorationStatusSchema.safeParse(e.target.value);
        if (!parsed.success) return;
        setBusy(true);
        setStatus({ data: { creds, id: detail.id, status: parsed.data } })
          .then(() => { toast.success("Status atualizado"); return onChange().then(() => refetch()); })
          .catch(() => toast.error("Não foi possível atualizar o status."))
          .finally(() => setBusy(false));
      }}>{Object.entries(RESTORATION_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
    <section className="border-t pt-5"><h3 className="mb-3 font-bold">Dados do cliente</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">{([["Nome", detail.customer_name], ["Telefone/WhatsApp", detail.whatsapp], ...(detail.email ? [["E-mail", detail.email]] : [])] as [string, string][]).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
    </section>
    <section className="border-t pt-5"><h3 className="mb-3 font-bold">Dados da peça</h3>
      <dl className="grid gap-3 text-sm">
        <div><dt className="text-muted-foreground">Nome da figure</dt><dd className="break-words">{detail.figure_name || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Danos ou problemas</dt><dd className="whitespace-pre-wrap break-words">{detail.damage_description || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Serviço de restauração</dt><dd className="whitespace-pre-wrap break-words">{detail.service_description || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Observações</dt><dd className="whitespace-pre-wrap break-words">{detail.notes || "—"}</dd></div>
      </dl>
    </section>
    <section className="border-t pt-5"><h3 className="mb-3 font-bold">Dados financeiros</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Valor total</dt><dd className="font-bold">{formatPrice(detail.total_value)}</dd></div>
        <div><dt className="text-muted-foreground">Valor pago</dt><dd>{formatPrice(detail.paid_value)}</dd></div>
        <div><dt className="text-muted-foreground">Saldo restante</dt><dd className="font-bold text-primary">{formatPrice(remainingBalance(detail.total_value, detail.paid_value))}</dd></div>
        <div><dt className="text-muted-foreground">Forma de pagamento</dt><dd>{PAYMENT_METHODS[detail.payment_method as keyof typeof PAYMENT_METHODS] ?? detail.payment_method}</dd></div>
      </dl>
    </section>
    <section className="border-t pt-5"><h3 className="mb-3 font-bold">Datas</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Recebimento</dt><dd>{brDate(detail.received_at)}</dd></div>
        <div><dt className="text-muted-foreground">Previsão de entrega</dt><dd>{brDate(detail.expected_delivery_at)}</dd></div>
        <div><dt className="text-muted-foreground">Entrega efetiva</dt><dd>{brDate(detail.delivered_at)}</dd></div>
      </dl>
    </section>
    {photos("Antes da restauração", detail.before)}
    {photos("Depois da restauração", detail.after)}
    <div className="flex flex-wrap gap-3 border-t pt-5">
      <Button variant="outline" disabled={busy} onClick={() => onEdit(detail)}><Pencil /> Editar restauração</Button>
      <Button variant="destructive" disabled={busy} onClick={() => setDeleting(true)}><Trash2 /> Excluir restauração</Button>
    </div>
    <Dialog open={!!zoom} onOpenChange={(open) => { if (!open) setZoom(null); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-4xl rounded-lg p-2">
        <DialogHeader className="sr-only"><DialogTitle>Foto ampliada</DialogTitle><DialogDescription>Visualização ampliada da fotografia</DialogDescription></DialogHeader>
        {zoom && <img src={zoom} alt="Fotografia ampliada" className="max-h-[80dvh] w-full rounded-lg object-contain" />}
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleting} onOpenChange={setDeleting}>
      <AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg">
        <AlertDialogHeader><AlertDialogTitle>Excluir restauração?</AlertDialogTitle><AlertDialogDescription>Essa ação removerá permanentemente o serviço {detail.restoration_number}{detail.figure_name ? ` (${detail.figure_name})` : ""} e suas fotografias.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await remove({ data: { creds, id: detail.id, confirmed: true } }); setDeleting(false); toast.success("Restauração excluída"); onDelete(); }
            catch { toast.error("Não foi possível excluir a restauração."); }
            finally { setBusy(false); }
          }}>Excluir definitivamente</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
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

const money = (v: number) => String(v).replace(".", ",");

function RestorationForm({ creds, initial, onDone }: { creds: AdminCreds; initial?: Detail | undefined; onDone: () => void }) {
  const upload = useServerFn(adminUploadRestorationImage);
  const create = useServerFn(adminCreateRestoration);
  const update = useServerFn(adminUpdateRestoration);
  const [f, setF] = useState({
    customer_name: initial?.customer_name ?? "", whatsapp: initial?.whatsapp ?? "", email: initial?.email ?? "",
    figure_name: initial?.figure_name ?? "", damage_description: initial?.damage_description ?? "",
    service_description: initial?.service_description ?? "", notes: initial?.notes ?? "",
    total_value: initial ? money(initial.total_value) : "", paid_value: initial ? money(initial.paid_value) : "0",
    payment_method: (initial?.payment_method ?? "pix") as keyof typeof PAYMENT_METHODS,
    received_at: initial?.received_at ?? "", expected_delivery_at: initial?.expected_delivery_at ?? "", delivered_at: initial?.delivered_at ?? "",
    status: (initial?.status ?? "recebida") as RestorationStatus,
  });
  const [beforeExisting, setBeforeExisting] = useState(initial?.before ?? []);
  const [afterExisting, setAfterExisting] = useState(initial?.after ?? []);
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
      before_images: [] as string[], after_images: [] as string[], status: f.status,
    };
    const check = restorationSchema.safeParse(base);
    if (!check.success) { toast.error(check.error.issues[0]?.message ?? "Confira os dados"); return; }
    setBusy(true);
    try {
      const send = async (list: Picked[]) => Promise.all(list.map(async (p) =>
        (await upload({ data: { creds, filename: p.file.name, contentType: p.file.type, base64: await toBase64(p.file) } })).path));
      base.before_images = [...beforeExisting.map((p) => p.path), ...(await send(before))];
      base.after_images = [...afterExisting.map((p) => p.path), ...(await send(after))];
      const row = initial
        ? await update({ data: { creds, id: initial.id, restoration: base } })
        : await create({ data: { creds, restoration: base } });
      toast.success(initial ? `Restauração ${row.restoration_number} atualizada!` : `Restauração ${row.restoration_number} cadastrada!`);
      onDone();
    } catch {
      toast.error("Não foi possível salvar. Seus dados foram mantidos; tente novamente.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-6">
    <h1 className="text-2xl font-bold">{initial ? `Editar ${initial.restoration_number}` : "Nova restauração"}</h1>
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
    <Section title="Datas e status">
      <L label="Recebimento da peça"><input type="date" className={field} value={f.received_at} onChange={set("received_at")} /></L>
      <L label="Previsão de entrega"><input type="date" className={field} value={f.expected_delivery_at} onChange={set("expected_delivery_at")} /></L>
      <L label="Entrega efetiva"><input type="date" className={field} value={f.delivered_at} onChange={set("delivered_at")} /></L>
      <L label="Status da restauração"><select className={field} value={f.status} onChange={set("status")}>{Object.entries(RESTORATION_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></L>
    </Section>
    <Section title="Fotografias">
      <Photos label="Antes da restauração" existing={beforeExisting} setExisting={setBeforeExisting} list={before} setList={setBefore} />
      <Photos label="Depois da restauração" existing={afterExisting} setExisting={setAfterExisting} list={after} setList={setAfter} />
    </Section>
    <div className="flex flex-wrap gap-3">
      <Button disabled={busy} className="h-11 px-6 font-bold">{busy ? "Salvando…" : initial ? "Salvar alterações" : "Salvar restauração"}</Button>
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
function Photos({ label, existing, setExisting, list, setList }: { label: string; existing: { path: string; url: string }[]; setExisting: React.Dispatch<React.SetStateAction<{ path: string; url: string }[]>>; list: Picked[]; setList: React.Dispatch<React.SetStateAction<Picked[]>> }) {
  const total = existing.length + list.length;
  return <div className="space-y-2 text-sm"><span className="font-medium">{label}</span>
    <div className="flex flex-wrap gap-2">
      {existing.map((p, i) => <div key={p.path} className="relative h-24 w-24 overflow-hidden rounded-lg border">
        <img src={p.url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
        <button type="button" aria-label="Remover imagem salva" onClick={() => setExisting((s) => s.filter((x) => x.path !== p.path))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"><X className="h-4 w-4" /></button>
      </div>)}
      {list.map((p, i) => <div key={p.url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
        <img src={p.url} alt={`${label} nova ${i + 1}`} className="h-full w-full object-cover" />
        <button type="button" aria-label="Remover imagem" onClick={() => { URL.revokeObjectURL(p.url); setList((s) => s.filter((x) => x !== p)); }} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"><X className="h-4 w-4" /></button>
      </div>)}
      {total < 20 && <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary">
        <ImagePlus aria-hidden />
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" aria-label={`Adicionar fotos: ${label}`} onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const ok = files.filter((file) => file.size <= 10 * 1024 * 1024);
          if (ok.length < files.length) toast.error("Imagens acima de 10 MB foram ignoradas.");
          setList((s) => [...s, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 20 - existing.length));
          e.target.value = "";
        }} />
      </label>}
    </div>
  </div>;
}
