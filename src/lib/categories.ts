import { Wrench, Zap, Hammer, Sparkles, type LucideIcon } from "lucide-react";

export type CategorySlug = "plumber" | "electrician" | "handyman" | "cleaner";

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  plural: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "plumber",
    label: "Plumber",
    plural: "Plumbers",
    description: "Leaks, installs, drains",
    icon: Wrench,
    tone: "from-blue-500/20 to-blue-500/5",
  },
  {
    slug: "electrician",
    label: "Electrician",
    plural: "Electricians",
    description: "Wiring, fixtures, panels",
    icon: Zap,
    tone: "from-accent/30 to-accent/5",
  },
  {
    slug: "handyman",
    label: "Handyman",
    plural: "Handymen",
    description: "Repairs, mounting, assembly",
    icon: Hammer,
    tone: "from-amber-500/20 to-amber-500/5",
  },
  {
    slug: "cleaner",
    label: "Cleaner",
    plural: "Cleaners",
    description: "Deep, regular, move-out",
    icon: Sparkles,
    tone: "from-emerald-500/20 to-emerald-500/5",
  },
];

export const getCategory = (slug: string): CategoryDef | undefined =>
  CATEGORIES.find((c) => c.slug === slug);
