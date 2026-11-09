import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth.server";
import { paymentStatus, restorationSchema, restorationStatusSchema } from "@/lib/restorations";

const creds = z.object({ user: z.string(), pass: z.string() });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

type RestorationRow = {
  id: string; restoration_number: string; customer_name: string; whatsapp: string; email: string | null;
  figure_name: string; damage_description: string; service_description: string; notes: string;
  total_value: number; paid_value: number; remaining_value: number | null; payment_method: string;
  received_at: string | null; expected_delivery_at: string | null; delivered_at: string | null;
  before_images: string[]; after_images: string[]; status: string; created_at: string;
};

function withPayment<T extends { total_value: number; paid_value: number }>(row: T) {
  return { ...row, payment_status: paymentStatus(Number(row.total_value), Number(row.paid_value)) };
}

async function signImages(db: { storage: { from: (b: string) => { createSignedUrls: (paths: string[], expires: number) => Promise<{ data: unknown }> } } }, paths: string[]) {
  if (paths.length === 0) return [] as { path: string; url: string }[];
  const { data } = await db.storage.from("restorations").createSignedUrls(paths, 3600);
  const urls = new Map(((data ?? []) as { path: string; signedUrl: string }[]).map((d) => [d.path, d.signedUrl]));
  return paths.filter((p) => urls.has(p)).map((p) => ({ path: p, url: urls.get(p)! }));
}

export const adminUploadRestorationImage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    creds,
    filename: z.string().max(200),
    contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
    base64: z.string().max(14_000_000),
  }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const ext = (data.filename.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await db.storage.from("restorations").upload(path, bytes, { contentType: data.contentType });
    if (error) throw new Error("Não foi possível enviar a imagem.");
    return { path };
  });

export const adminCreateRestoration = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, restoration: restorationSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await db.from("restorations").insert(data.restoration).select("id,restoration_number").single();
    if (error || !row) throw new Error("Não foi possível salvar a restauração.");
    return row;
  });

export const adminListRestorations = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    creds,
    search: z.string().trim().max(200).optional(),
    status: restorationStatusSchema.optional(),
    payment: z.enum(["pendente", "parcial", "pago"]).optional(),
    from: date.optional(),
    to: date.optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await db.from("restorations").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar as restaurações.");
    const all = (rows as RestorationRow[]).map(withPayment);
    const stats = {
      total: all.length,
      recebida: all.filter((r) => r.status === "recebida").length,
      em_restauracao: all.filter((r) => r.status === "em_restauracao").length,
      pronta: all.filter((r) => r.status === "pronta").length,
      entregue: all.filter((r) => r.status === "entregue").length,
      pagamento_aberto: all.filter((r) => r.payment_status !== "pago").length,
    };
    const term = (data.search ?? "").toLowerCase();
    const filtered = all.filter((r) => {
      if (term && ![r.customer_name, r.whatsapp, r.figure_name, r.restoration_number].some((v) => v.toLowerCase().includes(term))) return false;
      if (data.status && r.status !== data.status) return false;
      if (data.payment && r.payment_status !== data.payment) return false;
      if (data.from && (!r.received_at || r.received_at < data.from)) return false;
      if (data.to && (!r.received_at || r.received_at > data.to)) return false;
      return true;
    });
    return { rows: filtered, stats };
  });

export const adminGetRestoration = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await db.from("restorations").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Restauração não encontrada.");
    const r = row as RestorationRow;
    return {
      ...withPayment(r),
      before: await signImages(db, r.before_images),
      after: await signImages(db, r.after_images),
    };
  });

export const adminUpdateRestoration = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid(), restoration: restorationSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await db.from("restorations").update(data.restoration).eq("id", data.id).select("id,restoration_number").single();
    if (error || !row) throw new Error("Não foi possível salvar as alterações.");
    return row;
  });

export const adminUpdateRestorationStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid(), status: restorationStatusSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("restorations").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o status.");
  });

export const adminDeleteRestoration = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid(), confirmed: z.literal(true) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await db.from("restorations").select("before_images,after_images").eq("id", data.id).single();
    if (error || !row) throw new Error("Restauração não encontrada.");
    const paths = [...row.before_images, ...row.after_images];
    if (paths.length > 0) await db.storage.from("restorations").remove(paths);
    const { error: delError } = await db.from("restorations").delete().eq("id", data.id);
    if (delError) throw new Error("Não foi possível excluir a restauração.");
  });
