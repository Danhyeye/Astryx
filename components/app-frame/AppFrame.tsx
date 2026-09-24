'use client';

import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import vi from '@astryxdesign/core/locales/vi-VN.json';
import type { ReactNode } from 'react';
import { AppShell, type AppShellProps } from '@astryxdesign/core/AppShell';
import { HStack } from '@astryxdesign/core/Layout';
import { MobileNavToggle } from '@astryxdesign/core/MobileNav';
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import { usePathname } from 'next/navigation';

import { Theme } from '@astryxdesign/core/theme';
import { workspaceTheme } from '@/theme/workspace';
import { getAppNavItems, isAppRouteSelected } from './navigation';

export function AppFrame({
  children,
  contentPadding = 0,
}: {
  children: ReactNode;
  contentPadding?: AppShellProps['contentPadding'];
}) {
  const pathname = usePathname();

  return (
    <Theme theme={workspaceTheme} mode="system">
      <InternationalizationProvider locale="vi-VN" messages={{ 'vi-VN': vi }}>
        <AppShell
          className="max-md:[&_.astryx-app-shell-sidenav]:hidden!"
          height="fill"
          variant="section"
          contentPadding={contentPadding}
          mobileNav={{ breakpoint: 'md', hasToggle: false }}
          banner={
            <HStack hAlign="end" className="border-b border-border p-2 md:hidden!">
              <MobileNavToggle />
            </HStack>
          }
          sideNav={
            <SideNav
              aria-label="Điều hướng chính"
              collapsible={{ hasButton: false }}
              header={
                <SideNavHeading
                  heading="Quản lý đất đai"
                  headingHref="/dashboard"
                  subheading="Không gian quản lý"
                />
              }
              footerIcons={<SideNavCollapseButton />}>
              <SideNavSection title="Chính" isHeaderHidden>
                {getAppNavItems().map(item => (
                  <SideNavItem
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    isSelected={isAppRouteSelected(pathname, item.href)}
                  />
                ))}
              </SideNavSection>
            </SideNav>
          }>
          {children}
        </AppShell>
      </InternationalizationProvider>
    </Theme>
  );
}
