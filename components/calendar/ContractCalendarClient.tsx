'use client';

import { useMemo, useRef, useState } from 'react';
import {EntityStatus} from '@/components/table-filter/EntityStatus';
import {PAYMENT_FREQUENCY_META} from '@/data';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, Layout, LayoutContent, LayoutHeader, StackItem, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Section } from '@astryxdesign/core/Section';
import { Selector } from '@astryxdesign/core/Selector';
import { Heading, Text } from '@astryxdesign/core/Text';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useAllContracts } from '@/hooks/useAllRecords';
import { useGoogleCalendarStatus, useSyncGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { formatDate, formatMoney, formatNumber } from '@/utils/format';
import { buildContractMonthEvents, buildContractOptions } from './contractCalendarData';

function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function moveMonth(month: string, offset: number) {
  const date = new Date(month + 'T00:00:00Z');
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : null;
}

export function ContractCalendarClient() {
  const agendaRef = useRef<HTMLElement>(null);
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const [today] = useState(todayInVietnam);
  const [month, setMonth] = useState(() => today.slice(0, 7) + '-01');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedContractId, setSelectedContractId] = useState('all');
  const { data: contractsResponse, error, isFetching, isPending } = useAllContracts();
  const { data: googleStatusResponse, error: googleStatusError,
    isFetching: isGoogleStatusFetching, isPending: isGoogleStatusPending } = useGoogleCalendarStatus();
  const syncGoogleCalendar = useSyncGoogleCalendar();
  const contracts = useMemo(() => contractsResponse?.data ?? [], [contractsResponse?.data]);
  const options = useMemo(() => [{ label: 'Tất cả hợp đồng', value: 'all' }, ...buildContractOptions(contracts)], [contracts]);
  const events = useMemo(() => buildContractMonthEvents(
    selectedContractId === 'all' ? contracts : contracts.filter(contract => contract.id === selectedContractId),
    month,
  ), [contracts, selectedContractId, month]);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, typeof events>();
    for (const event of events) grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    return grouped;
  }, [events]);
  const days = useMemo(() => {
    const start = new Date(month + 'T00:00:00Z');
    const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    const offset = (start.getUTCDay() + 6) % 7;
    const length = Math.ceil((offset + last.getUTCDate()) / 7) * 7;
    return Array.from({ length }, (_, i) => {
      const date = new Date(start);
      date.setUTCDate(1 - offset + i);
      return date.toISOString().slice(0, 10);
    });
  }, [month]);
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month));
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const paymentsByEvent = useMemo(() => new Map(contracts.flatMap(contract =>
    (contract.payments ?? []).map(payment => [`${contract.id}:${payment.due_date}`, payment] as const),
  )), [contracts]);
  const googleStatus = googleStatusResponse?.data ?? null;
  const googleErrorMessage = messageOf(googleStatusError) ?? messageOf(syncGoogleCalendar.error);
  const googleSyncSummary = syncGoogleCalendar.data?.data ?? null;

  function navigateMonth(offset: number) {
    const next = moveMonth(month, offset);
    setMonth(next);
    setSelectedDate(next);
  }

  return (
    <Layout height="fill" padding={4} contentWidth="fill"
      header={<LayoutHeader label="Lịch thanh toán">
        <HStack gap={4} vAlign="center" wrap="wrap">
          <StackItem size="fill">
            <Heading level={1}>Lịch thanh toán</Heading>
          </StackItem>
          <Selector label="Hợp đồng" options={options} value={selectedContractId} hasSearch
            onChange={value => {
              setSelectedContractId(value);

            }} />
        </HStack>
      </LayoutHeader>}
      content={<LayoutContent label="Lịch tháng">
        <VStack gap={4}>
          {isFetching && <ProgressBar label="Đang tải lịch thanh toán" isLabelHidden isIndeterminate />}
          {error && <Banner status="error" title="Không thể tải lịch thanh toán" description={messageOf(error) ?? 'Vui lòng thử lại.'} />}
          <Section padding={0} dividers={['top', 'start', 'end', 'bottom']}>
            <Section padding={4} dividers={['bottom']}>
              <HStack gap={3} vAlign="center" wrap="wrap">
                <StackItem size="fill">
                  <VStack gap={1}>
                    <Heading level={2}>{monthLabel}</Heading>
                    <Text color="secondary">{formatNumber(events.length)} hạn thanh toán · {formatMoney(events.reduce((sum, event) => sum + event.amount, 0))}</Text>
                  </VStack>
                </StackItem>
                <HStack gap={2} vAlign="center">
                <IconButton
                  icon={<Icon icon="chevronLeft" />}
                  label="Tháng trước"
                  tooltip="Tháng trước"
                  variant="ghost"
                  onClick={() => navigateMonth(-1)}
                />
                <Button
                  label="Hôm nay"
                  onClick={() => {
                    setMonth(today.slice(0, 7) + '-01');
                    setSelectedDate(today);
                  }}
                />
                <IconButton
                  icon={<Icon icon="chevronRight" />}
                  label="Tháng sau"
                  tooltip="Tháng sau"
                  variant="ghost"
                  onClick={() => navigateMonth(1)}
                />
                </HStack>
              </HStack>
            </Section>
            <Grid columns={7} gap={0} width="100%">
              {['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'].map(day => (
                <Section key={day} padding={2} dividers={['bottom']}>
                  <Text display="block" justify="center" color="secondary">{day}</Text>
                </Section>
              ))}
              {days.map((date, index) => {
                const inMonth = date.slice(0, 7) === month.slice(0, 7);
                const dayEvents = eventsByDate.get(date) ?? [];
                return <Section key={date} padding={1}
                  minHeight={isNarrow ? undefined : "calc(var(--spacing-10) * 4)"}
                  variant={inMonth ? 'section' : 'muted'}
                  dividers={index % 7 === 6 ? ['bottom'] : ['bottom', 'end']}>
                  <VStack gap={1}>
                    <HStack>
                      <Button label={String(Number(date.slice(-2)))} size={isNarrow ? "md" : "sm"} width={isNarrow ? "100%" : undefined}
                        aria-label={`${formatDate(date, true)}, ${dayEvents.length} hạn thanh toán`}
                        variant={date === selectedDate ? 'primary' : 'ghost'}
                        isDisabled={!inMonth} onClick={() => {setSelectedDate(date); if (isNarrow) requestAnimationFrame(() => agendaRef.current?.scrollIntoView({block: 'start'}));}} />
                      {date === today && !isNarrow && <Text type="supporting" color="accent">Hôm nay</Text>}
                    </HStack>
                    {isNarrow && dayEvents.length > 0 && <Text type="supporting" justify="center">{dayEvents.length} kỳ</Text>}
                    {!isNarrow && dayEvents.slice(0, 3).map(event => (
                      <Button key={event.id} label={event.customerName} size="sm"
                        variant="secondary" onClick={() => {setSelectedDate(date); if (isNarrow) requestAnimationFrame(() => agendaRef.current?.scrollIntoView({block: 'start'}));}}
                        tooltip={event.contractLabel + ' · ' + formatMoney(event.amount)} />
                    ))}
                    {!isNarrow && dayEvents.length > 3 && <Button size="sm" variant="ghost"
                      label={'+ ' + formatNumber(dayEvents.length - 3) + ' hạn khác'}
                      onClick={() => {setSelectedDate(date); if (isNarrow) requestAnimationFrame(() => agendaRef.current?.scrollIntoView({block: 'start'}));}} />}
                  </VStack>
                </Section>;
              })}
            </Grid>
          </Section>
          <Section padding={5} ref={agendaRef}>
            <VStack gap={4}>
              <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
                <VStack gap={1}>
                  <Heading level={2}>Hạn thanh toán ngày {formatDate(selectedDate, true)}</Heading>
                  <Text type="supporting" color="secondary">{formatNumber(selectedEvents.length)} kỳ thanh toán</Text>
                </VStack>
                {selectedEvents.length > 0 && <VStack gap={1} hAlign="end">
                  <Text type="supporting" color="secondary">Tổng tiền đến hạn</Text>
                  <Text weight="semibold">{formatMoney(selectedEvents.reduce((sum, event) => sum + event.amount, 0))}</Text>
                </VStack>}
              </HStack>
              {selectedEvents.length === 0 && !isPending
                ? <Text color="secondary">Không có hạn thanh toán trong ngày này.</Text>
                : <List key={selectedDate} hasDividers density="balanced" className={isNarrow ? undefined : "max-h-96 overflow-y-auto"}>
                  {selectedEvents.map(event => {
                    const payment = paymentsByEvent.get(`${event.contractId}:${event.date}`);
                    const paid = payment?.status === 'PAID';
                    const partial = payment?.status === 'PARTIALLY_PAID';
                    const status = <EntityStatus variant={paid ? 'green' : partial ? 'orange' : event.date < today ? 'red' : 'neutral'}
                      label={paid ? 'Đã thanh toán' : partial ? 'Thanh toán một phần' : event.date < today ? 'Quá hạn' : 'Chưa thanh toán'} />;
                    return <ListItem key={event.id}
                      label={event.customerName}
                      href={`/contracts/${encodeURIComponent(event.contractId)}`}
                      description={<VStack gap={2} hAlign="start">
                        <Text type="supporting" color="secondary" maxLines={2}>{event.targetLabel}</Text>
                        <Text type="supporting" color="secondary">{PAYMENT_FREQUENCY_META[event.frequency].label}</Text>
                        {isNarrow && <HStack gap={2} wrap="wrap" vAlign="center">
                          <Text weight="semibold">{formatMoney(event.amount)}</Text>{status}
                        </HStack>}
                      </VStack>}
                      endContent={<HStack gap={3} vAlign="center">
                        {!isNarrow && <VStack gap={2} hAlign="end">
                          <Text weight="semibold">{formatMoney(event.amount)}</Text>{status}
                        </VStack>}
                        <Icon icon="chevronRight" />
                      </HStack>} />;
                  })}
                </List>}
            </VStack>
          </Section>
          {/* <Section padding={4} dividers={['top']}>
            <VStack gap={3}>
              <VStack gap={1}>
                <Heading level={2}>Lịch Google</Heading>
                <Text color="secondary">Đồng bộ tất cả hợp đồng đến hạn ngày {formatDate(selectedDate, true)}, kể cả khi đang lọc một hợp đồng.</Text>
                <Text color="secondary">
                  {googleStatus?.isConnected
                    ? `Đã kết nối với ${googleStatus.calendarId}.`
                    : 'Kết nối Google để đồng bộ hạn thanh toán hợp đồng.'}
                </Text>
              </VStack>

              {isGoogleStatusPending || isGoogleStatusFetching ? (
                <ProgressBar
                  label="Đang tải trạng thái Lịch Google"
                  isLabelHidden
                  isIndeterminate
                />
              ) : null}

              {googleStatus != null && !googleStatus.isConfigured ? (
                <Text type="supporting" color="secondary">
                  Thiếu cấu hình: {googleStatus.missing.join(', ')}
                </Text>
              ) : null}

              {googleStatus?.accountEmail ? (
                <Text type="supporting" color="secondary">
                  {googleStatus.accountEmail}
                </Text>
              ) : null}

              {googleStatus?.lastSyncedAt ? (
                <Text type="supporting" color="secondary">
                  Đồng bộ lần cuối{' '}
                  {formatDate(googleStatus.lastSyncedAt, true)}
                </Text>
              ) : null}

              {googleSyncSummary != null ? (
                <Text type="supporting" color="secondary">
                  Đã đồng bộ {formatNumber(googleSyncSummary.total)}{' '}
                  hạn thanh toán ngày {formatDate(googleSyncSummary.date, true)}. Đã tạo {formatNumber(googleSyncSummary.created)},
                  cập nhật {formatNumber(googleSyncSummary.updated)}, đã xóa{' '}
                  {formatNumber(googleSyncSummary.deleted)}, thất bại{' '}
                  {formatNumber(googleSyncSummary.failed)}.
                </Text>
              ) : null}

              {googleErrorMessage != null ? (
                <Text type="supporting" color="secondary">
                  {googleErrorMessage}
                </Text>
              ) : null}

              {googleStatus?.isConnected ? (
                <Button
                  label={`Đồng bộ ngày ${formatDate(selectedDate, true)}`}
                  variant="secondary"
                  icon={<Icon icon="calendar" />}
                  isLoading={syncGoogleCalendar.isPending}
                  onClick={() => syncGoogleCalendar.mutate(selectedDate)}
                />
              ) : (
                <Button
                  label="Kết nối Google"
                  variant="secondary"
                  icon={<Icon icon="externalLink" />}
                  href="/api/calendar/google/connect"
                  isDisabled={googleStatus?.isConfigured === false}
                />
              )}
            </VStack>
          </Section>         */}
          </VStack>
      </LayoutContent>}
    />
  );
}
