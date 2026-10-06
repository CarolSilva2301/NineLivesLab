CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  promo_price numeric(10,2),
  image_url text,
  extra_images text[] NOT NULL DEFAULT '{}',
  material text NOT NULL DEFAULT '',
  dimensions text NOT NULL DEFAULT '',
  colors text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'disponivel',
  badge text NOT NULL DEFAULT 'nenhum',
  product_type text NOT NULL CHECK (product_type IN ('figure','filamento')),
  category text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true);

INSERT INTO public.products (name, description, price, promo_price, material, dimensions, colors, status, badge, product_type, category) VALUES
('Figure Scar - O Rei Leão','Figure detalhada do vilão clássico, pintada à mão.',89.90,NULL,'Resina PLA','18 x 10 cm','Pintura original','disponivel','destaque','figure','Filmes e Séries'),
('Figure Samurai Cyber','Guerreiro cyberpunk com armadura em camadas.',129.90,109.90,'Resina','22 cm','Preto, laranja','disponivel','promocao','figure','Games'),
('Figure Ninja Kitsune','Personagem inspirado em anime, pose dinâmica.',99.90,NULL,'Resina','20 cm','Branco, vermelho','sob_encomenda','novo','figure','Anime'),
('Figure Máscara Slasher','Peça de terror para colecionadores.',79.90,NULL,'PLA','15 cm','Cinza','disponivel','nenhum','figure','Terror'),
('Árvore de Natal Geométrica','Pinheiro paramétrico para decorar a mesa.',59.90,NULL,'PLA Silk','25 cm','Verde, dourado','disponivel','natal','filamento','Natal'),
('Suporte de Headset Gamer','Suporte robusto para seu setup.',49.90,NULL,'PETG','27 x 12 cm','Preto, laranja','disponivel','destaque','filamento','Setup Gamer'),
('Organizador de Mesa Modular','Módulos encaixáveis para canetas e cabos.',39.90,NULL,'PLA','15 x 10 cm','Preto, branco','disponivel','novo','filamento','Organização'),
('Luminária Lua Litofania','Luminária com textura de lua.',119.90,99.90,'PLA','12 cm','Branco','sob_encomenda','promocao','filamento','Decoração');