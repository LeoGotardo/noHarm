import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const QuoteCard = () => {
  const { t } = useTranslation();
  const quotes = t("quotes", { returnObjects: true }) as { text: string; author: string }[];
  const today = new Date().getDay();
  const quote = quotes[today % quotes.length];

  return (
    <div className="glass-card rounded-3xl p-5 relative overflow-hidden shimmer">
      <div className="absolute top-3 right-4 opacity-[0.04]">
        <Quote size={64} />
      </div>
      <div className="flex items-start gap-3.5 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Quote size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-foreground/90 text-[13px] leading-relaxed italic font-light">{quote.text}</p>
          <p className="text-muted-foreground text-[11px] mt-2.5 font-medium">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
