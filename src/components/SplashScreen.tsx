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
        <div className="w-20 h-20 flex items-center justify-center">
          <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer rounded square shield */}
            <rect x="5" y="5" width="90" height="90" rx="22" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="4" strokeOpacity="0.5"/>
            {/* Inner pinched star/cushion shape */}
            <path 
              d="M50 12 C60 30, 88 30, 88 50 C88 70, 60 70, 50 88 C40 70, 12 70, 12 50 C12 30, 40 30, 50 12Z" 
              fill="white" 
              fillOpacity="0.9"
            />
            {/* Inner cutout to create the hollow effect */}
            <path 
              d="M50 28 C56 38, 72 38, 72 50 C72 62, 56 62, 50 72 C44 62, 28 62, 28 50 C28 38, 44 38, 50 28Z" 
              fill="hsl(204, 100%, 61%)"
            />
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
