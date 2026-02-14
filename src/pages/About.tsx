import { useEffect, useRef, useState, useCallback } from "react";
import { Award, GraduationCap, Target, Lightbulb } from "lucide-react";
import gsap from "gsap";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".about-card", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from(".researcher-card", {
        scale: 0.85,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.3,
        ease: "back.out(1.7)",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
      <div ref={containerRef} className="max-w-5xl mx-auto px-3 py-3 space-y-3 flex-1 w-full">
        {/* Mission & Vision */}
        <div className="grid grid-cols-2 gap-2.5">
          <section className="about-card glass-effect rounded-xl p-3 border border-border/50 shadow-md">
            <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <Target className="w-3 h-3 text-primary" />
              </div>
              Mission
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              To develop an AI-powered fish freshness assessment system that empowers consumers and vendors 
              with instant, accurate quality analysis using computer vision and machine learning.
            </p>
          </section>
          <section className="about-card glass-effect rounded-xl p-3 border border-border/50 shadow-md">
            <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <Lightbulb className="w-3 h-3 text-primary" />
              </div>
              Vision
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              A future where every Filipino household and wet market vendor can verify fish quality in seconds, 
              reducing food waste and ensuring food safety nationwide.
            </p>
          </section>
        </div>

        {/* About the Project */}
        <section className="about-card glass-effect rounded-xl p-3 border border-border/50 shadow-md">
          <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-primary" />
            </div>
            About the Project
          </h3>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            SARI-ONE (Species Analysis & Recognition Intelligence - ONE) is a capstone project developed at the 
            <strong className="text-foreground"> University of Rizal System</strong>, College of Engineering, 
            under the Bachelor of Science in Computer Engineering program. The system leverages AI-based image analysis 
            to identify fish species and assess freshness levels in real-time.
          </p>
        </section>

        {/* Research Team */}
        <section className="about-card glass-effect rounded-xl p-3 border border-border/50 shadow-md">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <Award className="w-3 h-3 text-primary" />
            </div>
            Research Team
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {researchers.map((r) => (
              <div
                key={r.name}
                className="researcher-card flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <span className="text-white text-[11px] font-bold">{r.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-foreground truncate leading-tight">{r.name}</p>
                  <p className="text-[10px] text-primary font-medium">{r.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default About;
