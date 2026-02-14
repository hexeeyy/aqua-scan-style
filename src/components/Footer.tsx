import { GraduationCap } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border/50 backdrop-blur-xl bg-card/60">
    <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] font-bold text-foreground tracking-tight">University of Rizal System</p>
          <p className="text-[9px] text-muted-foreground font-medium">College of Engineering • BS Computer Engineering</p>
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground font-medium">© {new Date().getFullYear()} SARI-ONE</p>
    </div>
  </footer>
);
