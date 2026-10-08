import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/SiteLayout";
import { adminLogin } from "@/lib/admin.functions";
import type { AdminCreds } from "@/lib/admin-orders";

const KEY = "nll-admin";
export function AdminAccess({ children }: { children: (creds: AdminCreds, logout: () => void) => React.ReactNode }) {
  const [creds, setCreds] = useState<AdminCreds | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      if (typeof stored?.user === "string" && typeof stored?.pass === "string") setCreds(stored);
    } catch { sessionStorage.removeItem(KEY); }
  }, []);
  const logout = () => { sessionStorage.removeItem(KEY); setCreds(null); queryClient.removeQueries({ queryKey: ["admin-orders"] }); };
  return <div className="min-h-screen"><Toaster />{creds ? children(creds, logout) : <AdminLogin onLogin={(value) => { sessionStorage.setItem(KEY, JSON.stringify(value)); setCreds(value); }} />}</div>;
}
function AdminLogin({ onLogin }: { onLogin: (creds: AdminCreds) => void }) {
  const login = useServerFn(adminLogin);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="grid min-h-screen place-items-center px-4">
    <form className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true);
      try { await login({ data: { user, pass } }); onLogin({ user, pass }); }
      catch { toast.error("Usuário ou senha inválidos"); }
      finally { setBusy(false); }
    }}>
      <Logo /><h1 className="text-xl font-bold">Acesso administrativo</h1>
      <input aria-label="Usuário" className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Usuário" value={user} onChange={(event) => setUser(event.target.value)} />
      <input aria-label="Senha" type="password" className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Senha" value={pass} onChange={(event) => setPass(event.target.value)} />
      <Button disabled={busy} className="h-11 w-full rounded-lg font-bold">{busy ? "Entrando..." : "Entrar"}</Button>
    </form>
  </div>;
}