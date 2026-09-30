import {
  Award,
  BadgeCheck,
  Ban,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Globe,
  Heart,
  History,
  Home,
  LifeBuoy,
  Lock,
  LogOut,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

const ICONS = {
  back: ChevronLeft,
  badges: Award,
  bell: Bell,
  block: Ban,
  camera: Camera,
  chat: MessageCircle,
  check: Check,
  chevR: ChevronRight,
  community: MessagesSquare,
  crisis: LifeBuoy,
  close: X,
  edit: Pencil,
  flag: Flag,
  flame: Flame,
  friends: Users,
  globe: Globe,
  gear: Settings,
  heart: Heart,
  history: History,
  lock: Lock,
  logout: LogOut,
  more: MoreHorizontal,
  plus: Plus,
  search: Search,
  send: Send,
  trash: Trash2,
  home: Home,
  profile: User,
  share: Share2,
  official: BadgeCheck,
  shield: ShieldCheck,
};

export function Icon({
  name,
  size = 22,
  color = "currentColor",
  sw = 1.8,
  fill = "none",
  style,
}) {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return (
    <Comp
      size={size}
      color={color}
      strokeWidth={sw}
      fill={fill}
      style={{ display: "block", flexShrink: 0, ...style }}
    />
  );
}
