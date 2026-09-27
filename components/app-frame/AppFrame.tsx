'use client';

import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import vi from '@astryxdesign/core/locales/vi-VN.json';
import type { ReactNode } from 'react';
import { AppShell, type AppShellProps } from '@astryxdesign/core/AppShell';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import {Divider} from '@astryxdesign/core/Divider';
import { MobileNavToggle } from '@astryxdesign/core/MobileNav';
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import NextLink from 'next/link';
import {LinkProvider} from '@astryxdesign/core/Link';
import { usePathname } from 'next/navigation';

import { Theme } from '@astryxdesign/core/theme';
import { matchaTheme } from '@/src/themes/matcha/matcha';
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
    <Theme theme={matchaTheme} mode="system">
      <InternationalizationProvider locale="vi-VN" messages={{ 'vi-VN': vi }}>
        <LinkProvider component={NextLink}>
        <AppShell
          className="max-md:[&_.astryx-app-shell-sidenav]:hidden!"
          height="fill"
          variant="section"
          contentPadding={contentPadding}
          mobileNav={{ breakpoint: 'md', hasToggle: false }}
          banner={
            <VStack gap={0} className="md:hidden!">
              <HStack hAlign="end" padding={2}>
                <MobileNavToggle />
              </HStack>
              <Divider />
            </VStack>
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
        </LinkProvider>
      </InternationalizationProvider>
    </Theme>
  );
}
