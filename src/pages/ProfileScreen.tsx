import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, User, Mail, Shield, ChevronRight, Camera, Heart } from "lucide-react";
import { useMe, useUpdateMe } from "@/hooks/api/useUser";
import { useCurrentStreak } from "@/hooks/api/useStreak";
import { useTranslation } from "react-i18next";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const { data: streak } = useCurrentStreak();

  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState(() => localStorage.getItem("noharm-bio") || "");
  const [dob, setDob] = useState(() => localStorage.getItem("noharm-dob") || "");
  const [reason, setReason] = useState(() => localStorage.getItem("noharm-reason") || "");

  useEffect(() => {
    if (me) {
      setName(me.username ?? "");
      setEmail(me.email ?? "");
    }
  }, [me]);

  const handleSave = () => {
    localStorage.setItem("noharm-bio", bio.trim());
    localStorage.setItem("noharm-dob", dob);
    localStorage.setItem("noharm-reason", reason.trim());
    updateMe.mutate(
      { username: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  const initials = name
    ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const totalDays = streak?.start
    ? Math.floor((Date.now() - new Date(streak.start).getTime()) / 86400000)
    : 0;

  return (
    <AppLayout title="Profile">
      <div className="flex flex-col gap-5 pb-4">
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-primary/[0.04] blur-[60px]" />

          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
              <span className="text-2xl font-black gradient-text">{initials}</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer">
              <Camera size={18} className="text-primary" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">{name || t("profile.yourName")}</h2>
            {bio && <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">{bio}</p>}
          </div>

          <div className="flex gap-6 mt-1">
            <div className="text-center">
              <p className="text-lg font-black gradient-text">{totalDays}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{t("profile.days")}</p>
            </div>
            <div className="w-px bg-border/30" />
            <div className="text-center">
              <p className="text-lg font-black text-success">{Math.floor(totalDays / 7)}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{t("profile.weeks")}</p>
            </div>
            <div className="w-px bg-border/30" />
            <div className="text-center">
              <p className="text-lg font-black text-warning">{Math.floor(totalDays / 30)}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{t("profile.months")}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 space-y-4">
          <h3 className="section-title">{t("profile.personalInfo")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <User size={14} className="text-primary/70" />
              </div>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.username")} maxLength={50}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/20 pb-2 focus:border-primary/30 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Mail size={14} className="text-primary/70" />
              </div>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("profile.email")} maxLength={255}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/20 pb-2 focus:border-primary/30 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 space-y-4">
          <h3 className="section-title">{t("profile.aboutYou")}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold mb-1.5 block uppercase tracking-wider">{t("profile.bio")}</label>
              <textarea
                value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")} maxLength={200} rows={2}
                className="w-full bg-card text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-primary/20 transition-all resize-none border border-border/30"
              />
              <p className="text-[9px] text-muted-foreground/40 text-right mt-0.5">{bio.length}/200</p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">
                <Heart size={10} className="text-destructive" />
                {t("profile.myReason")}
              </label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={t("profile.reasonPlaceholder")} maxLength={300} rows={3}
                className="w-full bg-card text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-primary/20 transition-all resize-none border border-border/30"
              />
              <p className="text-[9px] text-muted-foreground/40 text-right mt-0.5">{reason.length}/300</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden">
          <h3 className="section-title px-5 pt-4 pb-2">{t("profile.settings")}</h3>
          <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-primary/70" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{t("profile.privacy")}</p>
              <p className="text-[10px] text-muted-foreground">{t("profile.controlData")}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/30" />
          </button>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMe.isPending}
          className="w-full rounded-2xl h-11 text-sm font-semibold"
        >
          {saved ? (
            <span className="flex items-center gap-2"><Check size={14} /> {t("profile.saved")}</span>
          ) : updateMe.isPending ? t("profile.saving") : t("profile.saveChanges")}
        </Button>
      </div>
    </AppLayout>
  );
};

export default ProfileScreen;
