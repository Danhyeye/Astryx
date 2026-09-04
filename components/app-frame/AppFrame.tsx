'use client';

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
    <AppShell
      height="fill"
      variant="section"
      contentPadding={contentPadding}
      mobileNav={{breakpoint: 'md'}}
      sideNav={
        <SideNav
          aria-label="Primary navigation"
          collapsible={{hasButton: false}}
          header={
            <SideNavHeading
              heading="Land Manager"
              headingHref="/dashboard"
              subheading="Portfolio workspace"
            />
          }
          footerIcons={<SideNavCollapseButton />}>
          <SideNavSection title="Main" isHeaderHidden>
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
  );
}
