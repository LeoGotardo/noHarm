import { Quote } from "lucide-react";

const quotes = [
  { text: "Every clean day is a victory.", author: "Anonymous" },
  { text: "Courage is not the absence of fear, but the decision that something is more important.", author: "Ambrose Redmoon" },
  { text: "You are stronger than you think.", author: "Anonymous" },
  { text: "One step at a time.", author: "Proverb" },
  { text: "Recovery is a journey, not a destination.", author: "Anonymous" },
];

const QuoteCard = () => {
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
