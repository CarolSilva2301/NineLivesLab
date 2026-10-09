import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Catalog } from "@/components/site/Catalog";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [
    { title: "Todos os produtos | Nine Lives Lab" },
    { name: "description", content: "Explore todos os Figures e produtos de impressão 3D da Nine Lives Lab." },
    { property: "og:title", content: "Todos os produtos | Nine Lives Lab" },
    { property: "og:description", content: "Catálogo completo de Figures e peças em impressão 3D." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: () => <SiteLayout><Catalog title="PRODUTOS" subtitle="Figures e peças em impressão 3D." placeholder="Pesquisar produtos..." /></SiteLayout>,
});