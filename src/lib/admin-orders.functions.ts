import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth.server";
import { orderStatusSchema, type OrderDetail } from "@/lib/admin-orders";

const creds = z.object({ user: z.string(), pass: z.string() });
const identified = z.object({ creds, id: z.string().uuid() });

export const adminOrderCount = createServerFn({ method: "POST" })
  .inputValidator((input) => creds.parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { count, error } = await db.from("orders").select("id", { count: "exact", head: true }).eq("status", "novo");
    if (error) throw new Error("Não foi possível consultar novos pedidos.");
    return count ?? 0;
  });

export const adminOrderList = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ creds, status: orderStatusSchema.optional(), page: z.number().int().min(0).default(0) }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    let query = db.from("orders").select("id,order_number,customer_name,total,created_at,status", { count: "exact" });
    if (data.status) query = query.eq("status", data.status);
    const { data: rows, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(data.page * 50, data.page * 50 + 49);
    if (error) throw new Error("Não foi possível carregar os pedidos.");
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const adminOrderDetail = createServerFn({ method: "POST" })
  .inputValidator((input) => identified.parse(input))
  .handler(async ({ data }): Promise<OrderDetail> => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const [order, items] = await Promise.all([
      db.from("orders").select("id,order_number,customer_name,whatsapp,email,city,notes,internal_note,total,status,created_at").eq("id", data.id).single(),
      db.from("order_items").select("*").eq("order_id", data.id).order("created_at"),
    ]);
    if (order.error || items.error || !order.data) throw new Error("Não foi possível carregar o pedido.");
    const ids = [...new Set((items.data ?? []).map((item) => item.product_id))];
    const images = ids.length ? await db.from("products").select("id,image_url").in("id", ids) : { data: [], error: null };
    if (images.error) throw new Error("Não foi possível carregar as imagens.");
    const map = new Map((images.data ?? []).map((product) => [product.id, product.image_url]));
    return { ...order.data, items: (items.data ?? []).map((item) => ({ ...item, image_url: map.get(item.product_id) ?? null })) };
  });

export const adminOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => identified.extend({ status: orderStatusSchema }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error, data: row } = await db.from("orders").update({ status: data.status }).eq("id", data.id).select("id").single();
    if (error || !row) throw new Error("Não foi possível alterar o status.");
    return { ok: true };
  });

export const adminOrderNote = createServerFn({ method: "POST" })
  .inputValidator((input) => identified.extend({ note: z.string().max(10000) }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error, data: row } = await db.from("orders").update({ internal_note: data.note }).eq("id", data.id).select("id").single();
    if (error || !row) throw new Error("Não foi possível salvar a nota interna.");
    return { ok: true };
  });

export const adminOrderDelete = createServerFn({ method: "POST" })
  .inputValidator((input) => identified.extend({ confirmed: z.literal(true) }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    // Existing ON DELETE CASCADE removes all item snapshots atomically.
    const { error, data: row } = await db.from("orders").delete().eq("id", data.id).select("id").single();
    if (error || !row) throw new Error("Não foi possível excluir o pedido.");
    return { ok: true };
  });