'use client';

import {useRef, useState} from 'react';
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
import {createClient} from '@/lib/supabase/client';
import type {ContractPayment, ContractResponse} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function PayInvoiceDialog({contractId, payment, onClose}: {
  contractId: string; payment: ContractPayment; onClose: () => void;
}) {
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
      const {error} = await createClient().rpc('pay_contract_invoice', {
        p_contract_id: contractId, p_due_date: payment.due_date,
        p_payment_date: date, p_amount: amount, p_invoice_id: requestId.current,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {await refresh(); onClose();},
    onError: async () => {
      await refresh();
      // A connection can fail after the database commits. Recognize the
      // confirmed invoice instead of inviting another payment for it.
      const latest = cache.getQueryData<ContractResponse>(['contractDetail', contractId]);
      if (latest?.data?.payments?.some(row => row.invoices.some(invoice => invoice.id === requestId.current))) onClose();
    },
  });
  const close = () => {if (!save.isPending) onClose();};
  return <Dialog isOpen onOpenChange={open => {if (!open) close();}} purpose="form" width={520}>
    <Layout header={<DialogHeader title="Thanh toán hóa đơn" subtitle={`Kỳ đến hạn ${formatDate(payment.due_date, true)}`} onOpenChange={close} />}
      content={<LayoutContent><form id="pay-invoice-form" onSubmit={event => {
        event.preventDefault();
        if (!save.isPending && !validation) save.mutate();
      }}><VStack gap={5}>
        <VStack gap={2}>
          <HStack hAlign="between" gap={3}><Text color="secondary">Tổng tiền đến hạn</Text><Text>{formatMoney(payment.amount)}</Text></HStack>
          <HStack hAlign="between" gap={3}><Text color="secondary">Đã thanh toán</Text><Text>{formatMoney(payment.total_paid)}</Text></HStack>
          <HStack hAlign="between" gap={3}><Text weight="semibold">Còn lại</Text><Text weight="semibold">{formatMoney(payment.remaining)}</Text></HStack>
        </VStack>
        {save.error && <Banner status="error" title="Chưa thể xác nhận thanh toán" description={save.error.message} />}
        <DateInput label="Ngày thanh toán" value={date ? date as ISODateString : undefined} max={contractToday() as ISODateString} onChange={value => setDate(value ?? '')} isRequired isDisabled={save.isPending} />
        <CurrencyInput label="Số tiền thanh toán" value={amount} onChange={setAmount} isRequired isDisabled={save.isPending} />
        {validation && <Text color="secondary" role="alert">{validation}</Text>}
      </VStack></form></LayoutContent>}
      footer={<LayoutFooter><HStack gap={2} hAlign="end" wrap="wrap">
        <Button label="Hủy" variant="secondary" onClick={close} isDisabled={save.isPending} />
        <Button label="Thanh toán hóa đơn" variant="primary" type="submit" form="pay-invoice-form" isLoading={save.isPending} isDisabled={!!validation || save.isPending} />
      </HStack></LayoutFooter>} />
  </Dialog>;
}
