import { useState } from "react";
import { Home, Users, BarChart3, MessageCircle, Phone, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import GeometricBg from "./GeometricBg";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Phone, label: "Help", path: "/help" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const AppLayout = ({ title, children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName] = useState(() => localStorage.getItem("noharm-name") || "");

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-24">
      <GeometricBg />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 bg-background/70 backdrop-blur-2xl z-30 border-b border-border/10">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
          {userName && location.pathname === "/" && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {getGreeting()}, <span className="gradient-text font-semibold">{userName}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center text-primary/80 hover:bg-primary/15 hover:text-primary transition-all duration-200"
        >
          <UserCircle size={20} />
        </button>
      </header>

      <main className="px-5 py-5 relative z-10">{children}</main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <div className="mx-3 mb-3 rounded-2xl bg-card/80 backdrop-blur-2xl border border-border/30 shadow-2xl shadow-background/80">
          <div className="flex items-center justify-around py-1.5 px-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${active ? "bg-primary/10" : ""}`}>
                    <item.icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                  </div>
                  <span className={active ? "font-semibold" : ""}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
