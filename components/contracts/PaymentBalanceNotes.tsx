'use client';

import {useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Grid} from '@astryxdesign/core/Grid';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {List, ListItem} from '@astryxdesign/core/List';
import {VStack} from '@astryxdesign/core/Layout';
import {getOverduePayments, getOverpaidPayments} from '@/lib/contractPaymentSummary';
import type {ContractPayment} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function PaymentBalanceNotes({payments, today, onSelect}: {
  payments: readonly ContractPayment[];
  today: string;
  onSelect: (payment: ContractPayment) => void;
}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const overdue = getOverduePayments(payments, today);
  const overpaid = getOverpaidPayments(payments);
  if (!overdue.length && !overpaid.length) return null;
  return <Grid columns={isWide && overdue.length > 0 && overpaid.length > 0 ? 2 : 1} gap={4} className="min-w-0 w-full" align="start">
    {overdue.length > 0 && <PaymentNoteSection kind="overdue" payments={overdue} onSelect={onSelect} />}
    {overpaid.length > 0 && <PaymentNoteSection kind="overpaid" payments={overpaid} onSelect={onSelect} />}
  </Grid>;
}

function PaymentNoteSection({kind, payments, onSelect}: {
  kind: 'overdue' | 'overpaid';
  payments: readonly ContractPayment[];
  onSelect: (payment: ContractPayment) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const isOverpaid = kind === 'overpaid';
  const balance = payments.reduce((sum, payment) => sum + Math.round((isOverpaid ? payment.overpaid : payment.remaining) * 100), 0) / 100;
  const title = isOverpaid ? `${payments.length} kỳ thanh toán dư` : `${payments.length} kỳ quá hạn chưa thanh toán đủ`;
  return <VStack gap={2} className="min-w-0 w-full">
    <Banner status={isOverpaid ? 'info' : 'warning'} title={title}
      description={isOverpaid
        ? `Tổng tiền thừa: ${formatMoney(balance)}. Tiền thừa được giữ ở từng kỳ, chưa cấn trừ kỳ khác.`
        : `Tổng còn nợ quá hạn: ${formatMoney(balance)}. Chọn kỳ để kiểm tra hoặc ghi nhận thanh toán.`} />
    <List hasDividers density="compact" aria-label={title}>
      {(showAll ? payments : payments.slice(0, 5)).map(payment => <ListItem key={payment.due_date}
        label={`Kỳ đến hạn ${formatDate(payment.due_date, true)}`}
        description={isOverpaid
          ? `Đã nhận ${formatMoney(payment.total_paid)} · Tiền thừa ${formatMoney(payment.overpaid)}`
          : `${payment.total_paid > 0 ? `Đã nhận ${formatMoney(payment.total_paid)} · ` : 'Chưa thanh toán · '}Còn nợ ${formatMoney(payment.remaining)}`}
        endContent={<Button label="Xem kỳ" aria-label={`Xem kỳ ${formatDate(payment.due_date, true)}`} variant="ghost" size="sm" onClick={() => onSelect(payment)} />} />)}
    </List>
    {!showAll && payments.length > 5 && <Button label={`Xem tất cả ${payments.length} kỳ ${isOverpaid ? 'thanh toán dư' : 'quá hạn'}`} variant="ghost" onClick={() => setShowAll(true)} />}
  </VStack>;
}
