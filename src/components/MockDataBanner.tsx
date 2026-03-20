import { Info } from "lucide-react";

export const MockDataBanner = () => (
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs font-medium mb-4">
    <Info className="w-4 h-4 flex-shrink-0" />
    <span>
      You're viewing <strong>sample data</strong>. Get approved to see live statistics and your own scan history.
    </span>
  </div>
);
