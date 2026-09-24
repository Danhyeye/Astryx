'use client';

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

export function PaymentInvoicesDrawer({contract, payment, onClose}: {contract: Contract; payment: ContractPayment; onClose: () => void}) {
  const customer = contract.customers[0];
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const field = (label: string, value: string | undefined) => <MetadataListItem label={label}>
    <Text className="whitespace-pre-wrap break-words">{value?.trim() || 'Chưa có thông tin'}</Text>
  </MetadataListItem>;
  return <BottomSheet isOpen onOpenChange={open => {if (!open) onClose();}} purpose="info"
    label="Hóa đơn thanh toán" height="tall">
    <VStack padding={4} gap={4}>
      <HStack hAlign="between" vAlign="start" gap={3}>
        <VStack gap={1}>
          <Heading level={2}>Hóa đơn thanh toán</Heading>
          <Text color="secondary">Kỳ đến hạn {formatDate(payment.due_date, true)}</Text>
        </VStack>
        <Button label="Đóng" variant="ghost" size="sm" onClick={onClose} />
      </HStack>
      <VStack gap={3}>
        <Heading level={3}>Thông tin khách hàng</Heading>
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Khách hàng', customer?.name)}
          {field('Số điện thoại', customer?.phone)}
          {field('Email', customer?.email)}
          {field('Địa chỉ', customer?.address)}
        </MetadataList>
      </VStack>
      <Divider />
      <VStack gap={3}>
        <Heading level={3}>Khu đất và lô đất</Heading>
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Khu đất', land?.name)}
          {field('Địa chỉ khu đất', land?.location)}
          {field('Diện tích khu đất', land?.area_sqm != null ? formatArea(land.area_sqm) : undefined)}
          {field('Phạm vi thuê', contract.plots.length ? 'Các lô đất bên dưới' : 'Toàn bộ khu đất')}
        </MetadataList>
        {contract.plots.length > 0 && <HStack gap={2} wrap="wrap">
          {contract.plots.map(plot => <Badge key={plot.id} variant="blue"
            label={`Lô ${plot.plot_number} · ${plot.area_sqm != null ? formatArea(plot.area_sqm) : 'Chưa có thông tin diện tích'}`} />)}
        </HStack>}
      </VStack>
      <Divider />
      <VStack gap={3}>
        <Heading level={3}>Ghi chú hợp đồng</Heading>
        <Text className="whitespace-pre-wrap break-words">{contract.notes?.trim() || 'Không có ghi chú.'}</Text>
      </VStack>
      <Divider />
      <Heading level={3}>Lịch sử thanh toán</Heading>
      <Table idKey="id" density="balanced" dividers="rows"
        data={[...payment.invoices].sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at))}
        columns={[
          {key: 'payment_date', header: 'Ngày thanh toán', width: proportional(1), renderCell: invoice => <Text>{formatDate(invoice.payment_date, true)}</Text>},
          {key: 'amount', header: 'Số tiền', align: 'end', width: proportional(1), renderCell: invoice => <Text weight="semibold">{formatMoney(invoice.amount)}</Text>},
        ]} />
    </VStack>
  </BottomSheet>;
}
