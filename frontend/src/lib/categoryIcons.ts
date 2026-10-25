import {
  Utensils, ShoppingCart, Car, Home, BookOpen, Film, ShoppingBag, Lightbulb,
  Stethoscope, Smartphone, Plane, Dumbbell, Gift, Package, DollarSign,
  GraduationCap, Briefcase, Users, Laptop, TrendingUp, Wallet, Tag
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': Utensils,
  'Groceries': ShoppingCart,
  'Transportation': Car,
  'Rent & Accommodation': Home,
  'Education': BookOpen,
  'Entertainment': Film,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Lightbulb,
  'Healthcare': Stethoscope,
  'Subscriptions': Smartphone,
  'Travel': Plane,
  'Fitness & Gym': Dumbbell,
  'Gifts & Donations': Gift,
  'Others': Package,
  'Salary': DollarSign,
  'Scholarship': GraduationCap,
  'Internship Stipend': Briefcase,
  'Family Allowance': Users,
  'Freelancing': Laptop,
  'Investments': TrendingUp,
  'Gifts Received': Gift,
  'Other Income': Wallet,
};

export function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || Tag;
}
