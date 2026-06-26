import {
  ChevronLeft, Award, Bell, Ban, Camera, MessageCircle,
  Check, ChevronRight, X, Pencil, Flame, Users, Settings,
  Heart, History, Lock, LogOut, Plus, Search, Send, Trash2,
  Home, User, Share2,
} from 'lucide-react'

const ICONS = {
  back:    ChevronLeft,
  badges:  Award,
  bell:    Bell,
  block:   Ban,
  camera:  Camera,
  chat:    MessageCircle,
  check:   Check,
  chevR:   ChevronRight,
  close:   X,
  edit:    Pencil,
  flame:   Flame,
  friends: Users,
  gear:    Settings,
  heart:   Heart,
  history: History,
  lock:    Lock,
  logout:  LogOut,
  plus:    Plus,
  search:  Search,
  send:    Send,
  trash:   Trash2,
  home:    Home,
  profile: User,
  share:   Share2,
}

export function Icon({ name, size = 22, color = 'currentColor', sw = 1.8, fill = 'none', style }) {
  const Comp = ICONS[name]
  if (!Comp) return null
  return <Comp size={size} color={color} strokeWidth={sw} fill={fill} style={{ display: 'block', flexShrink: 0, ...style }} />
}
