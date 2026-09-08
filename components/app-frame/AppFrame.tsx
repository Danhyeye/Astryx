'use client';

import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import vi from '@astryxdesign/core/locales/vi-VN.json';
import type {ReactNode} from 'react';
import {AppShell, type AppShellProps} from '@astryxdesign/core/AppShell';
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import {usePathname} from 'next/navigation';

import {getAppNavItems, isAppRouteSelected} from './navigation';

export function AppFrame({
  children,
  contentPadding = 0,
}: {
  children: ReactNode;
  contentPadding?: AppShellProps['contentPadding'];
}) {
  const pathname = usePathname();

  return (
    <InternationalizationProvider locale="vi-VN" messages={{'vi-VN': vi}}>
    <AppShell
      height="fill"
      variant="section"
      contentPadding={contentPadding}
      mobileNav={{breakpoint: 'md'}}
      sideNav={
        <SideNav
          aria-label="Điều hướng chính"
          collapsible={{hasButton: false}}
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
  );
}
