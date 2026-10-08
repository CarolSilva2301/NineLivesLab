CREATE FUNCTION public.next_order_number() RETURNS text LANGUAGE plpgsql SET search_path = public AS $$ DECLARE v text; BEGIN v := nextval('public.order_number_seq')::text; RETURN 'NL-' || lpad(v, greatest(5, length(v)), '0'); END; $$;
REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT public.next_order_number();