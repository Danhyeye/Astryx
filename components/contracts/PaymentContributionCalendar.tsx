'use client';

import {useMemo, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Grid} from '@astryxdesign/core/Grid';
import {IconButton} from '@astryxdesign/core/IconButton';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {paymentDayState} from '@/lib/paymentContributionCalendar';
import type {ContractPayment} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

const STATES = {
  paid: {variant: 'success', label: 'Đã thanh toán'},
  upcoming: {variant: 'warning', label: 'Sắp đến hạn'},
  overdue: {variant: 'error', label: 'Quá hạn, còn nợ'},
} as const;
const YEARS_PER_BATCH = 5;

export function PaymentContributionCalendar({payments, firstYear, lastYear, today, startDate, endDate, selectedDate, onSelect}: {
  payments: readonly ContractPayment[];
  firstYear: number;
  lastYear: number;
  today: string;
  startDate: string;
  endDate: string | null;
  selectedDate?: string;
  onSelect: (payment: ContractPayment) => void;
}) {
  const isDesktop = useMediaQuery('(min-width: 1280px) and (hover: hover)');
  const [yearLimit, setYearLimit] = useState(YEARS_PER_BATCH);
  const years = useMemo(() => Array.from({length: lastYear - firstYear + 1}, (_, yearIndex) => {
    const year = firstYear + yearIndex;
    return {year, months: Array.from({length: 12}, (_, index) => {
      const month = `${year}-${String(index + 1).padStart(2, '0')}`;
      return {
        month,
        label: `${String(index + 1).padStart(2, '0')}/${year}`,
        inTerm: month >= startDate.slice(0, 7) && (!endDate || month <= endDate.slice(0, 7)),
        payments: payments.filter(payment => payment.due_date.slice(0, 7) === month)
          .sort((a, b) => a.due_date.localeCompare(b.due_date)),
      };
    })};
  }), [payments, firstYear, lastYear, startDate, endDate]);
  const visibleYears = isDesktop ? years : years.slice(0, yearLimit);
  const remainingYears = years.length - visibleYears.length;
  return <VStack gap={4} padding={2} className="min-w-0 w-full">
    <VStack gap={2} className="w-full min-w-0" role="region" aria-label={`Lịch thanh toán từ năm ${firstYear} đến năm ${lastYear}`}>
      <HStack gap={1} paddingInline={2} paddingBlock={1} aria-hidden="true">
        <Text type="supporting" color="secondary" className="w-10 shrink-0">Năm</Text>
        <Grid columns={12} gap={0.5} className="min-w-0 flex-1">
          {Array.from({length: 12}, (_, index) => <Text key={index} type="supporting" color="secondary" className="text-center tabular-nums">{index + 1}</Text>)}
        </Grid>
      </HStack>
      {visibleYears.map(({year, months}) => <HStack key={year} gap={1} paddingInline={2} paddingBlock={1} vAlign="center" className="min-w-0 w-full rounded-sm even:bg-muted">
        <Text type="supporting" weight="semibold" className="w-10 shrink-0 tabular-nums">{year}</Text>
        <Grid columns={12} gap={0.5} align="center" className="min-w-0 flex-1">
          {months.map(month => <VStack key={month.month} gap={1} className="min-w-0" hAlign="center">
            {month.payments.length ? month.payments.map((payment, paymentIndex) => {
              const state = STATES[paymentDayState(payment, today)];
              const label = `${formatDate(payment.due_date, true)} · ${state.label}${payment.status === 'PARTIALLY_PAID' ? ' · Đã trả một phần' : ''} · ${formatMoney(payment.amount)} · Còn ${formatMoney(payment.remaining)}${payment.overpaid > 0 ? ` · Tiền thừa ${formatMoney(payment.overpaid)}` : ''}`;
              return <IconButton key={`${payment.due_date}-${paymentIndex}`} label={label} tooltip={label} type="button" size="sm" variant="ghost"
                width="100%" className="h-8! min-w-0 aspect-auto! [&>span]:w-full!"
                aria-pressed={selectedDate === payment.due_date} aria-haspopup="dialog"
                icon={<StatusDot variant={state.variant} label={state.label} className="w-full! max-w-3.5 h-auto! aspect-square" />}
                onClick={() => onSelect(payment)} />;
            }) : <VStack className="h-8 w-full" hAlign="center" vAlign="center">
              {month.inTerm && <StatusDot variant="neutral" label={`${month.label} · Không có kỳ thu`} tooltip={`${month.label} · Không có kỳ thu`}
                className={`h-2.5 w-2.5 ${month.month > today.slice(0, 7) ? 'opacity-30' : ''}`} />}
            </VStack>}
          </VStack>)}
        </Grid>
      </HStack>)}
      {remainingYears > 0 && <HStack hAlign="center" paddingBlock={1}>
        <Button label={`Xem thêm ${remainingYears} năm`} variant="ghost" type="button"
          onClick={() => setYearLimit(years.length)} />
      </HStack>}
    </VStack>
    <HStack gap={4} wrap="wrap" aria-label="Chú thích trạng thái">
      {Object.entries(STATES).map(([key, state]) => <HStack key={key} gap={1} vAlign="center">
        <StatusDot variant={state.variant} label={state.label} /><Text type="supporting">{state.label}</Text>
      </HStack>)}
      <HStack gap={1} vAlign="center"><StatusDot variant="neutral" label="Không có kỳ thu" /><Text type="supporting">Không có kỳ thu</Text></HStack>
    </HStack>
    <Text type="supporting" color="secondary">Di chuột hoặc dùng Tab để xem số tiền. Chọn kỳ thanh toán để xem chi tiết và hóa đơn.</Text>
  </VStack>;
}
