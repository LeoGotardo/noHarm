import { Phone } from "lucide-react";

interface EmergencyButtonProps {
  label: string;
  number: string;
  description: string;
}

const EmergencyButton = ({ label, number, description }: EmergencyButtonProps) => (
  <a
    href={`tel:${number}`}
    className="flex items-center gap-4 glass-card border-warning/15 rounded-2xl p-4 hover:border-warning/30 transition-all duration-200 card-hover"
  >
    <div className="w-11 h-11 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0">
      <Phone className="text-warning" size={18} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      <p className="text-sm font-bold text-warning mt-1">{number}</p>
    </div>
  </a>
);

export default EmergencyButton;
