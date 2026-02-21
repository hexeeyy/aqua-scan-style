import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, History, Maximize, Minimize, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/assets/logo.png";

interface NavbarProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onScanClick?: () => void;
}

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "History", path: "/history", icon: History },
  { label: "About", path: "/about", icon: Users },
];

export const Navbar = ({ isFullscreen, toggleFullscreen, onScanClick }: NavbarProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => setIsAdmin((data ?? []).length > 0));
  }, [user]);

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 shadow-lg backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsl(204, 100%, 61%) 0%, hsl(214, 100%, 50%) 100%)' }}>
      <div className="max-w-5xl mx-auto px-3 py-1.5 flex items-center justify-between">
        {/* Brand */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <img src={Logo} alt="SARI-ONE Logo" className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
          <h1 className="text-base font-bold text-white tracking-tight">SARI-ONE</h1>
        </button>

        {/* Nav Links */}
        <nav className="flex items-center gap-0.5">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300
                  ${isActive
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/20 text-white w-8 h-8" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-red-500/20 text-white/70 hover:text-red-200 w-8 h-8"
            onClick={signOut}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
