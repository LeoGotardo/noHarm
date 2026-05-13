import { MessageCircle } from "lucide-react";

interface FriendCardProps {
  name: string;
  avatar: string;
  online: boolean;
  streak: number;
  onChat: () => void;
}

const FriendCard = ({ name, avatar, online, streak, onChat }: FriendCardProps) => (
  <div className="flex items-center gap-3.5 glass-card rounded-2xl p-3.5 card-hover">
    <div className="relative">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary/80">
        {avatar}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${online ? "bg-success" : "bg-muted-foreground/30"}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
      <p className="text-[11px] text-muted-foreground">{streak} days</p>
    </div>
    <button onClick={onChat} className="w-8 h-8 rounded-lg bg-primary/8 hover:bg-primary/15 text-primary/70 hover:text-primary flex items-center justify-center transition-all duration-200">
      <MessageCircle size={15} />
    </button>
  </div>
);

export default FriendCard;
