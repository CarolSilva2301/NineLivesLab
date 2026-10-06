import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
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
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(productsQuery);
  const featured = data.filter((p) => p.badge === "destaque").slice(0, 8);
  const news = data.filter((p) => p.badge === "novo").slice(0, 8);
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Figures e árvore de Natal impressas em 3D" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="bg-hero-fade absolute inset-0" />
        <div className="snow absolute inset-0" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20">
          <span className="w-fit rounded-full border border-gold/40 bg-background/50 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold backdrop-blur">🎄 EDIÇÃO ESPECIAL DE NATAL</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            NATAL NA <span className="text-primary">NINE LIVES</span> LAB
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">Figures, decoração e peças em 3D para deixar seu Natal ainda mais especial.</p>
          <a href="#departamentos" className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground shadow-glow transition hover:translate-y-[-2px]">
            EXPLORAR PRODUTOS <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <section id="departamentos" className="mx-auto grid max-w-7xl scroll-mt-20 gap-5 px-4 py-16 md:grid-cols-2">
        <DeptCard to="/figures" img="/images/figure.jpg" emoji="🎭" title="FIGURES" text="Figures para colecionar, presentear e decorar." cta="VER FIGURES" />
        <DeptCard to="/filamento" img="/images/filamento.jpg" emoji="🧩" title="FILAMENTO 3D" text="Peças funcionais e decorativas produzidas em impressão 3D." cta="VER PEÇAS" />
      </section>

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
    <Link to={to} className="group relative flex min-h-[340px] overflow-hidden rounded-2xl border md:min-h-[440px]">
      <img src={img} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="relative mt-auto p-6 md:p-8">
        <span className="text-3xl">{emoji}</span>
        <h3 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">{text}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition group-hover:gap-3">
          {cta} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
