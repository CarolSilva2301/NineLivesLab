import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Catalog } from "@/components/site/Catalog";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/filamento")({
  head: () => ({
    meta: [
      { title: "Filamento 3D | Nine Lives Lab" },
      { name: "description", content: "Peças funcionais, decorativas e criativas produzidas em impressão 3D." },
      { property: "og:title", content: "Filamento 3D | Nine Lives Lab" },
      { property: "og:description", content: "Utilidades, decoração, setup gamer e Natal em impressão 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: () => (
    <SiteLayout>
      <Catalog type="filamento" title="FILAMENTO 3D" subtitle="Peças funcionais, decorativas e criativas produzidas em impressão 3D." placeholder="Pesquisar peças..." />
    </SiteLayout>
  ),
});
