ALTER TABLE public.restorations ADD COLUMN status text NOT NULL DEFAULT 'recebida';
ALTER TABLE public.restorations ADD CONSTRAINT restorations_status_check CHECK (status IN ('recebida','em_restauracao','pronta','entregue'));
CREATE INDEX restorations_status_idx ON public.restorations (status);