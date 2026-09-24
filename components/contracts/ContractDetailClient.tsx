'use client';

import {EntityStatus} from '@/components/table-filter/EntityStatus';

import {ContractPayments} from './ContractPayments';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {UploadContractFilesDialog} from './UploadContractFilesDialog';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, Layout, LayoutHeader, LayoutContent, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { useContractDetail, useUpdateContract } from '@/hooks/useContract';
import { useAllCustomers, useAllLands, useAllPlots } from '@/hooks/useAllRecords';
import { buildContractRows, CONTRACT_STATUS_META, PAYMENT_FREQUENCY_META } from '@/data';
import { EditContractDialog } from '@/components/table-filter/EditContractDialog';
import {Selector} from '@astryxdesign/core/Selector';
import type {ContractStatus} from '@/types/contract';
import { fetchContractFiles, deleteContractFile, type ContractFile } from '@/lib/api/fetchContractFiles';
import { resolveContractEndDate, isPendingStartDateValid } from '@/lib/contractDates';
import { formatDate, formatMoney, formatArea } from '@/utils/format';

export function ContractDetailClient({ id }: { id: string }) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const query = useContractDetail(id);
  const updateStatus = useUpdateContract();
  const contract = query.data?.data;
  const filesQuery = useQuery({ queryKey: ['contractFiles', id], queryFn: () => fetchContractFiles(id), enabled: !!contract });
  const customers = useAllCustomers();
  const lands = useAllLands();
  const plots = useAllPlots();
  const [removingFile, setRemovingFile] = useState<ContractFile | null>(null);
  const removeFile = useMutation({
    mutationFn:(file:ContractFile)=>deleteContractFile(id,file.path),
    onSuccess:()=>{
      setRemovingFile(null);
      void filesQuery.refetch();
    },
  });
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const row = contract ? buildContractRows([contract])[0] : null;
  if (query.isPending) return <ContractDetailSkeleton isWide={isWide} />;
  if (!contract || !row) return <Section><Banner status="error" title="Không thể tải hợp đồng" description={query.error?.message ?? 'Không tìm thấy hợp đồng.'} /><Link href="/contracts">Danh sách hợp đồng</Link></Section>;
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const customer = contract.customers[0];
  const end = resolveContractEndDate({ startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months });
  return <>
    <Layout height="fill" padding={isWide ? 5 : 3} contentWidth="fill"
      header={<LayoutHeader label="Chi tiết hợp đồng">
        <VStack gap={3}>
          <Link href="/contracts">Danh sách hợp đồng</Link>
          <HStack gap={3} vAlign="center" wrap="wrap">
            <StackItem size="fill"><Heading level={1}>{row.summary}</Heading></StackItem>
            <Selector
              label="Trạng thái hợp đồng"
              isLabelHidden
              value={contract.status}
              renderValue={() => <EntityStatus label={CONTRACT_STATUS_META[contract.status].label} variant={CONTRACT_STATUS_META[contract.status].badge} />}
              options={(Object.keys(CONTRACT_STATUS_META) as ContractStatus[]).map(status => ({
                value: status,
                label: CONTRACT_STATUS_META[status].label,
                disabled: !isPendingStartDateValid(status, contract.start_date),
                description: !isPendingStartDateValid(status, contract.start_date)
                  ? 'Ngày bắt đầu phải ở tương lai. Hãy chỉnh sửa thời hạn hợp đồng trước.'
                  : undefined,
              }))}
              isDisabled={updateStatus.isPending || editing}
              isLoading={updateStatus.isPending}
              onChange={status => {
                if (status !== contract.status && !updateStatus.isPending) {
                  updateStatus.mutate({id, data: {status: status as ContractStatus}}, {
                    onSuccess: async () => { await query.refetch(); },
                  });
                }
              }}
            />
            <Button label="Chỉnh sửa hợp đồng" isDisabled={updateStatus.isPending} onClick={() => setEditing(true)} />
          </HStack>
          {updateStatus.error && <Banner status="error" title="Không thể đổi trạng thái hợp đồng" description={updateStatus.error.message} />}
        </VStack>
      </LayoutHeader>}
      content={<LayoutContent padding={isWide ? 5 : 3} label="Thông tin hợp đồng">
        <VStack gap={5}>
          <Grid columns={isWide ? 2 : 1} gap={5}>
            <Card padding={isWide ? 5 : 3} height="100%"><VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting" color="secondary">BÊN THUÊ</Text>
                <Heading level={3}>Khách hàng</Heading>
                <Text type="large" weight="semibold">{customer?.name ?? 'Chưa có khách hàng'}</Text>
              </VStack>
              <MetadataList>
                <MetadataListItem label="Điện thoại">{customer?.phone || '—'}</MetadataListItem>
                <MetadataListItem label="Email"><Text wordBreak="break-word">{customer?.email || '—'}</Text></MetadataListItem>
              </MetadataList>
              {customer && <Link href={'/customers?selected=' + customer.id}>Xem khách hàng</Link>}
            </VStack></Card>
            <Card padding={isWide ? 5 : 3} height="100%"><VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting" color="secondary">TÀI SẢN CHO THUÊ</Text>
                <Heading level={2}>Khu đất</Heading>
                <Text type="large" weight="semibold">{land?.name ?? 'Chưa có khu đất'}</Text>
              </VStack>
              <MetadataList>
                <MetadataListItem label="Lô đất">{contract.plots.length ? contract.plots.map(plot => plot.plot_number).join(', ') : 'Toàn khu đất'}</MetadataListItem>
                <MetadataListItem label="Diện tích">{formatArea(row.areaSqm)}</MetadataListItem>
                <MetadataListItem label="Vị trí"><Text wordBreak="break-word">{land?.location || '—'}</Text></MetadataListItem>
              </MetadataList>
              {land && <Link href={'/lands/' + land.id}>Xem khu đất</Link>}
            </VStack></Card>
          </Grid>
          <Section padding={isWide ? 5 : 3} variant="muted"><VStack gap={4}>
              <Heading level={2}>Thời hạn và thanh toán</Heading>
              <Grid columns={isWide ? 2 : 1} gap={4}>
              <MetadataList>
                <MetadataListItem label="Ngày bắt đầu">{formatDate(contract.start_date, true)}</MetadataListItem>
                <MetadataListItem label="Ngày kết thúc">{end ? formatDate(end, true) : 'Không xác định'}</MetadataListItem>
                <MetadataListItem label="Ngày thanh toán">{contract.due_day || contract.payment_due_day}</MetadataListItem>
              </MetadataList>
              <MetadataList>
                <MetadataListItem label="Tiền thuê">{formatMoney(contract.rent_amount)}</MetadataListItem>
                <MetadataListItem label="Tiền đặt cọc">{formatMoney(contract.deposit_amount)}</MetadataListItem>
                <MetadataListItem label="Chu kỳ">{PAYMENT_FREQUENCY_META[contract.payment_frequency].label}</MetadataListItem>
              </MetadataList>
              </Grid>
            </VStack></Section>
          <Section padding={isWide ? 5 : 3} dividers={['top']}>
          <Grid columns={isWide ? 2 : 1} gap={5}>
          <VStack gap={3}><Heading level={2}>Ghi chú</Heading><Text className="whitespace-pre-wrap break-words" color={contract.notes ? 'primary' : 'secondary'}>{contract.notes || 'Chưa có ghi chú.'}</Text></VStack>
          <VStack gap={3}>
            <HStack vAlign="center" gap={3} wrap="wrap"><StackItem size="fill"><Heading level={2}>Tệp hợp đồng</Heading></StackItem><Button label="Thêm tệp hợp đồng" variant="secondary" onClick={() => setUploading(true)} /></HStack>
            {filesQuery.isPending && <VStack gap={3} role="status">
              <Text type="supporting" color="secondary">Đang tải tệp hợp đồng…</Text>
              <VStack gap={3} aria-hidden="true">
                <Skeleton width="75%" height="var(--spacing-4)" />
                <Skeleton width="50%" height="var(--spacing-3)" index={1} />
              </VStack>
            </VStack>}
            {filesQuery.error && <Banner status="error" title="Không thể tải tệp" description={filesQuery.error.message} />}
            {filesQuery.data?.length === 0 && <Text color="secondary">Chưa có tệp PDF hoặc DOCX đính kèm.</Text>}
            <List hasDividers className="max-h-80 overflow-y-auto">
              {filesQuery.data?.map(file => <ListItem key={file.path} label={file.name}
                description={Math.max(1, Math.ceil(file.size / 1024)).toLocaleString('vi-VN') + ' KB'}
                endContent={<HStack gap={3} vAlign="center" wrap="wrap">
                  <Link href={'/api/contracts/' + id + '/files?path=' + encodeURIComponent(file.path)}>Tải xuống</Link>
                  <Button label="Xóa tệp" size="sm" variant="ghost" onClick={()=>{removeFile.reset();setRemovingFile(file);}} />
                </HStack>} />)}
            </List>
          </VStack>
          </Grid>
          </Section>
          <Section padding={isWide ? 5 : 3} dividers={['top']}><ContractPayments key={contract.id} contract={contract} /></Section>
        </VStack>
      </LayoutContent>} />
    {uploading && <UploadContractFilesDialog id={id} onClose={()=>setUploading(false)} onUploaded={()=>{void filesQuery.refetch();}} />}
    <AlertDialog isOpen={removingFile != null}
      onOpenChange={open=>{if(!open && !removeFile.isPending)setRemovingFile(null);}}
      title="Xóa tệp hợp đồng?"
      description={removeFile.error?.message ?? `Xóa vĩnh viễn tệp “${removingFile?.name ?? ''}”? Không thể hoàn tác thao tác này.`}
      actionLabel="Xóa tệp" cancelLabel="Hủy" isActionLoading={removeFile.isPending}
      onAction={()=>{if(removingFile && !removeFile.isPending)removeFile.mutate(removingFile);}} />
    {editing && <EditContractDialog contract={row} customers={customers.data?.data ?? contract.customers}
      lands={lands.data?.data ?? contract.lands} plots={plots.data?.data ?? contract.plots}
      isOpen onOpenChange={setEditing} onSaved={() => { void query.refetch(); void filesQuery.refetch(); }} />}
  </>;
}


function ContractDetailSkeleton({isWide}: {isWide: boolean}) {
  const padding = isWide ? 5 : 3;
  const fields = (count: number) => <VStack gap={3} aria-hidden="true">
    {Array.from({length: count}, (_, index) => <HStack key={index} gap={4} vAlign="center">
      <Skeleton width="30%" height="var(--spacing-3)" index={index} />
      <StackItem size="fill"><Skeleton width={index % 2 ? '65%' : '85%'} height="var(--spacing-4)" index={index + 1} /></StackItem>
    </HStack>)}
  </VStack>;
  return <Layout height="fill" padding={padding} contentWidth="fill"
    header={<LayoutHeader label="Chi tiết hợp đồng">
      <VStack gap={3}>
        <Link href="/contracts">Danh sách hợp đồng</Link>
        <HStack gap={3} wrap="wrap" vAlign="center" aria-hidden="true">
          <StackItem size="fill"><Skeleton width="80%" height="var(--spacing-8)" /></StackItem>
          <Skeleton width="var(--spacing-10)" height="var(--size-element-md)" />
        </HStack>
        <Text role="status" color="secondary">Đang tải thông tin hợp đồng…</Text>
      </VStack>
    </LayoutHeader>}
    content={<LayoutContent padding={padding} label="Đang tải chi tiết hợp đồng" aria-busy="true">
      <VStack gap={5}>
        <Grid columns={isWide ? 2 : 1} gap={5}>
          {['Khách hàng', 'Khu đất'].map(label => <Card key={label} padding={padding} height="100%">
            <VStack gap={4}>
              <Heading level={2}>{label}</Heading>
              <Skeleton width="65%" height="var(--spacing-6)" />
              {fields(label === 'Khách hàng' ? 2 : 3)}
              <Skeleton width="40%" height="var(--spacing-4)" />
            </VStack>
          </Card>)}
        </Grid>
        <Section padding={padding} variant="muted">
          <VStack gap={4}>
            <Heading level={2}>Thời hạn và thanh toán</Heading>
            <Grid columns={isWide ? 2 : 1} gap={4}>{fields(3)}{fields(3)}</Grid>
          </VStack>
        </Section>
        <Section padding={padding} dividers={['top']}>
          <Grid columns={isWide ? 2 : 1} gap={5}>
            {['Ghi chú', 'Tệp hợp đồng'].map(label => <VStack key={label} gap={3}>
              <Heading level={2}>{label}</Heading>
              <Skeleton width="90%" height="var(--spacing-4)" />
              <Skeleton width="65%" height="var(--spacing-4)" index={1} />
            </VStack>)}
          </Grid>
        </Section>
        <Section padding={padding} dividers={['top']}>
          <VStack gap={4}><Heading level={2}>Lịch thanh toán</Heading>{fields(3)}</VStack>
        </Section>
      </VStack>
    </LayoutContent>} />;
}
