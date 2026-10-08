<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Product writes go through admin server functions in src/lib/admin.functions.ts gated by assertAdmin (admin-auth.server.ts); why: single swap point for real auth later.
- Product images live in a private storage bucket served via /api/public/img/$; why: workspace blocks public buckets.
- Categories, badges, WhatsApp number live in src/lib/config.ts; why: easy to edit without DB changes.
- Immediate purchases use sessionStorage and an explicit checkout search mode, separate from the persisted cart; why: checkout and reload never merge the two flows.
- Order totals and WhatsApp messages use src/lib/checkout.ts and the centralized contact configuration; why: both purchase flows share testable calculations and contact routing.
- Successful checkout renders confirmation only after the order-write result, with contact as a separate optional link; why: registering an order must not depend on external navigation.
- Guest order creation uses a validated write-only server function and service-role-only atomic database function; why: private snapshots, authoritative prices, unique numbers and retry-safe writes without customer login.
- Admin order operations use server-side assertAdmin before privileged access, with separate private internal notes and existing cascading item deletion; why: preserve current admin authentication and never expose orders publicly.
- The admin parent renders Outlet with the existing product panel in its index and order management in its child route; why: preserve /admin while supporting /admin/pedidos.
