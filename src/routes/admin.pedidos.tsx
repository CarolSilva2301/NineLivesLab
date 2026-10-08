import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LogOut, MessageCircle, RefreshCw, Save, Trash2 } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { AdminAccess } from "@/components/site/AdminAccess";
import { AdminOrdersLink } from "@/components/site/AdminOrdersLink";
import { Logo } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/config";
import { ORDER_STATUSES, orderStatusSchema, orderDate, customerContactMessage, customerWhatsapp, type AdminCreds, type OrderDetail } from "@/lib/admin-orders";
import { adminOrderList, adminOrderDetail, adminOrderStatus, adminOrderNote, adminOrderDelete } from "@/lib/admin-orders.functions";

export const Route = createFileRoute("/admin/pedidos")({
  validateSearch: (search: Record<string, unknown>) => ({ status: typeof search["status"] === "string" ? search["status"] : "todos", page: Number.isFinite(Number(search["page"])) ? Number(search["page"]) : 0 }),
  head: () => ({ meta: [
    { title: "Pedidos | Admin Nine Lives Lab" }, { name: "description", content: "Gerenciamento privado de pedidos da Nine Lives Lab." },
    { property: "og:title", content: "Pedidos | Admin Nine Lives Lab" }, { property: "og:description", content: "Área administrativa de gerenciamento de pedidos." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: OrdersPage,
});
const field = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
const filters = { todos: "Todos", novo: "Novos", em_contato: "Em contato", aguardando_confirmacao: "Aguardando confirmação", finalizado: "Finalizados", cancelado: "Cancelados" };
function OrdersPage() {
  return <AdminAccess>{(creds, logout) => <div className="mx-auto max-w-7xl px-4 py-6">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div><Logo /><p className="mt-2 text-sm font-bold tracking-widest text-primary">PAINEL NINE LIVES LAB</p></div>
      <nav className="flex flex-wrap gap-2 text-sm"><Button asChild variant="ghost"><Link to="/admin">Produtos / Categorias</Link></Button><AdminOrdersLink creds={creds} /><Button asChild variant="ghost"><Link to="/">Ver site</Link></Button><Button variant="ghost" onClick={logout}><LogOut /> Sair</Button></nav>
    </header>
    <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => <div role="alert" className="space-y-4"><p>Não foi possível carregar os pedidos. Confira sua conexão ou entre novamente.</p><Button onClick={resetErrorBoundary}>Tentar novamente</Button><Button variant="outline" onClick={logout}>Sair</Button></div>}>
      <Suspense fallback={<p role="status" className="py-8 text-muted-foreground">Carregando pedidos…</p>}><OrdersList creds={creds} /></Suspense>
    </ErrorBoundary>
  </div>}</AdminAccess>;
}
function Status({ value }: { value: string }) {
  const color = value === "novo" ? "bg-destructive" : value === "em_contato" ? "bg-gold" : value === "aguardando_confirmacao" ? "bg-order-awaiting" : value === "finalizado" ? "bg-whatsapp" : "bg-muted-foreground";
  return <span className="inline-flex items-center gap-2 text-sm"><span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />{ORDER_STATUSES[value as keyof typeof ORDER_STATUSES] ?? value}</span>;
}
function OrdersList({ creds }: { creds: AdminCreds }) {
  const { status, page: rawPage } = Route.useSearch();
  const page = Math.max(0, Math.floor(rawPage));
  const parsed = orderStatusSchema.safeParse(status);
  const list = useServerFn(adminOrderList);
  const queryClient = useQueryClient();
  const { data, refetch, isFetching } = useSuspenseQuery({ queryKey: ["admin-orders", "list", status, page], queryFn: () => list({ data: { creds, status: parsed.success ? parsed.data : undefined, page } }), refetchInterval: 30000 });
  const [selected, setSelected] = useState<string | null>(null);
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); };
  return <>
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Pedidos</h1><Button variant="outline" size="icon" title="Atualizar pedidos" aria-label="Atualizar pedidos" disabled={isFetching} onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ["admin-orders", "count"] }); }}><RefreshCw /></Button></div>
    <nav aria-label="Filtrar pedidos" className="my-5 flex flex-wrap gap-2">{Object.entries(filters).map(([value, label]) => <Button key={value} asChild variant={status === value ? "secondary" : "ghost"}><Link to="/admin/pedidos" search={{ status: value, page: 0 }}>{label}</Link></Button>)}</nav>
    {data.rows.length === 0 ? <p className="border-y py-12 text-center text-muted-foreground">Nenhum pedido encontrado.</p> : <>
      <div className="hidden overflow-x-auto rounded-lg border md:block"><table className="w-full text-left text-sm"><thead className="bg-card text-muted-foreground"><tr>{["Pedido", "Cliente", "Total", "Data e hora", "Status"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y">{data.rows.map((order) => <tr key={order.id} className="hover:bg-secondary/50"><td className="px-4 py-3"><Button variant="link" className="h-auto p-0 font-bold" onClick={() => setSelected(order.id)}>#{order.order_number}</Button></td><td className="px-4 py-3">{order.customer_name}</td><td className="px-4 py-3">{formatPrice(order.total)}</td><td className="px-4 py-3">{orderDate(order.created_at)}</td><td className="px-4 py-3"><Status value={order.status} /></td></tr>)}</tbody></table></div>
      <div className="grid gap-3 md:hidden">{data.rows.map((order) => <article key={order.id} className="space-y-3 rounded-lg border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="link" className="h-auto p-0 font-bold" onClick={() => setSelected(order.id)}>#{order.order_number}</Button><Status value={order.status} /></div><p className="break-words font-medium">{order.customer_name}</p><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{formatPrice(order.total)}</span><time className="text-muted-foreground">{orderDate(order.created_at)}</time></div></article>)}</div>
    </>}
    <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground"><span>{data.count} pedido(s)</span><div className="flex items-center gap-2">{page > 0 && <Button asChild variant="outline" size="icon" aria-label="Página anterior"><Link to="/admin/pedidos" search={{ status, page: page - 1 }}><ChevronLeft /></Link></Button>}<span>Página {page + 1}</span>{(page + 1) * 50 < data.count && <Button asChild variant="outline" size="icon" aria-label="Próxima página"><Link to="/admin/pedidos" search={{ status, page: page + 1 }}><ChevronRight /></Link></Button>}</div></div>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg">
      <DialogHeader><DialogTitle>Detalhes do pedido</DialogTitle><DialogDescription>Pedido e dados do cliente</DialogDescription></DialogHeader>
      {selected && <ErrorBoundary key={selected} fallbackRender={({ resetErrorBoundary }) => <div role="alert"><p>Não foi possível carregar este pedido.</p><Button onClick={resetErrorBoundary}>Tentar novamente</Button></div>}><Suspense fallback={<p>Carregando pedido…</p>}><OrderView id={selected} creds={creds} onChange={refresh} onDelete={() => { setSelected(null); refresh(); }} /></Suspense></ErrorBoundary>}
    </DialogContent></Dialog>
  </>;
}
function OrderView({ id, creds, onChange, onDelete }: { id: string; creds: AdminCreds; onChange: () => Promise<void>; onDelete: () => void }) {
  const detail = useServerFn(adminOrderDetail);
  const { data: order, isError, refetch } = useQuery({ queryKey: ["admin-orders", "detail", id], queryFn: () => detail({ data: { creds, id } }) });
  if (isError) return <div role="alert"><p>Não foi possível carregar este pedido.</p><Button onClick={() => refetch()}>Tentar novamente</Button></div>;
  if (!order) return <p role="status">Carregando pedido…</p>;
  return <OrderEditor key={order.id} order={order} creds={creds} onChange={onChange} onDelete={onDelete} />;
}
function OrderEditor({ order, creds, onChange, onDelete }: { order: OrderDetail; creds: AdminCreds; onChange: () => Promise<void>; onDelete: () => void }) {
  const statusSave = useServerFn(adminOrderStatus);
  const noteSave = useServerFn(adminOrderNote);
  const remove = useServerFn(adminOrderDelete);
  const [note, setNote] = useState(order.internal_note);
  const [savedNote, setSavedNote] = useState(order.internal_note);
  const [message, setMessage] = useState(customerContactMessage(order));
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const contact = customerWhatsapp(order.whatsapp, message);
  const perform = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await action(); toast.success(success); await onChange(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Pedido #{order.order_number}</h2><span className="text-sm text-muted-foreground">{orderDate(order.created_at)}</span></div>
    <label className="block space-y-2"><span className="text-sm font-medium">Status do pedido</span><select className={field} aria-label="Status do pedido" disabled={busy} value={order.status} onChange={(event) => { const result = orderStatusSchema.safeParse(event.target.value); if (result.success) perform(() => statusSave({ data: { creds, id: order.id, status: result.data } }), "Status atualizado"); }}>{Object.entries(ORDER_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <section className="border-t pt-5"><h3 className="mb-3 font-bold">Dados do cliente</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{[["Nome", order.customer_name], ["WhatsApp", order.whatsapp], ["Cidade", order.city], ...(order.email ? [["E-mail", order.email]] : [])].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl></section>
    <section className="border-t pt-5"><h3 className="font-bold">Produtos</h3><ul className="divide-y">{order.items.map((item) => <li key={item.id} className="flex gap-3 py-4">{item.image_url && <img src={item.image_url} alt={item.product_name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />}<div className="min-w-0 space-y-1 text-sm"><p className="break-words font-bold">{item.product_name}</p><p>Quantidade: {item.quantity}</p><p className="text-muted-foreground">Preço unitário: {formatPrice(item.unit_price)}</p><p>Subtotal: {formatPrice(item.subtotal)}</p></div></li>)}</ul><div className="flex flex-wrap justify-between gap-2 border-t pt-4 font-bold"><span>TOTAL DO PEDIDO</span><span className="text-primary">{formatPrice(order.total)}</span></div></section>
    <section className="border-t pt-5"><h3 className="mb-2 font-bold">Observação do cliente</h3><p className="whitespace-pre-wrap break-words text-sm">{order.notes || "Nenhuma observação informada."}</p></section>
    <section className="space-y-3 border-t pt-5"><label className="block space-y-2"><span className="font-bold">Nota interna</span><textarea className={field} rows={3} maxLength={10000} value={note} onChange={(event) => setNote(event.target.value)} /></label><Button disabled={busy || note === savedNote} onClick={() => perform(async () => { await noteSave({ data: { creds, id: order.id, note } }); setSavedNote(note); }, "Nota interna salva")}><Save /> Salvar nota</Button></section>
    <section className="space-y-3 border-t pt-5"><label className="block space-y-2"><span className="font-bold">Mensagem para o cliente</span><textarea className={field} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></label>{contact ? <Button asChild variant="outline"><a href={contact} target="_blank" rel="noopener noreferrer"><MessageCircle /> Chamar no WhatsApp</a></Button> : <p className="text-sm text-destructive">O WhatsApp informado pelo cliente não é um número válido.</p>}</section>
    <div className="border-t pt-5"><Button variant="destructive" disabled={busy} onClick={() => setDeleting(true)}><Trash2 /> Excluir pedido</Button></div>
    <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg"><AlertDialogHeader><AlertDialogTitle>Excluir pedido?</AlertDialogTitle><AlertDialogDescription>Essa ação removerá permanentemente o pedido e seus itens.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); try { await remove({ data: { creds, id: order.id, confirmed: true } }); setDeleting(false); toast.success("Pedido excluído"); onDelete(); } catch { toast.error("Não foi possível excluir o pedido."); } finally { setBusy(false); } }}>Excluir definitivamente</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}