import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as adminIndex } from "@/routes/admin.index";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("defaults admin to orders but preserves explicit panel tabs", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/admin");
    expect(matches.at(-1)?.routeId).toBe("/admin/");
    const beforeLoad = adminIndex.options.beforeLoad;
    if (typeof beforeLoad !== "function") throw new Error("Missing admin entry guard");
    const call = beforeLoad as (ctx: { search: { aba?: string } }) => unknown;
    try {
      call({ search: {} });
      throw new Error("Expected order redirect");
    } catch (error) {
      expect(error).toMatchObject({ options: { to: "/admin/pedidos", search: { status: "todos", page: 0 } } });
    }
    expect(call({ search: { aba: "produtos" } })).toBeUndefined();
    expect(call({ search: { aba: "categorias" } })).toBeUndefined();
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
