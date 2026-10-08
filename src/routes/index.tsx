import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import bn1 from "@/assets/bn1.png";
import bn2 from "@/assets/bn2.png";

import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductGrid } from "@/components/site/Catalog";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nine Lives Lab — Figures e peças em impressão 3D" },
      { name: "description", content: "Figures, decoração e peças em 3D para deixar seu Natal ainda mais especial. Peça pelo WhatsApp." },
      { property: "og:title", content: "Nine Lives Lab — Natal em impressão 3D" },
      { property: "og:description", content: "Figures colecionáveis e peças funcionais impressas em 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

const SLIDES = [
  { img: hero, tag: "🎄 EDIÇÃO ESPECIAL DE NATAL", title: <>NATAL NA <span className="text-primary">NINELIVES!</span></>, text: "Decorações em 3D para deixar seu Natal ainda mais especial.", to: "/filamento?categoria=Natal", cta: "EXPLORAR PRODUTOS" },
  { img: bn1, tag: "🎭 COLECIONÁVEIS", title: <>FIGURES <span className="text-primary">ACTIONS</span></>, text: "Dê vida aos seus personagens favoritos. Confira alguns dos modelos que temos disponíveis.", to: "/figures", cta: "VER FIGURES" },
  { img: bn2, tag: "🧩 IMPRESSÃO 3D", title: <>PEÇAS <span className="text-primary">IMPRESSÃO 3D</span></>, text: "Peças funcionais e decorativas feitas com impressão 3D. Confira nossos modelos!", to: "/filamento", cta: "VER PEÇAS" },
];

function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);
  const go = (d: number) => setI((v) => (v + d + SLIDES.length) % SLIDES.length);
  return (
    <section className="relative min-h-[78vh] overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {SLIDES.map((s, idx) => (
        <div key={idx} aria-hidden={idx !== i} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="bg-hero-fade absolute inset-0" />
          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20">
            <span className="w-fit rounded-full border border-gold/40 bg-background/50 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold backdrop-blur">{s.tag}</span>
            {idx === 0 ? <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">{s.title}</h1>
              : <h2 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">{s.title}</h2>}
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">{s.text}</p>
            {s.to.startsWith("#") ? (
              <a href={s.to} className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground shadow-glow">{s.cta} <ArrowRight className="h-5 w-5" /></a>
            ) : (
              <Link to={s.to as "/figures"} className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground shadow-glow">{s.cta} <ArrowRight className="h-5 w-5" /></Link>
            )}
          </div>
        </div>
      ))}
      <div className="snow pointer-events-none absolute inset-0" />
      <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-1.5 backdrop-blur md:left-3 md:p-2"><ChevronLeft className="h-5 w-5 md:h-6 md:w-6" /></button>
<button onClick={() => go(1)} aria-label="Próximo" className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-1.5 backdrop-blur md:right-3 md:p-2"><ChevronRight className="h-5 w-5 md:h-6 md:w-6" /></button>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} aria-label={`Banner ${idx + 1}`} className={`h-2.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2.5 bg-foreground/40"}`} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(productsQuery);
  const featured = data.filter((p) => p.badge === "destaque").slice(0, 8);
  const news = data.filter((p) => p.badge === "novo").slice(0, 8);
  const natal = data.filter((p) => p.category === "Natal").slice(0, 6);
  return (
    <SiteLayout>
      <HeroCarousel />

      <section id="departamentos" className="mx-auto grid max-w-7xl scroll-mt-20 grid-cols-2 gap-3 px-4 py-12 md:gap-5 md:py-16">
        <DeptCard to="/figures" img="/images/figure.jpg" emoji="🎭" title="FIGURES" text="Figures para colecionar, presentear e decorar." cta="VER FIGURES" />
        <DeptCard to="/filamento" img="/images/filamento.jpg" emoji="🧩" title="FILAMENTO 3D" text="Peças funcionais e decorativas produzidas em impressão 3D." cta="VER PEÇAS" />
      </section>

      {natal.length > 0 && (
        <Section title="🎄 Especial de Natal">
          <ProductGrid items={natal} />
          <div className="mt-6 text-center">
            <Link to="/filamento"
              search={{ categoria: "Natal" }}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-card px-5 py-2.5 text-sm font-semibold text-gold transition hover:border-gold">
              Ver produtos de Natal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      )}

      {featured.length > 0 && <Section title="🔥 DESTAQUES"><ProductGrid items={featured} /></Section>}
      {news.length > 0 && <Section title="✨ NOVIDADES"><ProductGrid items={news} /></Section>}
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function DeptCard({ to, img, emoji, title, text, cta }: { to: "/figures" | "/filamento"; img: string; emoji: string; title: string; text: string; cta: string }) {
  return (
    <Link to={to} className="group relative flex min-h-[220px] overflow-hidden rounded-2xl border md:min-h-[440px]">
      <img src={img} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="relative mt-auto p-3 md:p-8">
        <span className="text-xl md:text-3xl">{emoji}</span>
        <h3 className="mt-1 text-lg font-bold leading-tight md:mt-2 md:text-4xl">{title}</h3>
        <p className="mt-2 hidden max-w-sm text-muted-foreground md:block">{text}</p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition group-hover:gap-3 md:mt-5 md:gap-2 md:px-5 md:py-3 md:text-sm">
          {cta} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
