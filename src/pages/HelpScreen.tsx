import AppLayout from "@/components/AppLayout";
import EmergencyButton from "@/components/EmergencyButton";
import { AlertTriangle, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const HelpScreen = () => {
  const { t } = useTranslation();
  const contacts = t("help.contacts", { returnObjects: true }) as { label: string; number: string; description: string }[];

  return (
    <AppLayout title={t("nav.help")}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warning/5 border border-warning/12">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("help.crisis")}
          </p>
        </div>

        <div className="space-y-2.5">
          {contacts.map((c) => (
            <EmergencyButton key={c.number} label={c.label} number={c.number} description={c.description} />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <Heart size={16} className="text-primary/60 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("help.notAlone")}
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default HelpScreen;
