import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Catalog } from "@/components/site/Catalog";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/figures")({
  head: () => ({
    meta: [
      { title: "Figures | Nine Lives Lab" },
      { name: "description", content: "Figures impressas em 3D: games, anime, filmes, terror e geek." },
      { property: "og:title", content: "Figures | Nine Lives Lab" },
      { property: "og:description", content: "Encontre seu próximo personagem favorito." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: () => (
    <SiteLayout>
      <Catalog type="figure" title="FIGURES" subtitle="Encontre seu próximo personagem favorito." placeholder="Pesquisar figures..." />
    </SiteLayout>
  ),
});
