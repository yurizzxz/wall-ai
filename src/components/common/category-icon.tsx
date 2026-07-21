import {
  BriefcaseBusiness,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  PawPrint,
  Plane,
  ReceiptText,
  Shapes,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { isCategoryIconName, type CategoryIconName } from "@/lib/category-icons";

const CATEGORY_ICONS = {
  shapes: Shapes,
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  house: House,
  car: Car,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  shirt: Shirt,
  "gamepad-2": Gamepad2,
  "receipt-text": ReceiptText,
  "circle-dollar-sign": CircleDollarSign,
  "briefcase-business": BriefcaseBusiness,
  "chart-no-axes-combined": ChartNoAxesCombined,
  gift: Gift,
  plane: Plane,
  "paw-print": PawPrint,
  wrench: Wrench,
  smartphone: Smartphone,
} satisfies Record<CategoryIconName, LucideIcon>;

type CategoryIconProps = {
  name?: string;
  className?: string;
};

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = name && isCategoryIconName(name) ? CATEGORY_ICONS[name] : Shapes;
  return <Icon className={className} aria-hidden="true" />;
}
