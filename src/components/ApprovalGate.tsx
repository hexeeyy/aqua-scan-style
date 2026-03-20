import { ShieldAlert, Clock, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ApprovalGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freeScansRemaining?: number;
  freeScanLimit?: number;
}

export const ApprovalGate = ({ open, onOpenChange, freeScansRemaining = 0, freeScanLimit = 3 }: ApprovalGateProps) => {
  const scansUsed = freeScanLimit - freeScansRemaining;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader className="items-center space-y-3">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-lg">Free Scans Used Up</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            You've used all {freeScanLimit} free scans. To continue scanning, please wait for admin approval of your account.
          </DialogDescription>
        </DialogHeader>

        {/* Usage bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium px-1">
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              {scansUsed} / {freeScanLimit} free scans used
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive/80 transition-all duration-500"
              style={{ width: `${(scansUsed / freeScanLimit) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-muted/50 border border-border/30 mx-auto">
          <Clock className="w-4 h-4 text-warning animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground">
            Approval pending
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
