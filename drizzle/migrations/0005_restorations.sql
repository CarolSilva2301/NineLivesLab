CREATE SEQUENCE public.restoration_number_seq;
GRANT USAGE ON SEQUENCE public.restoration_number_seq TO service_role;
CREATE OR REPLACE FUNCTION public.next_restoration_number() RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$ DECLARE v text; BEGIN v := nextval('public.restoration_number_seq')::text; RETURN 'REST-' || lpad(v, greatest(4, length(v)), '0'); END; $$;
REVOKE EXECUTE ON FUNCTION public.next_restoration_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_restoration_number() TO service_role;
CREATE TABLE public.restorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restoration_number text NOT NULL UNIQUE DEFAULT public.next_restoration_number(),
  customer_name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  figure_name text NOT NULL DEFAULT '',
  damage_description text NOT NULL DEFAULT '',
  service_description text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  total_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
  paid_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_value >= 0),
  remaining_value numeric(12,2) GENERATED ALWAYS AS (total_value - paid_value) STORED,
  payment_method text NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix','dinheiro','cartao','outro')),
  received_at date,
  expected_delivery_at date,
  delivered_at date,
  before_images text[] NOT NULL DEFAULT '{}',
  after_images text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.restorations TO service_role;
ALTER TABLE public.restorations ENABLE ROW LEVEL SECURITY;