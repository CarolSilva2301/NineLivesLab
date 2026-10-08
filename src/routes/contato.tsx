import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SITE_CONFIG, whatsappLink } from "@/lib/config";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato | Nine Lives Lab" },
      { name: "description", content: "Fale com a Nine Lives Lab pelo WhatsApp ou Instagram." },
      { property: "og:title", content: "Fale conosco | Nine Lives Lab" },
      { property: "og:description", content: "WhatsApp e Instagram da Nine Lives Lab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold md:text-6xl">FALE <span className="text-primary">CONOSCO</span></h1>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href={whatsappLink()} target="_blank" rel="noreferrer" className="rounded-xl border bg-card p-6 hover:border-primary">
            <MessageCircle className="mx-auto h-8 w-8 text-whatsapp" /><p className="mt-3 font-semibold">WhatsApp</p>
          </a>
          <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="rounded-xl border bg-card p-6 hover:border-primary">
            <Instagram className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 font-semibold">{SITE_CONFIG.instagramHandle}</p>
          </a>
        </div>
        <a href={whatsappLink("Olá! Vim pelo site da Nine Lives Lab.")} target="_blank" rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-8 py-4 font-bold text-whatsapp-foreground shadow-glow">
          <MessageCircle className="h-5 w-5" /> Falar pelo WhatsApp
        </a>
      </section>
    </SiteLayout>
  ),
});
