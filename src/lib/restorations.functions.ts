import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth.server";
import { restorationSchema } from "@/lib/restorations";

const creds = z.object({ user: z.string(), pass: z.string() });

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
