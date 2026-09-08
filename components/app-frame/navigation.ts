import {DATASET_META} from '@/data';
import {
  Users,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Map,
  type LucideIcon,
} from 'lucide-react';

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard},
  {label: DATASET_META.lands.label, href: DATASET_META.lands.href, icon: Map},
  {label: DATASET_META.plots.label, href: DATASET_META.plots.href, icon: LayoutGrid},
  {label: DATASET_META.contracts.label, href: DATASET_META.contracts.href, icon: FileText},
  {label: DATASET_META.customers.label, href: DATASET_META.customers.href, icon: Users},
  {label: 'Lịch thanh toán', href: '/calendar', icon: CalendarDays},
];

export function getAppNavItems(): readonly AppNavItem[] {
  return APP_NAV_ITEMS;
}

export function isAppRouteSelected(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
