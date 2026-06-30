import {
  Award,
  Ban,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  History,
  Home,
  Lock,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
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
  close: X,
  edit: Pencil,
  flame: Flame,
  friends: Users,
  gear: Settings,
  heart: Heart,
  history: History,
  lock: Lock,
  logout: LogOut,
  plus: Plus,
  search: Search,
  send: Send,
  trash: Trash2,
  home: Home,
  profile: User,
  share: Share2,
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
