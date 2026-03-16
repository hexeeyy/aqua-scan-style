import { useState, useEffect } from "react";
import splashLogo from "@/assets/logo.png";

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
      className={`fixed inset-0 z-[100] flex items-center justify-center gpu-accelerated ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "hsl(204, 100%, 61%)",
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12)_0%,_transparent_70%)]" />

      <div className="relative flex flex-col items-center gap-5 animate-scale-in">
        {/* Logo icon */}
        <div className="w-20 h-20 flex items-center justify-center">
          <img src={splashLogo} className="w-20 h-20" fetchPriority="high" decoding="sync" />
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
