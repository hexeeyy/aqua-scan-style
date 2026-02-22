import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { ResultPanel } from "./ResultPanel";

interface ScanQRCodeProps {
  shareToken: string;
}

export const ScanQRCode = ({ shareToken }: ScanQRCodeProps) => {
  const publicUrl = `${window.location.origin}/scan/share/${shareToken}`;

  return (
    <ResultPanel title="Share This Result" icon={QrCode} variant="primary" className="gsap-result col-span-2">
      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-border/20">
          <QRCodeSVG value={publicUrl} size={96} level="M" />
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-bold text-foreground">Consumer QR Code</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Any consumer can scan this QR code to view the full analysis results, freshness score, and buying recommendation.
          </p>
          <p className="text-[9px] text-primary font-mono break-all bg-muted/50 rounded-lg px-2 py-1">
            {publicUrl}
          </p>
        </div>
      </div>
    </ResultPanel>
  );
};
