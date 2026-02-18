import { useEffect, useRef, useState, useCallback } from "react";
import { Award, GraduationCap, Target, Lightbulb } from "lucide-react";
import gsap from "gsap";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import teamMark from "@/assets/team-mark.jpg";
import teamTrisha from "@/assets/team-trisha.jpg";
import teamYvan from "@/assets/team-yvan.jpg";
import teamPhilip from "@/assets/team-philip.jpg";

interface Researcher {
  name: string;
  role: string;
  color: string;
  photo: string;
  bio: string;
  focus: string;
}

const researchers: Researcher[] = [
  {
    name: "Mark Hexilon Payno",
    role: "Lead Researcher",
    color: "from-primary to-blue-600",
    photo: teamMark,
    bio: "Oversees the entire SARI-ONE project, coordinating research methodology, team deliverables, and stakeholder communications with BFAR.",
    focus: "Project Management • Research Design • AI Strategy",
  },
  {
    name: "Trisha Tumbagahan",
    role: "Data Analyst",
    color: "from-violet-500 to-purple-600",
    photo: teamTrisha,
    bio: "Handles dataset curation, statistical modeling, and performance benchmarking of the CNN classification and freshness regression models.",
    focus: "Data Preprocessing • Model Evaluation • Statistical Analysis",
  },
  {
    name: "Yvan Joaquin Aquino",
    role: "Marine Biologist",
    color: "from-emerald-500 to-teal-600",
    photo: teamYvan,
    bio: "Provides domain expertise on Philippine fish species taxonomy, freshness indicators, and sustainable fisheries practices aligned with UN SDG 14.",
    focus: "Species Taxonomy • Freshness Science • Sustainability",
  },
  {
    name: "Philip Inigo Lenida",
    role: "Software Engineer",
    color: "from-amber-500 to-orange-600",
    photo: teamPhilip,
    bio: "Architects and develops the SARI-ONE web platform, integrating real-time computer vision pipelines with the deep learning inference backend.",
    focus: "Full-Stack Development • Computer Vision • System Architecture",
  },
];

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const el = document.fullscreenElement || (document as any).mozFullScreenElement || (document as any).webkitFullscreenElement;
    if (!el) {
      const rfs = document.documentElement.requestFullscreen || (document.documentElement as any).mozRequestFullScreen || (document.documentElement as any).webkitRequestFullscreen;
      rfs?.call(document.documentElement).then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      const efs = document.exitFullscreen || (document as any).mozCancelFullScreen || (document as any).webkitExitFullscreen;
      efs?.call(document).then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).mozFullScreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
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
            <p className="text-[10px] text-muted-foreground leading-relaxed text-justify">
              To develop and deploy SARI-ONE, an advanced Artificial Intelligence system that accurately 
              classifies fish species and assesses freshness levels in real time using computer vision 
              and deep learning. 
              <br /><br />
              The system empowers fish vendors, consumers, and 
              the Bureau of Fisheries and Aquatic Resources (BFAR) in the Rizal region—and across 
              the Philippines—with reliable, instant quality insights to strengthen food safety, 
              reduce post-harvest losses, and promote sustainable fisheries management in direct alignment 
              with UN Sustainable Development Goals 2 (Zero Hunger), 3 (Good Health and Well-being), 
              12 (Responsible Consumption and Production), and 14 (Life Below Water).
            </p>
          </section>
          <section className="about-card glass-effect rounded-xl p-3 border border-border/50 shadow-md">
            <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <Lightbulb className="w-3 h-3 text-primary" />
              </div>
              Vision
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed text-justify">
             We envision a Philippines where every wet market vendor, household consumer, 
             and BFAR officer can instantly and accurately verify fish species and freshness with a single tap using accessible, AI-powered technology.
            <br /><br />
             Driven by SARI-ONE, this future will dramatically reduce post-harvest food waste, 
             protect public health from spoiled fish, guarantee full supply-chain traceability, 
             and promote responsible and sustainable fisheries management — building a resilient, 
             thriving blue economy that begins in Rizal and extends across the entire nation, 
             while directly advancing the United Nations Sustainable Development Goals 2 (Zero Hunger), 
             3 (Good Health and Well-being), 12 (Responsible Consumption and Production), and 14 (Life Below Water).
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
            <p className="text-[10px] text-muted-foreground leading-relaxed text-justify">
             SARI-ONE (Species Analysis &amp; Recognition Intelligence - ONE) is a capstone project developed by senior Computer Engineering students at the <strong className="text-foreground">University of Rizal System</strong>, College of Engineering. The system integrates state-of-the-art deep learning models (CNN-based classification for species and regression models for freshness scoring) with real-time computer vision to analyze fish images captured via mobile or web cameras.
            <br /><br />
              Designed specifically for the Philippine context, SARI-ONE addresses key challenges in the fisheries value chain: accurate species identification (critical for pricing and regulation), objective freshness assessment (to prevent foodborne illness), and data-driven support for BFAR’s monitoring efforts in the Rizal region. The platform will ultimately provide vendors with better inventory and pricing tools, consumers with confidence in their purchases, and BFAR with actionable regional insights for sustainable fisheries governance.
            </p>
            <p className="text-[8px] text-primary/80 pt-2 border-t border-border/50">
              Aligned with UN SDGs 2, 3, 12 &amp; 14 • Focused on Rizal Region &amp; National Impact
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
          <div className="grid grid-cols-2 gap-2.5">
            {researchers.map((r) => (
              <div
                key={r.name}
                className="researcher-card flex flex-col p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <img src={r.photo} alt={r.name} className="w-12 h-12 rounded-xl object-cover shadow-md flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate leading-tight">{r.name}</p>
                    <p className="text-[10px] text-primary font-medium">{r.role}</p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{r.bio}</p>
                <p className="text-[8px] text-primary/70 font-medium mt-1.5 pt-1.5 border-t border-border/30">{r.focus}</p>
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
