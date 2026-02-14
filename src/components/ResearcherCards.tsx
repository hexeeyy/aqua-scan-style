import { User, Mail, Award } from "lucide-react";

interface Researcher {
  name: string;
  role: string;
  color: string;
  initials: string;
}

const researchers: Researcher[] = [
  { name: "Mark Hexilon Payno", role: "Lead Researcher", color: "from-primary to-blue-600", initials: "MP" },
  { name: "Trisha Tumbagahan", role: "Data Analyst", color: "from-violet-500 to-purple-600", initials: "TT" },
  { name: "Yvan Joaquin Aquino", role: "Marine Biologist", color: "from-emerald-500 to-teal-600", initials: "YA" },
  { name: "Philip Inigo Lenida", role: "Software Engineer", color: "from-amber-500 to-orange-600", initials: "PL" },
];

export const ResearcherCards = () => (
  <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in">
    <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
        <Award className="w-3 h-3 text-primary" />
      </div>
      Research Team
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {researchers.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md flex-shrink-0`}>
            <span className="text-white text-[11px] font-bold">{r.initials}</span>
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground truncate leading-tight">{r.name}</p>
            <p className="text-[10px] text-primary font-medium">{r.role}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
