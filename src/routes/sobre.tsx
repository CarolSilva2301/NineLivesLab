import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre | Nine Lives Lab" },
      { name: "description", content: "Impressão 3D, criatividade e cultura geek." },
      { property: "og:title", content: "Sobre a Nine Lives Lab" },
      { property: "og:description", content: "Transformamos ideias em figures e peças através da impressão 3D." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="snow mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold md:text-6xl">SOBRE A <span className="text-primary">NINE LIVES LAB</span></h1>
        <p className="mt-6 text-xl text-gold">Impressão 3D, criatividade e cultura geek.</p>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          A Nine Lives Lab transforma ideias em figures, peças decorativas e produtos funcionais através da impressão 3D.
        </p>
      </section>
    </SiteLayout>
  ),
});
