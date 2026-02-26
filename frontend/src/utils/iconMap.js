import {
  Printer,
  Sticker,
  Shirt,
  Palette,
  Globe,
  Truck,
  Award,
  Users,
  Zap,
  DollarSign,
  Music,
  Monitor,
  Scissors,
  Search,
} from 'lucide-react';

const iconMap = {
  Printer, Sticker, Shirt, Palette, Globe,
  Truck, Award, Users, Zap, DollarSign,
  Music, Monitor, Scissors, Search,
};

export function getIcon(name) {
  return iconMap[name] || Globe;
}
