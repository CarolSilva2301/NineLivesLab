import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Trash2, Eye, EyeOff, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/SiteLayout";
import {
  adminDeleteProduct, adminListProducts, adminLogin, adminSaveProduct, adminToggleProduct, adminUploadImage,
} from "@/lib/admin.functions";
import { BADGES, CATEGORIES, STATUS, TYPE_LABEL, formatPrice, type ProductType } from "@/lib/config";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel | Nine Lives Lab" },
      { name: "description", content: "Painel administrativo Nine Lives Lab." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel Nine Lives Lab" },
      { property: "og:description", content: "Área administrativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Creds = { user: string; pass: string };
const KEY = "nll-admin";
const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary";

function AdminPage() {
  const [creds, setCreds] = useState<Creds | null>(null);
  useEffect(() => {
    const s = sessionStorage.getItem(KEY);
    if (s) setCreds(JSON.parse(s));
  }, []);
  const logout = () => { sessionStorage.removeItem(KEY); setCreds(null); };
  return (
    <div className="min-h-screen">
      <Toaster />
      {creds ? <Panel creds={creds} onLogout={logout} /> : <Login onLogin={(c) => { sessionStorage.setItem(KEY, JSON.stringify(c)); setCreds(c); }} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (c: Creds) => void }) {
  const login = useServerFn(adminLogin);
  const [user, setUser] = useState(""); const [pass, setPass] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8"
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true);
          try { await login({ data: { user, pass } }); onLogin({ user, pass }); }
          catch { toast.error("Usuário ou senha inválidos"); }
          finally { setBusy(false); }
        }}>
        <Logo />
        <h1 className="text-xl font-bold">Acesso administrativo</h1>
        <input className={input} placeholder="Usuário" value={user} onChange={(e) => setUser(e.target.value)} />
        <input className={input} type="password" placeholder="Senha" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button disabled={busy} className="h-11 w-full rounded-lg bg-primary font-bold text-primary-foreground">{busy ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  );
}

function Panel({ creds, onLogout }: { creds: Creds; onLogout: () => void }) {
  const list = useServerFn(adminListProducts);
  const del = useServerFn(adminDeleteProduct);
  const toggle = useServerFn(adminToggleProduct);
  const [tab, setTab] = useState<"produtos" | "categorias">("produtos");
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = async () => {
    try { setItems(await list({ data: creds })); } catch { toast.error("Sessão inválida"); onLogout(); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div><Logo /><h1 className="mt-2 text-sm font-bold tracking-widest text-primary">PAINEL NINE LIVES LAB</h1></div>
        <nav className="flex gap-2 text-sm">
          {(["produtos", "categorias"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 capitalize ${tab === t ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>{t}</button>
          ))}
          <Link to="/" className="rounded-lg px-4 py-2 text-muted-foreground">Ver site</Link>
          <button onClick={onLogout} className="flex items-center gap-1 rounded-lg px-4 py-2 text-muted-foreground"><LogOut className="h-4 w-4" /> Sair</button>
        </nav>
      </header>

      {tab === "categorias" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {(Object.keys(CATEGORIES) as ProductType[]).map((t) => (
            <div key={t} className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-bold">{TYPE_LABEL[t]}</h2>
              <div className="flex flex-wrap gap-2">{CATEGORIES[t].map((c) => <span key={c} className="rounded-full bg-secondary px-3 py-1 text-sm">{c}</span>)}</div>
            </div>
          ))}
        </div>
      ) : editing ? (
        <ProductForm creds={creds} product={editing === "new" ? null : editing} onDone={() => { setEditing(null); load(); }} />
      ) : (
        <>
          <button onClick={() => setEditing("new")} className="mb-5 flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> NOVO PRODUTO</button>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-card text-left text-muted-foreground">
                <tr>{["Produto", "Tipo", "Categoria", "Preço", "Status", "Ações"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {items.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3">{p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}<span className="font-medium">{p.name}</span></div></td>
                    <td className="px-4 py-3">{TYPE_LABEL[p.product_type as ProductType]}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{formatPrice(p.promo_price ?? p.price)}</td>
                    <td className="px-4 py-3">{STATUS[p.status]}{!p.active && " · Inativo"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button title="Editar" onClick={() => setEditing(p)} className="rounded p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                        <button title={p.active ? "Desativar" : "Ativar"} onClick={async () => { await toggle({ data: { creds, id: p.id, active: !p.active } }); load(); }} className="rounded p-2 hover:bg-secondary">{p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                        <button title="Excluir" onClick={async () => { if (confirm(`Excluir "${p.name}"?`)) { await del({ data: { creds, id: p.id } }); toast.success("Excluído"); load(); } }} className="rounded p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm text-muted-foreground">{label}</span>{children}</label>;
}

function fileToBase64(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function ProductForm({ creds, product, onDone }: { creds: Creds; product: Product | null; onDone: () => void }) {
  const save = useServerFn(adminSaveProduct);
  const upload = useServerFn(adminUploadImage);
  const [f, setF] = useState({
    name: product?.name ?? "", description: product?.description ?? "",
    price: String(product?.price ?? ""), promo_price: product?.promo_price != null ? String(product.promo_price) : "",
    image_url: product?.image_url ?? null as string | null, extra_images: product?.extra_images ?? [] as string[],
    material: product?.material ?? "", dimensions: product?.dimensions ?? "", colors: product?.colors ?? "",
    status: (product?.status ?? "disponivel") as "disponivel" | "sob_encomenda",
    badge: (product?.badge ?? "nenhum") as keyof typeof BADGES,
    product_type: (product?.product_type ?? "") as ProductType | "",
    category: product?.category ?? "", active: product?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const up = async (file: File) => {
    const { url } = await upload({ data: { creds, filename: file.name, contentType: file.type, base64: await fileToBase64(file) } });
    return url;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.product_type) { toast.error("Escolha o tipo do produto"); return; }
    if (!f.category) { toast.error("Escolha a categoria"); return; }
    setBusy(true);
    try {
      await save({ data: { creds, id: product?.id ?? null, product: {
        ...f, product_type: f.product_type, badge: f.badge as never,
        price: Number(f.price.replace(",", ".")) || 0,
        promo_price: f.promo_price ? Number(f.promo_price.replace(",", ".")) : null,
      } } });
      toast.success("Produto salvo"); onDone();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-card p-6">
      <h2 className="text-xl font-bold">{product ? "Editar produto" : "Novo produto"}</h2>

      <div className="rounded-xl border-2 border-primary/50 p-4">
        <p className="mb-3 text-sm font-bold">TIPO DO PRODUTO *</p>
        <div className="flex gap-3">
          {(["figure", "filamento"] as const).map((t) => (
            <button type="button" key={t} onClick={() => setF((s) => ({ ...s, product_type: t, category: "" }))}
              className={`flex-1 rounded-lg border py-3 font-bold ${f.product_type === t ? "border-primary bg-primary text-primary-foreground" : ""}`}>
              {TYPE_LABEL[t].toUpperCase()}
            </button>
          ))}
        </div>
        {f.product_type && (
          <div className="mt-4"><L label="Categoria *">
            <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Selecione...</option>
              {CATEGORIES[f.product_type].map((c) => <option key={c}>{c}</option>)}
            </select>
          </L></div>
        )}
      </div>

      <L label="Nome do produto *"><input required className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></L>
      <L label="Descrição"><textarea rows={3} className={`${input} h-auto py-2`} value={f.description} onChange={(e) => set("description", e.target.value)} /></L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Preço (R$) *"><input required inputMode="decimal" className={input} value={f.price} onChange={(e) => set("price", e.target.value)} /></L>
        <L label="Preço promocional (opcional)"><input inputMode="decimal" className={input} value={f.promo_price} onChange={(e) => set("promo_price", e.target.value)} /></L>
        <L label="Material"><input className={input} value={f.material} onChange={(e) => set("material", e.target.value)} /></L>
        <L label="Dimensões"><input className={input} value={f.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></L>
        <L label="Cores"><input className={input} value={f.colors} onChange={(e) => set("colors", e.target.value)} /></L>
        <L label="Status"><select className={input} value={f.status} onChange={(e) => set("status", e.target.value as never)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></L>
        <L label="Badge"><select className={input} value={f.badge} onChange={(e) => set("badge", e.target.value)}>{Object.entries(BADGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></L>
        <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Ativo no site</label>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Imagem do produto</p>
        <div className="flex items-center gap-4">
          {f.image_url && <img src={f.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />}
          <input type="file" accept="image/*" className="text-sm" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            try { set("image_url", await up(file)); } catch { toast.error("Falha no envio da imagem"); }
          }} />
        </div>
        <p className="text-sm text-muted-foreground">Imagens adicionais (opcional)</p>
        <div className="flex flex-wrap items-center gap-3">
          {f.extra_images.map((src) => (
            <button type="button" key={src} title="Remover" onClick={() => set("extra_images", f.extra_images.filter((x) => x !== src))}>
              <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
            </button>
          ))}
          <input type="file" accept="image/*" multiple className="text-sm" onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            try { const urls = await Promise.all(files.map(up)); setF((s) => ({ ...s, extra_images: [...s.extra_images, ...urls] })); }
            catch { toast.error("Falha no envio"); }
          }} />
        </div>
      </div>

      <div className="flex gap-3">
        <button disabled={busy} className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">{busy ? "Salvando..." : "Salvar"}</button>
        <button type="button" onClick={onDone} className="rounded-lg border px-6 py-3">Cancelar</button>
      </div>
    </form>
  );
}
