'use client';

import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {UploadContractFilesDialog} from './UploadContractFilesDialog';
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
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { useContractDetail } from '@/hooks/useContract';
import { useAllCustomers, useAllLands, useAllPlots } from '@/hooks/useAllRecords';
import { buildContractRows, CONTRACT_STATUS_META, PAYMENT_FREQUENCY_META } from '@/data';
import { EditContractDialog } from '@/components/table-filter/EditContractDialog';
import { EntityStatus } from '@/components/table-filter/EntityStatus';
import { fetchContractFiles, deleteContractFile, type ContractFile } from '@/lib/api/fetchContractFiles';
import { resolveContractEndDate } from '@/lib/contractDates';
import { formatDate, formatMoney, formatArea } from '@/utils/format';

export function ContractDetailClient({ id }: { id: string }) {
  const query = useContractDetail(id);
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
  if (query.isPending) return <Section><ProgressBar label="Đang tải hợp đồng" isIndeterminate /></Section>;
  if (!contract || !row) return <Section><Banner status="error" title="Không thể tải hợp đồng" description={query.error?.message ?? 'Không tìm thấy hợp đồng.'} /><Link href="/contracts">Danh sách hợp đồng</Link></Section>;
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const plot = contract.plots[0];
  const customer = contract.customers[0];
  const end = resolveContractEndDate({ startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months });
  return <>
    <Layout height="fill" padding={5} contentWidth="fill"
      header={<LayoutHeader label="Chi tiết hợp đồng">
        <VStack gap={3}>
          <Link href="/contracts">Danh sách hợp đồng</Link>
          <HStack gap={3} vAlign="center" wrap="wrap">
            <StackItem size="fill"><Heading level={1}>{row.summary}</Heading></StackItem>
            <EntityStatus label={CONTRACT_STATUS_META[contract.status].label} />
            <Button label="Chỉnh sửa hợp đồng" onClick={() => setEditing(true)} />
          </HStack>
        </VStack>
      </LayoutHeader>}
      content={<LayoutContent padding={5} label="Thông tin hợp đồng">
        <VStack gap={5}>
          <Grid columns={{ minWidth: 300, max: 2, repeat: 'fit' }} gap={5}>
            <Card padding={5} height="100%"><VStack gap={4}>
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
            <Card padding={5} height="100%"><VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting" color="secondary">TÀI SẢN CHO THUÊ</Text>
                <Heading level={2}>Khu đất</Heading>
                <Text type="large" weight="semibold">{land?.name ?? 'Chưa có khu đất'}</Text>
              </VStack>
              <MetadataList>
                <MetadataListItem label="Lô đất">{plot?.plot_number ?? 'Toàn khu đất'}</MetadataListItem>
                <MetadataListItem label="Diện tích">{formatArea(plot?.area_sqm ?? land?.area_sqm ?? 0)}</MetadataListItem>
                <MetadataListItem label="Vị trí"><Text wordBreak="break-word">{land?.location || '—'}</Text></MetadataListItem>
              </MetadataList>
              {land && <Link href={'/lands/' + land.id}>Xem khu đất</Link>}
            </VStack></Card>
          </Grid>
          <Section padding={5} variant="muted"><VStack gap={4}>
              <Heading level={2}>Thời hạn và thanh toán</Heading>
              <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
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
          <Section padding={5} dividers={['top']}>
          <Grid columns={{ minWidth: 300, max: 2, repeat: 'fit' }} gap={5}>
          <VStack gap={3}><Heading level={2}>Ghi chú</Heading><Text className="whitespace-pre-wrap break-words" color={contract.notes ? 'primary' : 'secondary'}>{contract.notes || 'Chưa có ghi chú.'}</Text></VStack>
          <VStack gap={3}>
            <HStack vAlign="center" gap={3} wrap="wrap"><StackItem size="fill"><Heading level={2}>Tệp hợp đồng</Heading></StackItem><Button label="Thêm tệp hợp đồng" variant="secondary" onClick={() => setUploading(true)} /></HStack>
            {filesQuery.isPending && <ProgressBar label="Đang tải tệp" isIndeterminate />}
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
          <Section padding={5} dividers={['top']}><VStack gap={3}>
            <Heading level={2}>Lịch sử và lịch thanh toán</Heading>
            {!contract.payments?.length && <Text color="secondary">Chưa có kỳ thanh toán được ghi nhận.</Text>}
            <List hasDividers className="max-h-80 overflow-y-auto">
              {[...(contract.payments ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date)).map((payment, index) => <ListItem
                key={payment.due_date + ':' + index} label={formatDate(payment.due_date, true)}
                description={payment.paid_at ? 'Đã thanh toán ngày ' + formatDate(payment.paid_at, true) : payment.status.toUpperCase() === 'PAID' ? 'Đã thanh toán' : payment.status.toUpperCase() === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'}
                endContent={<Text weight="semibold">{formatMoney(payment.amount)}</Text>} />)}
            </List>
          </VStack></Section>
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
