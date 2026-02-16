import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ResultPanelProps {
  title: string;
  icon?: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

const variantStyles = {
  primary: "bg-ocean-gradient",
  success: "bg-fresh-gradient",
  warning: "bg-moderate-gradient",
  danger: "bg-poor-gradient",
  info: "from-[hsl(260,70%,60%)] to-[hsl(280,60%,50%)] bg-gradient-to-r",
};

export const ResultPanel = ({ title, icon: Icon, variant = "primary", children, className, footer }: ResultPanelProps) => {
  return (
    <div className={cn("rounded-xl overflow-hidden shadow-md bg-card border border-border/30 animate-fade-in", className)}>
      <div className={cn("px-3 py-2 flex items-center gap-2", variantStyles[variant])}>
        {Icon && (
          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
      {footer && (
        <div className="px-3 pb-2 pt-0">{footer}</div>
      )}
    </div>
  );
};
