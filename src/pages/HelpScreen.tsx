import AppLayout from "@/components/AppLayout";
import EmergencyButton from "@/components/EmergencyButton";
import { AlertTriangle, Heart } from "lucide-react";

const HelpScreen = () => (
  <AppLayout title="Emergency Help">
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warning/5 border border-warning/12">
        <AlertTriangle size={16} className="text-warning shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          If you're in crisis, don't hesitate to reach out. Help is available 24/7.
        </p>
      </div>

      <div className="space-y-2.5">
        <EmergencyButton label="SAMHSA Helpline" number="1-800-662-4357" description="Free, 24/7 treatment referral" />
        <EmergencyButton label="Crisis Lifeline" number="988" description="Suicide & crisis support" />
        <EmergencyButton label="Crisis Text Line" number="741741" description="Text HOME to connect" />
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <Heart size={16} className="text-primary/60 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          You're not alone. Every step forward matters.
        </p>
      </div>
    </div>
  </AppLayout>
);

export default HelpScreen;
