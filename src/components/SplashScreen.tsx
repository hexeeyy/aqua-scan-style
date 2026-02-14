import { useState, useEffect } from "react";
import splashBg from "@/assets/splash-bg.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2200);
    const completeTimer = setTimeout(onComplete, 2800);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "hsl(204, 100%, 61%)" }}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12)_0%,_transparent_70%)]" />

      <div className="relative flex flex-col items-center gap-5 animate-scale-in">
        {/* Logo icon */}
        <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C24 4 10 10 10 24C10 38 24 44 24 44C24 44 38 38 38 24C38 10 24 4 24 4Z" fill="white" fillOpacity="0.9"/>
            <path d="M24 8C24 8 14 13 14 24C14 35 24 40 24 40" stroke="white" strokeWidth="2" strokeLinecap="round" fillOpacity="0"/>
            <path d="M24 8C24 8 34 13 34 24C34 35 24 40 24 40" stroke="white" strokeWidth="2" strokeLinecap="round" fillOpacity="0"/>
            <path d="M12 20H36M12 28H36" stroke="hsl(204, 100%, 61%)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">
            SARI-ONE
          </h1>
          <p className="text-white/80 text-xs font-medium tracking-[0.2em] uppercase mt-1">
            Know the Species. Check the Freshness. All in One.
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-40 h-1 rounded-full bg-white/20 overflow-hidden mt-3">
          <div className="h-full bg-white rounded-full animate-[splash-load_2s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
};
