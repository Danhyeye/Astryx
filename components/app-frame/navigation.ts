import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Map,
  type LucideIcon,
} from 'lucide-react';

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
  {label: 'Lands', href: '/lands', icon: Map},
  {label: 'Contracts', href: '/contracts', icon: FileText},
  {label: 'Calendar', href: '/calendar', icon: CalendarDays},
];

export function getAppNavItems(): readonly AppNavItem[] {
  return APP_NAV_ITEMS;
}

export function isAppRouteSelected(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
