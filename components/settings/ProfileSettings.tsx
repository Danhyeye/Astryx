'use client';

import {useState} from 'react';
import type {Session} from 'next-auth';
import {useQuery} from '@tanstack/react-query';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Divider} from '@astryxdesign/core/Divider';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack, StackItem, Layout, LayoutHeader, LayoutContent} from '@astryxdesign/core/Layout';
import {List, ListItem} from '@astryxdesign/core/List';
import {Pagination} from '@astryxdesign/core/Pagination';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Table, proportional, type TableColumn} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import type {AppUser, AppUsersResponse} from '@/types/app-user';

const PAGE_SIZE = 20;
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
const addedDate = (date: string) => dateFormatter.format(new Date(date));

function AccessStatus({active}: {active: boolean}) {
  const label = active ? 'Được đăng nhập' : 'Đã tắt truy cập';
  return <HStack gap={2} vAlign="center">
    <StatusDot variant={active ? 'success' : 'neutral'} label={label} />
    <Text>{label}</Text>
  </HStack>;
}

export function ProfileSettings({user}: {user: NonNullable<Session['user']>}) {
  const [page, setPage] = useState(1);
  const isWide = useMediaQuery('(min-width: 768px)');
  const query = useQuery({
    queryKey: ['appUsers', page],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({signal}): Promise<AppUsersResponse> => {
      const response = await fetch(`/api/users?page=${page}&pageSize=${PAGE_SIZE}`, {signal});
      if (!response.ok) throw new Error('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
      return response.json();
    },
  });
  const columns: TableColumn<AppUser>[] = [
    {key: 'email', header: 'Email', width: proportional(3), renderCell: row =>
      <VStack gap={1}>
        <Text className="wrap-anywhere">{row.email}</Text>
        {row.email === user.email?.toLowerCase() && <Text size="sm" color="secondary">Tài khoản của bạn</Text>}
      </VStack>},
    {key: 'is_active', header: 'Quyền truy cập', width: proportional(2), renderCell: row => <AccessStatus active={row.is_active} />},
    {key: 'created_at', header: 'Ngày thêm', width: proportional(1), renderCell: row => addedDate(row.created_at)},
  ];

  return <Layout contentWidth={960} padding={5}
    header={<LayoutHeader hasDivider><Heading level={1}>Cài đặt hồ sơ</Heading></LayoutHeader>}
    content={<LayoutContent label="Hồ sơ và tài khoản truy cập"><VStack gap={8}>
      <HStack gap={4} vAlign="center">
        <Avatar src={user.image ?? undefined} name={user.name || user.email || 'Tài khoản'} size="lg" />
        <StackItem size="fill"><VStack gap={1}>
          <Heading level={2}>{user.name || 'Tài khoản của bạn'}</Heading>
          <Text className="wrap-anywhere">{user.email}</Text>
          <Text color="secondary">Đăng nhập bằng Google</Text>
        </VStack></StackItem>
      </HStack>
      <Divider />
      <VStack gap={4}>
        <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
          <Heading level={2}>Tài khoản được cấp quyền</Heading>
          <Button label="Làm mới" variant="secondary" isLoading={query.isFetching}
            onClick={() => {void query.refetch();}} />
        </HStack>
        <Text color="secondary">Chỉ tài khoản có quyền truy cập đang bật mới được đăng nhập và sử dụng ứng dụng.</Text>
        {query.isPending ? <Text role="status">Đang tải danh sách tài khoản…</Text>
          : query.isError ? <Banner status="error" title="Không thể tải tài khoản" description={query.error.message}
            endContent={<Button label="Thử lại" onClick={() => {void query.refetch();}} />} />
          : <>
            <Text weight="semibold" role="status">
              {query.data.activeCount} tài khoản được đăng nhập · {query.data.disabledCount} tài khoản đã tắt · {query.data.total} tổng cộng
            </Text>
            {query.data.data.length === 0 ? <Text>Không có tài khoản trong trang này.</Text>
              : isWide ? <Table data={query.data.data} columns={columns} idKey="email" hasHover
                rowCount={query.data.total} rowIndexStart={(page - 1) * PAGE_SIZE + 1} />
                : <List aria-label="Danh sách tài khoản" hasDividers>
                  {query.data.data.map(row => <ListItem key={row.email} label={row.email}
                    description={<VStack gap={2}>
                      <AccessStatus active={row.is_active} />
                      <Text size="sm" color="secondary">Ngày thêm: {addedDate(row.created_at)}</Text>
                    </VStack>} />)}
                </List>}
            {query.data.total > PAGE_SIZE && <Pagination label="Phân trang tài khoản" page={page}
              pageSize={PAGE_SIZE} totalItems={query.data.total} onChange={setPage} />}
          </>}
        <Text size="sm" color="secondary">Danh sách chỉ để xem. Liên hệ người quản lý để thêm tài khoản hoặc thay đổi quyền truy cập.</Text>
      </VStack>
    </VStack></LayoutContent>} />;
}
