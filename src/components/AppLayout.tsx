import { useState } from "react";
import { Home, Users, BarChart3, MessageCircle, Phone, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GeometricBg from "./GeometricBg";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "greeting.morning";
  if (h < 18) return "greeting.afternoon";
  return "greeting.evening";
}

const AppLayout = ({ title, children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [userName] = useState(() => localStorage.getItem("noharm-name") || "");

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Users, label: t("nav.friends"), path: "/friends" },
    { icon: BarChart3, label: t("nav.progress"), path: "/progress" },
    { icon: MessageCircle, label: t("nav.chat"), path: "/chat" },
    { icon: Phone, label: t("nav.help"), path: "/help" },
  ];

  const toggleLang = () => {
    const next = i18n.language === "pt" ? "en" : "pt";
    i18n.changeLanguage(next);
    localStorage.setItem("noharm-lang", next);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-24">
      <GeometricBg />

      <header className="flex items-center justify-between px-6 py-4 sticky top-0 bg-background/70 backdrop-blur-2xl z-30 border-b border-border/10">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
          {userName && location.pathname === "/" && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t(getGreetingKey())}, <span className="gradient-text font-semibold">{userName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="w-9 h-9 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center text-[11px] font-bold text-primary/80 hover:bg-primary/15 hover:text-primary transition-all duration-200"
          >
            {i18n.language === "pt" ? "EN" : "PT"}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center text-primary/80 hover:bg-primary/15 hover:text-primary transition-all duration-200"
          >
            <UserCircle size={20} />
          </button>
        </div>
      </header>

      <main className="px-5 py-5 relative z-10">{children}</main>

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
