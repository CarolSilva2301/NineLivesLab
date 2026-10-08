import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminOrderCount } from "@/lib/admin-orders.functions";
import type { AdminCreds } from "@/lib/admin-orders";

export function AdminOrdersLink({ creds }: { creds: AdminCreds }) {
  const count = useServerFn(adminOrderCount);
  const query = useQuery({ queryKey: ["admin-orders", "count"], queryFn: () => count({ data: creds }), refetchInterval: 30000 });
  return <Button asChild variant="ghost"><Link to="/admin/pedidos" search={{ status: "todos", page: 0 }}><ClipboardList className="h-4 w-4" /> Pedidos
    {!!query.data && <span aria-label={`${query.data} novos pedidos`} className="min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-xs font-bold text-destructive-foreground">{query.data}</span>}
  </Link></Button>;
}