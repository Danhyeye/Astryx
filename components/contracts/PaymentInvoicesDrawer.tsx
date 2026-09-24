'use client';

import {useMediaQuery} from '@astryxdesign/core/hooks';
import {List, ListItem} from '@astryxdesign/core/List';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Badge} from '@astryxdesign/core/Badge';
import {Divider} from '@astryxdesign/core/Divider';
import {Table, proportional} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import type {Contract, ContractPayment} from '@/types/contract';
import {formatArea, formatDate, formatMoney} from '@/utils/format';

export function PaymentInvoicesDrawer({contract, payment, onClose, onRecordPayment}: {contract: Contract; payment: ContractPayment; onClose: () => void; onRecordPayment: () => void}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const invoices = [...payment.invoices].sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
  const customer = contract.customers[0];
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const field = (label: string, value: string | undefined) => <MetadataListItem label={label}>
    <Text className="whitespace-pre-wrap wrap-anywhere">{value?.trim() || 'Chưa có thông tin'}</Text>
  </MetadataListItem>;
  return <BottomSheet isOpen onOpenChange={open => {if (!open) onClose();}} purpose="info"
    label="Hóa đơn thanh toán" height="tall">
    <VStack padding={4} gap={5} className="mx-auto w-full max-w-4xl min-w-0">
      <HStack hAlign="between" vAlign="start" gap={3} wrap="wrap">
        <VStack gap={1}>
          <Heading level={2}>Hóa đơn thanh toán</Heading>
          <Text color="secondary">Kỳ đến hạn {formatDate(payment.due_date, true)}</Text>
        </VStack>
        <Button className="min-h-11" label="Đóng" variant="ghost" size="lg" onClick={onClose} />
      </HStack>
      <VStack gap={1}>
        <Text weight="semibold">{customer?.name ?? 'Khách hàng chưa xác định'}</Text>
        <Text color="secondary">{land?.name ?? 'Khu đất chưa xác định'}</Text>
        {contract.plots.length ? <HStack gap={2} wrap="wrap">{contract.plots.map(plot => <Badge key={plot.id} variant="neutral" label={`Lô ${plot.plot_number}`} />)}</HStack> : <Text type="supporting">Toàn bộ khu đất</Text>}
      </VStack>
      <VStack gap={2}>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Tổng tiền đến hạn</Text><Text className="tabular-nums">{formatMoney(payment.amount)}</Text></HStack>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Đã ghi nhận</Text><Text className="tabular-nums">{formatMoney(payment.total_paid)}</Text></HStack>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text weight="semibold">Còn lại</Text><Text weight="semibold" className="tabular-nums">{formatMoney(payment.remaining)}</Text></HStack>
      </VStack>
      <VStack gap={3}>
        <Heading level={3}>Lịch sử thanh toán</Heading>
        {!isWide ? <List hasDividers density="balanced" aria-label="Lịch sử thanh toán">
          {invoices.map(invoice => <ListItem key={invoice.id} label={formatDate(invoice.payment_date, true)}
            description={<Text weight="semibold" className="break-words tabular-nums">{formatMoney(invoice.amount)}</Text>} />)}
        </List> : <Table idKey="id" density="balanced" dividers="rows"
          data={invoices}
          columns={[
            {key: 'payment_date', header: 'Ngày thanh toán', width: proportional(1), renderCell: invoice => <Text>{formatDate(invoice.payment_date, true)}</Text>},
            {key: 'amount', header: 'Số tiền', align: 'end', width: proportional(1), renderCell: invoice => <Text weight="semibold">{formatMoney(invoice.amount)}</Text>},
          ]} />}
      </VStack>
      {payment.remaining > 0 && <Button label="Ghi nhận khoản còn lại" variant="primary" size="lg" onClick={onRecordPayment} />}
      {/* <Divider /> */}
      {/* <VStack gap={3}>
        <Heading level={3}>Thông tin khách hàng</Heading>
        <MetadataList columns="single" label={{position: isWide ? 'start' : 'top'}}>
          {field('Khách hàng', customer?.name)}
          {field('Số điện thoại', customer?.phone)}
          {field('Email', customer?.email)}
          {field('Địa chỉ', customer?.address)}
        </MetadataList>
      </VStack>
      <Divider />
      <VStack gap={3}>
        <Heading level={3}>Khu đất và lô đất</Heading>
        <MetadataList columns="single" label={{position: isWide ? 'start' : 'top'}}>
          {field('Khu đất', land?.name)}
          {field('Địa chỉ khu đất', land?.location)}
          {field('Diện tích khu đất', land?.area_sqm != null ? formatArea(land.area_sqm) : undefined)}
          {field('Phạm vi thuê', contract.plots.length ? 'Các lô đất bên dưới' : 'Toàn bộ khu đất')}
        </MetadataList>
        {contract.plots.length > 0 && <HStack gap={2} wrap="wrap">
          {contract.plots.map(plot => <VStack key={plot.id} gap={1} hAlign="start" className="min-w-0 max-w-full">
            <Badge variant="blue" className="h-auto! min-h-5" label={<Text className="whitespace-normal! wrap-anywhere">Lô {plot.plot_number}</Text>} />
            <Text color="secondary" className="break-words">{plot.area_sqm != null ? formatArea(plot.area_sqm) : 'Chưa có thông tin diện tích'}</Text>
          </VStack>)}
        </HStack>}
      </VStack>
      <Divider />
      <VStack gap={3}>
        <Heading level={3}>Ghi chú hợp đồng</Heading>
        <Text className="whitespace-pre-wrap wrap-anywhere">{contract.notes?.trim() || 'Không có ghi chú.'}</Text>
      </VStack> */}
    </VStack>
  </BottomSheet>;
}
