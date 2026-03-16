import { useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs of scans to update */
  scanIds: string[];
  onSuccess?: () => void;
}

export const EditLocationDialog = ({ open, onOpenChange, scanIds, onSuccess }: EditLocationDialogProps) => {
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = location.trim();
    if (!trimmed) {
      toast.error("Please enter a location name");
      return;
    }
    if (trimmed.length > 200) {
      toast.error("Location name is too long");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("scan_history")
      .update({ location_name: trimmed })
      .in("id", scanIds);

    setSaving(false);
    if (error) {
      toast.error("Failed to update location");
      return;
    }
    toast.success(`Updated ${scanIds.length} scan(s) to "${trimmed}"`);
    setLocation("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-primary" />
            Assign Location
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign a location to {scanIds.length} scan{scanIds.length > 1 ? "s" : ""} with unknown location.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Navotas Fish Port, Manila"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !location.trim()}>
            {saving ? "Saving…" : "Save Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
