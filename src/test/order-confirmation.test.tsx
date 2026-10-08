import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { saveOrder } = vi.hoisted(() => ({ saveOrder: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => saveOrder }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: React.ComponentType }) => ({ options, useSearch: () => ({}) }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/figures">{children}</a>,
}));
vi.mock("@/components/site/SiteLayout", () => ({ SiteLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/orders.functions", () => ({ registerOrder: vi.fn() }));
vi.mock("@/lib/cart", () => ({
  useCart: () => [{ id: "34d2a73a-e6a0-4b83-96cf-a2e366993071", name: "Figure", price: 49.9, qty: 1, image_url: null }],
  buyNow: { get: () => [] },
}));
import { Route } from "@/routes/finalizar";

function submit() {
  const Checkout = Route.options.component;
  if (!Checkout) throw new Error("Missing checkout component");
  render(<Checkout />);
  fireEvent.change(screen.getByLabelText("Nome completo *"), { target: { value: "Maria" } });
  fireEvent.change(screen.getByLabelText("WhatsApp *"), { target: { value: "85999999999" } });
  fireEvent.change(screen.getByLabelText("Cidade *"), { target: { value: "Fortaleza" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
}

describe("Optional WhatsApp after order creation", () => {
  beforeEach(() => { saveOrder.mockReset(); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("confirms a saved order without opening WhatsApp or requiring contact", async () => {
    const open = vi.spyOn(window, "open");
    saveOrder.mockResolvedValue({ ok: true, orderNumber: "NL-00021" });
    submit();
    await screen.findByRole("heading", { name: "Pedido confirmado!" });
    expect(saveOrder).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    const contact = screen.getByRole("link", { name: "Falar conosco pelo WhatsApp" });
    expect(new URL(contact.getAttribute("href") ?? "").searchParams.get("text")).toContain("#NL-00021");
  });

  it("waits for successful creation before offering contact", async () => {
    let resolve: ((value: { ok: true; orderNumber: string }) => void) | undefined;
    saveOrder.mockImplementation(() => new Promise((done) => { resolve = done; }));
    submit();
    expect(screen.queryByRole("link", { name: "Falar conosco pelo WhatsApp" })).toBeNull();
    expect(screen.getByRole("button", { name: "Registrando pedido…" })).toBeDisabled();
    resolve?.({ ok: true, orderNumber: "NL-00022" });
    await screen.findByRole("heading", { name: "Pedido confirmado!" });
  });

  it("keeps customer data and does not offer contact when saving fails", async () => {
    const open = vi.spyOn(window, "open");
    saveOrder.mockResolvedValue({ ok: false });
    submit();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByLabelText("Nome completo *")).toHaveValue("Maria");
    expect(screen.queryByRole("link", { name: "Falar conosco pelo WhatsApp" })).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});