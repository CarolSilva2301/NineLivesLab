import { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECEIPT_PRINT, receiptGeometry, receiptHtml, type ReceiptRecord } from "@/lib/restoration-receipt";
import receiptStyles from "@/lib/restoration-receipt.css?inline";

export function RestorationReceiptPrint({ record }: { record: ReceiptRecord }) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState<number>(RECEIPT_PRINT.usefulWidthMm);
  const [issuedAt, setIssuedAt] = useState(new Date());
  const geometry = receiptGeometry(width);
  const html = receiptHtml(record, issuedAt);

  const print = () => {
    const popup = window.open("", "_blank", "popup,width=560,height=800");
    if (!popup) { toast.error("Permita abrir a janela de impressão e tente novamente."); return; }
    popup.opener = null;
    const doc = popup.document;
    doc.open();
    doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Recibo ${record.restoration_number.replace(/[^a-zA-Z0-9-]/g, "")} | Nine Lives Lab</title><style>${receiptStyles}</style></head><body>${html}</body></html>`);
    doc.close();
    doc.documentElement.style.setProperty("--receipt-useful-width", `${geometry.usefulWidthMm}mm`);
    doc.documentElement.style.setProperty("--receipt-side-margin", `${geometry.sideMarginMm}mm`);
    const theme = getComputedStyle(document.documentElement);
    for (const token of ["--receipt-paper", "--receipt-ink"]) doc.documentElement.style.setProperty(token, theme.getPropertyValue(token));
    void doc.fonts.ready.then(() => {
      if (popup.closed) return;
      // CSS cannot express roll width + automatic height. Measure this receipt, not a fixed/A4 page.
      const heightMm = Math.ceil((doc.querySelector(".restoration-receipt")?.getBoundingClientRect().height ?? doc.body.getBoundingClientRect().height) * 25.4 / 96) + 1;
      const page = doc.createElement("style");
      page.textContent = `@page { size: ${geometry.paperWidthMm}mm ${heightMm}mm; margin: 0; }`;
      doc.head.append(page);
      popup.focus();
      popup.print();
    }).catch(() => toast.error("Não foi possível abrir a impressão. Tente novamente."));
  };

  return <>
    <Button variant="outline" onClick={() => { setIssuedAt(new Date()); setOpen(true); }}><Printer /> Imprimir recibo</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>Recibo {record.restoration_number}</DialogTitle><DialogDescription>Bobina de 110 mm</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="space-y-1 text-sm">Área útil (mm)<input aria-label="Área útil de impressão (mm)" type="number" min={RECEIPT_PRINT.minUsefulWidthMm} max={RECEIPT_PRINT.maxUsefulWidthMm} value={width} onChange={(e) => setWidth(Number(e.target.value))} onBlur={() => setWidth(geometry.usefulWidthMm)} className="block h-10 w-24 rounded-lg border bg-background px-3" /></label>
          <Button onClick={print}><Printer /> Imprimir recibo</Button>
        </div>
        <style>{receiptStyles.split("/* Defaults only;")[0]}</style>
        <div className="receipt-preview" style={{ "--receipt-useful-width": `${geometry.usefulWidthMm}mm`, "--receipt-side-margin": `${geometry.sideMarginMm}mm` } as React.CSSProperties}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </DialogContent>
    </Dialog>
  </>;
}