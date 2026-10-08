CREATE SEQUENCE public.order_number_seq;
CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_number text NOT NULL UNIQUE DEFAULT ('NL-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
 customer_name text NOT NULL,
 whatsapp text NOT NULL,
 email text,
 city text NOT NULL,
 notes text NOT NULL DEFAULT '',
 total numeric(12,2) NOT NULL CHECK (total >= 0),
 status text NOT NULL DEFAULT 'novo',
 created_at timestamptz NOT NULL DEFAULT now(),
 request_id uuid NOT NULL UNIQUE,
 request_fingerprint text NOT NULL
);
GRANT ALL ON public.orders TO service_role;
REVOKE ALL ON public.orders FROM anon, authenticated;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
 product_id uuid NOT NULL,
 product_name text NOT NULL,
 quantity integer NOT NULL CHECK (quantity > 0),
 unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
 subtotal numeric(12,2) NOT NULL CHECK (subtotal = quantity * unit_price),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_items TO service_role;
REVOKE ALL ON public.order_items FROM anon, authenticated;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO service_role;
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
CREATE FUNCTION public.register_order(p_request_id uuid, p_customer jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
 v_order public.orders%ROWTYPE;
 v_item jsonb;
 v_product public.products%ROWTYPE;
 v_qty integer;
 v_price numeric(12,2);
 v_total numeric(12,2) := 0;
 v_snapshots jsonb := '[]'::jsonb;
 v_fingerprint text := md5(p_customer::text || p_items::text);
BEGIN
 IF p_request_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100
 OR coalesce(length(trim(p_customer->>'nome')),0) NOT BETWEEN 1 AND 100
 OR coalesce(length(trim(p_customer->>'whatsapp')),0) NOT BETWEEN 1 AND 30
 OR coalesce(length(trim(p_customer->>'cidade')),0) NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'Invalid order';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
 SELECT * INTO v_order FROM public.orders WHERE request_id = p_request_id;
 IF FOUND THEN
  IF v_order.request_fingerprint <> v_fingerprint THEN RAISE EXCEPTION 'Invalid retry'; END IF;
  RETURN jsonb_build_object('id',v_order.id,'order_number',v_order.order_number);
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  v_qty := (v_item->>'quantity')::integer;
  IF v_qty NOT BETWEEN 1 AND 999 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::uuid AND active = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unavailable product'; END IF;
  v_price := coalesce(v_product.promo_price, v_product.price);
  IF v_price <> (v_item->>'unit_price')::numeric THEN RAISE EXCEPTION 'Product price changed'; END IF;
  v_total := v_total + v_qty * v_price;
  v_snapshots := v_snapshots || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'product_name',v_product.name,'quantity',v_qty,'unit_price',v_price,'subtotal',v_qty*v_price));
 END LOOP;
 INSERT INTO public.orders(customer_name,whatsapp,email,city,notes,total,request_id,request_fingerprint)
 VALUES(trim(p_customer->>'nome'),trim(p_customer->>'whatsapp'),nullif(trim(p_customer->>'email'),''),trim(p_customer->>'cidade'),coalesce(p_customer->>'obs',''),v_total,p_request_id,v_fingerprint)
 RETURNING * INTO v_order;
 INSERT INTO public.order_items(order_id,product_id,product_name,quantity,unit_price,subtotal)
 SELECT v_order.id, (s->>'product_id')::uuid, s->>'product_name', (s->>'quantity')::integer, (s->>'unit_price')::numeric, (s->>'subtotal')::numeric
 FROM jsonb_array_elements(v_snapshots) s;
 RETURN jsonb_build_object('id',v_order.id,'order_number',v_order.order_number);
END;
$$;
REVOKE ALL ON FUNCTION public.register_order(uuid,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_order(uuid,jsonb,jsonb) TO service_role;