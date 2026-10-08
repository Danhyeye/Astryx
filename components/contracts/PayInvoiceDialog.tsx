'use client';

import {useRef, useState} from 'react';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {DateInput} from '@astryxdesign/core/DateInput';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Layout, LayoutContent, LayoutFooter, HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {CurrencyInput} from '@/components/CurrencyInput';
import {contractToday} from '@/lib/contractDates';
import {validateInvoice} from '@/lib/invoices';
import {invoiceErrorMessage} from '@/lib/invoiceFeedback';
import type {Contract, ContractPayment, ContractResponse, Invoice} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function PayInvoiceDialog({contract, payment, onClose, onRecorded}: {
  contract: Contract; payment: ContractPayment; onClose: () => void; onRecorded: (invoice: Invoice) => void;
}) {
  const contractId = contract.id;
  const land = contract.lands[0] ?? contract.plots[0]?.lands[0];
  const isWide = useMediaQuery('(min-width: 640px)');
  const [date, setDate] = useState(contractToday);
  const [amount, setAmount] = useState(payment.remaining);
  const requestId = useRef<string | null>(null);
  const cache = useQueryClient();
  const validation = validateInvoice({amount, remaining: payment.remaining, paymentDate: date});
  const refresh = () => Promise.all([
    cache.invalidateQueries({queryKey: ['contractDetail', contractId]}),
    cache.invalidateQueries({queryKey: ['contracts']}),
  ]);
  const save = useMutation({
    mutationFn: async () => {
      if (validation) throw new Error(validation);
      requestId.current ??= crypto.randomUUID();
      const response = await fetch(`/api/contracts/${contractId}/invoices`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({dueDate: payment.due_date, paymentDate: date,
          amount, invoiceId: requestId.current}),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      const data = result.data as Invoice | null;
      if (!data) throw new Error('Missing invoice confirmation');
      return data;
    },
    onSuccess: async invoice => {await refresh(); onRecorded(invoice);},
    onError: async () => {
      await refresh();
      // A connection can fail after the database commits. Recognize the
      // confirmed invoice instead of inviting another payment for it.
      const latest = cache.getQueryData<ContractResponse>(['contractDetail', contractId]);
      const confirmed = latest?.data?.payments?.flatMap(row => row.invoices).find(invoice => invoice.id === requestId.current);
      if (confirmed) onRecorded(confirmed);
    },
  });
  const close = () => {if (!save.isPending) onClose();};
  return <Dialog isOpen onOpenChange={open => {if (!open) close();}} purpose="form" width={520} variant={isWide ? 'standard' : 'fullscreen'}>
    <Layout height={isWide ? undefined : 'fill'} header={<DialogHeader title="Ghi nhận thanh toán" subtitle={`Kỳ đến hạn ${formatDate(payment.due_date, true)}`} onOpenChange={close} />}
      content={<LayoutContent><form id="pay-invoice-form" onSubmit={event => {
        event.preventDefault();
        if (!save.isPending && !validation) save.mutate();
      }}><VStack gap={5}>
        <VStack gap={1}>
          <Text weight="semibold" className="wrap-anywhere">{contract.customers[0]?.name || 'Chưa có thông tin khách hàng'}</Text>
          <Text className="wrap-anywhere">{land?.name || 'Chưa có thông tin khu đất'} · {contract.plots.length ? contract.plots.map(plot => `Lô ${plot.plot_number}`).join(', ') : 'Toàn bộ khu đất'}</Text>
          <Text color="secondary">Ghi lại khoản tiền đã nhận từ khách hàng. Thao tác này không chuyển tiền.</Text>
        </VStack>
        <VStack gap={2}>
          <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Tổng tiền đến hạn</Text><Text>{formatMoney(payment.amount)}</Text></HStack>
          <HStack hAlign="between" gap={3} wrap="wrap"><Text color="secondary">Đã thanh toán</Text><Text>{formatMoney(payment.total_paid)}</Text></HStack>
          <HStack hAlign="between" gap={3} wrap="wrap"><Text weight="semibold">Còn lại</Text><Text weight="semibold">{formatMoney(payment.remaining)}</Text></HStack>
        </VStack>
        {save.error && <Banner status="error" title="Chưa thể xác nhận thanh toán" description={invoiceErrorMessage(save.error)} />}
        <DateInput label="Ngày nhận tiền" value={date ? date as ISODateString : undefined} max={contractToday() as ISODateString} onChange={value => setDate(value ?? '')} isRequired isDisabled={save.isPending} />
        <CurrencyInput label="Số tiền đã nhận" value={amount} onChange={setAmount} isRequired isDisabled={save.isPending} />
        {validation && <Text color="secondary" role="alert">{validation}</Text>}
      </VStack></form></LayoutContent>}
      footer={<LayoutFooter><VStack gap={2}>
        <Button className="min-h-11" size="lg" width="100%" label="Ghi nhận thanh toán" variant="primary" type="submit" form="pay-invoice-form" isLoading={save.isPending} isDisabled={!!validation || save.isPending} />
        <Button className="min-h-11" size="lg" width="100%" label="Hủy" variant="secondary" onClick={close} isDisabled={save.isPending} />
      </VStack></LayoutFooter>} />
  </Dialog>;
}
