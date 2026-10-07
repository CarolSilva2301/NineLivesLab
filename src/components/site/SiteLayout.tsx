import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Search, X, MessageCircle, Instagram } from "lucide-react";
import { SITE_CONFIG, whatsappLink } from "@/lib/config";
import { CartButton } from "./CartButton";

const nav = [
  { to: "/", label: "Home" },
  { to: "/figures", label: "Figures" },
  { to: "/filamento", label: "Impressão 3D" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <img 
        src="/images/ninelogo.png" 
        alt="Nine Lives Lab" 
        className="h-15 w-15 object-contain" 
      />
      <span>NINELIVES <span className="text-primary">LAB</span></span>
    </Link>
  );
}


export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="xmas-lights" />
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                activeProps={{ className: "text-primary" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/figures" aria-label="Pesquisar" className="rounded-full p-2 hover:bg-secondary"><Search className="h-5 w-5" /></Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full p-2 text-whatsapp hover:bg-secondary"><MessageCircle className="h-5 w-5" /></a>
            <CartButton />
            <button onClick={() => setOpen(!open)} className="rounded-full p-2 hover:bg-secondary md:hidden" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col border-t px-4 py-2 md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 font-medium">{n.label}</Link>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-20 border-t bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Impressão 3D, criatividade e cultura geek.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {nav.map((n) => <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground">{n.label}</Link>)}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Instagram className="h-4 w-4" /> Instagram</a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            <p className="mt-2 text-gold">🎄 Boas festas da Nine Lives Lab!</p>
          </div>
        </div>
      </footer>
      <a href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-glow md:hidden">
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
