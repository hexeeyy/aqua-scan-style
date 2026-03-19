import { ShieldAlert, Clock } from "lucide-react";
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
}

export const ApprovalGate = ({ open, onOpenChange }: ApprovalGateProps) => {
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
          <DialogTitle className="text-lg">Feature Restricted</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            This feature requires admin approval. You can explore the app freely, but camera scanning and AI analysis are available only after your account is approved.
          </DialogDescription>
        </DialogHeader>
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
