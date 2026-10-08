'use client';

import type {Session} from 'next-auth';
import {signOut} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {LogOut, Settings} from 'lucide-react';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {HStack, VStack, StackItem} from '@astryxdesign/core/Layout';
import {SideNavCollapseButton, useSideNavCollapse} from '@astryxdesign/core/SideNav';
import {Text} from '@astryxdesign/core/Text';
import {Tooltip} from '@astryxdesign/core/Tooltip';

export function SidebarAccount({user}: {user: NonNullable<Session['user']>}) {
  const {isCollapsed} = useSideNavCollapse();
  const router = useRouter();
  const email = user.email ?? '';
  const controls = <>
    <SideNavCollapseButton />
    <Tooltip content="Cài đặt hồ sơ" placement={isCollapsed ? 'end' : 'above'}>
      <IconButton label="Cài đặt hồ sơ" variant="ghost"
        icon={<Icon icon={Settings} />} onClick={() => router.push('/settings/profile')} />
    </Tooltip>
    <Tooltip content="Đăng xuất" placement={isCollapsed ? 'end' : 'above'}>
      <IconButton label="Đăng xuất" variant="ghost"
        icon={<Icon icon={LogOut} />} onClick={() => {void signOut({redirectTo: '/signin'});}} />
    </Tooltip>
  </>;

  return <VStack gap={3} className="w-full" hAlign={isCollapsed ? 'center' : 'stretch'}>
    <HStack gap={2} vAlign="center" hAlign={isCollapsed ? 'center' : 'start'}>
      <Avatar src={user.image ?? undefined} name={user.name || email}
        alt={`Hồ sơ của ${email}`} tooltip={email} size="sm" href="/settings/profile" />
      {!isCollapsed && <StackItem size="fill">
        <Text size="sm" weight="semibold" maxLines={1}>{email}</Text>
      </StackItem>}
    </HStack>
    {isCollapsed ? <VStack gap={1} hAlign="center">{controls}</VStack>
      : <HStack gap={1} hAlign="between">{controls}</HStack>}
  </VStack>;
}
