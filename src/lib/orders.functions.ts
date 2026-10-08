import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema } from "@/lib/order-schema";

// Guest checkout deliberately has no account requirement. Only this validated
// write-only operation can access the otherwise private order tables.
export const registerOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => orderInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("register_order", {
      p_request_id: data.requestId,
      p_customer: data.customer,
      p_items: data.items,
    });
    if (error || !result || typeof result !== "object" || Array.isArray(result)) {
      return { ok: false as const };
    }
    const orderNumber = result["order_number"];
    if (typeof orderNumber !== "string") return { ok: false as const };
    return { ok: true as const, orderNumber };
  });