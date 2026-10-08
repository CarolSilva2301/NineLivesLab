ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_note text NOT NULL DEFAULT '';
COMMENT ON COLUMN public.orders.internal_note IS 'Private administrator note. Never exposed to guest order creation or customer messages.';
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx ON public.orders(status, created_at DESC);
GRANT ALL ON public.orders, public.order_items TO service_role;