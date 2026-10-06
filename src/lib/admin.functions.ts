import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAdmin } from "./admin-auth.server";

const creds = z.object({ user: z.string(), pass: z.string() });

const productInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(3000),
  price: z.number().min(0),
  promo_price: z.number().min(0).nullable(),
  image_url: z.string().nullable(),
  extra_images: z.array(z.string()),
  material: z.string().max(200),
  dimensions: z.string().max(200),
  colors: z.string().max(300),
  status: z.enum(["disponivel", "sob_encomenda"]),
  badge: z.enum(["nenhum", "novo", "promocao", "natal", "destaque", "sob_encomenda"]),
  product_type: z.enum(["figure", "filamento"]),
  category: z.string().min(1),
  active: z.boolean(),
});

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => creds.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data);
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => creds.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { data: rows, error } = await db
      .from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ creds, id: z.string().uuid().nullable(), product: productInput }).parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const db = await admin();
    const q = data.id
      ? db.from("products").update(data.product).eq("id", data.id)
      : db.from("products").insert(data.product);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const db = await admin();
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleProduct = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ creds, id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const db = await admin();
    const { error } = await db.from("products").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      creds,
      filename: z.string().max(200),
      contentType: z.string().regex(/^image\//),
      base64: z.string().max(14_000_000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.creds);
    const db = await admin();
    const ext = (data.filename.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5);
    const path = `${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await db.storage.from("products").upload(path, bytes, {
      contentType: data.contentType,
    });
    if (error) throw new Error(error.message);
    return { url: `/api/public/img/${path}` };
  });
