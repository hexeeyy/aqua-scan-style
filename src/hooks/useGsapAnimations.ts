import { useEffect, useRef } from "react";
import gsap from "gsap";

// Firefox-optimized GSAP defaults
const ffDefaults = { force3D: true, clearProps: "transform" };

export const useGsapDashboard = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".gsap-hero", {
        x: -60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        ...ffDefaults,
      });
      gsap.from(".gsap-scan-area", {
        x: 60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        ...ffDefaults,
      });
      gsap.from(".gsap-panel", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.3,
        ease: "power2.out",
        ...ffDefaults,
      });
      gsap.from(".gsap-chart", {
        scale: 0.9,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.55,
        ease: "back.out(1.4)",
        ...ffDefaults,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return ref;
};

export const useGsapResults = (active: boolean) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".gsap-result", {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: "power3.out",
        force3D: true,
        clearProps: "all",
      });
    }, ref);
    return () => ctx.revert();
  }, [active]);

  return ref;
};
