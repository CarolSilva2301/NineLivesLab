# Purchase-flow adjustments
- [x] Separate immediate purchase from main cart and update official contacts.
- [x] Complete WhatsApp handoff and summary-first checkout.
- [x] Test both flows, contacts and desktop/tablet/mobile layout.
- [x] Persist orders and item snapshots atomically in existing Cloud, then include order number in WhatsApp.
- [x] Verify private access, failure handling and persisted immediate/cart orders; no admin order screen.
- [x] Replace automatic WhatsApp handoff with successful-order confirmation and optional contact; verify success and failure paths (16 tests passed).
- [ ] Add private internal notes and validated admin order operations using existing security.
- [ ] Add /admin/pedidos, live new-order count, query filters, details, status, notes, customer contact and confirmed deletion.
- [ ] Test management, privacy, persistence, deletion and mobile display; preserve purchase flow.