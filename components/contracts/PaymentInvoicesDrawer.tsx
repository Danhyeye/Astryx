'use client';

import {useState} from 'react';
import {List, ListItem} from '@astryxdesign/core/List';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';
import {contractToday} from '@/lib/contractDates';
import {paymentDayState} from '@/lib/paymentContributionCalendar';
import type {Contract, ContractPayment} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function PaymentInvoicesDrawer({contract, payment, onClose, onRecordPayment}: {contract: Contract; payment: ContractPayment; onClose: () => void; onRecordPayment: () => void}) {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const invoices = [...payment.invoices].sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
  const invoice = invoices.find(row => row.id === invoiceId);
  const customer = contract.customers[0];
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const paymentMonth = `${payment.due_date.slice(5, 7)}/${payment.due_date.slice(0, 4)}`;
  const state = paymentDayState(payment, contractToday());
  const variant = state === 'paid' ? 'success' : state === 'overdue' ? 'error' : 'warning';
  const label = state === 'paid' ? 'Đã thanh toán' : state === 'overdue' ? 'Quá hạn, chưa thanh toán đủ' : 'Chưa đến hạn / đến hạn hôm nay';
  return <BottomSheet isOpen onOpenChange={open => {if (!open) onClose();}} purpose="info"
    label="Chi tiết kỳ thanh toán" height={invoices.length <= 3 || invoice ? 'hug' : 'capped'}>
    <VStack padding={4} gap={4} className="mx-auto w-full max-w-4xl min-w-0 pb-8">
      <HStack hAlign="between" vAlign="start" gap={3} wrap="wrap">
        <VStack gap={1}>
          <Heading level={2}>Chi tiết kỳ thanh toán</Heading>
          <Text color="secondary">Kỳ thanh toán {paymentMonth}</Text>
          <HStack gap={1} vAlign="center"><StatusDot variant={variant} label={label} /><Text>{label}</Text></HStack>
          {payment.status === 'PARTIALLY_PAID' && <Text color="secondary">Đã thanh toán một phần</Text>}
        </VStack>
        <Button label="Đóng" variant="ghost" onClick={onClose} />
      </HStack>
      <VStack gap={1}>
        <Text weight="semibold">{customer?.name ?? 'Khách hàng chưa xác định'}</Text>
        <Text color="secondary">{land?.name ?? 'Khu đất chưa xác định'} · {contract.plots.length ? contract.plots.map(plot => `Lô ${plot.plot_number}`).join(', ') : 'Toàn bộ khu đất'}</Text>
      </VStack>
      <VStack gap={2}>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Tổng tiền đến hạn</Text><Text className="tabular-nums">{formatMoney(payment.amount)}</Text></HStack>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Đã ghi nhận</Text><Text className="tabular-nums">{formatMoney(payment.total_paid)}</Text></HStack>
        <HStack hAlign="between" gap={3} wrap="wrap"><Text weight="semibold">Còn lại</Text><Text weight="semibold" className="tabular-nums">{formatMoney(payment.remaining)}</Text></HStack>
        {payment.overpaid > 0 && <HStack hAlign="between" gap={3} wrap="wrap"><Text weight="semibold">Tiền thừa của kỳ này</Text><Text weight="semibold" className="tabular-nums">{formatMoney(payment.overpaid)}</Text></HStack>}
      </VStack>
      {invoice ? <VStack gap={3}>
        <HStack hAlign="between" gap={2} wrap="wrap">
          <Heading level={3}>Hóa đơn đã ghi nhận</Heading>
          <Button label="Quay lại lịch sử" variant="ghost" onClick={() => setInvoiceId(null)} />
        </HStack>
        <MetadataList columns="single" label={{position: 'start'}}>
          {/* <MetadataListItem label="Mã hóa đơn"><Text className="break-all">{invoice.id}</Text></MetadataListItem> */}
          <MetadataListItem label="Ngày nhận tiền">{formatDate(invoice.payment_date, true)}</MetadataListItem>
          <MetadataListItem label="Số tiền">{formatMoney(invoice.amount)}</MetadataListItem>
          <MetadataListItem label="Kỳ đến hạn">{paymentMonth}</MetadataListItem>
          <MetadataListItem label="Ngày ghi nhận">{formatDate(invoice.created_at, true)}</MetadataListItem>
        </MetadataList>
      </VStack> : <VStack gap={3}>
        <Heading level={3}>Lịch sử thanh toán</Heading>
        {!invoices.length ? <Text color="secondary">Chưa ghi nhận khoản thanh toán nào cho kỳ này.</Text> : <List hasDividers density="balanced" aria-label="Lịch sử thanh toán">
          {invoices.map(receipt => <ListItem key={receipt.id} label={formatDate(receipt.payment_date, true)}
            description={formatMoney(receipt.amount)}
            endContent={<Button label="Xem hóa đơn" size="sm" variant="ghost" aria-label={`Xem hóa đơn ${formatDate(receipt.payment_date, true)}, ${formatMoney(receipt.amount)}`} onClick={() => setInvoiceId(receipt.id)} />} />)}
        </List>}
      </VStack>}
      {payment.remaining > 0 && <Button label={payment.total_paid > 0 ? 'Ghi nhận khoản còn lại' : 'Ghi nhận thanh toán'} variant="primary" size="lg" onClick={onRecordPayment} />}
    </VStack>
  </BottomSheet>;
}
