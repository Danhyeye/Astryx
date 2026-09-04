'use client';

import {useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Calendar} from '@astryxdesign/core/Calendar';
import type {DateRange, ISODateString} from '@astryxdesign/core/Calendar';
import {Card} from '@astryxdesign/core/Card';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  StackItem,
  VStack,
} from '@astryxdesign/core/Layout';
import {List, ListItem} from '@astryxdesign/core/List';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Selector} from '@astryxdesign/core/Selector';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Heading, Text} from '@astryxdesign/core/Text';
import {useMediaQuery} from '@astryxdesign/core/hooks';

import {useContracts} from '@/hooks/useContract';
import {
  useGoogleCalendarStatus,
  useSyncGoogleCalendar,
} from '@/hooks/useGoogleCalendar';
import {formatDate, formatDueDay, formatMoney} from '@/utils/format';
import {
  buildContractCalendarEvents,
  buildContractOptions,
  eventDateKey,
  type ContractCalendarEvent,
} from './contractCalendarData';

const ALL_CONTRACTS_VALUE = 'all';
const DATA_PAGE = {page: 1, pageSize: 100};

function errorMessageOf(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not load contract calendar data.';
}

function totalAmount(events: readonly ContractCalendarEvent[]): number {
  return events.reduce((total, event) => total + event.amount, 0);
}

function statusVariantOf(
  status: ContractCalendarEvent['status'],
): 'neutral' | 'warning' | 'error' {
  if (status === 'CANCELLED') {
    return 'error';
  }

  if (status === 'COMPLETED') {
    return 'warning';
  }

  return 'neutral';
}

function calendarDate(value: string): ISODateString {
  return value as ISODateString;
}

function googleMessageOf(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Google Calendar request failed.';
}

export function ContractCalendarClient() {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const calendarMonthCount: 1 | 2 = isNarrow ? 1 : 2;
  const [selectedContractId, setSelectedContractId] = useState(
    ALL_CONTRACTS_VALUE,
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    eventDateKey(new Date()),
  );

  const {
    data: contractsResponse,
    error,
    isFetching,
    isPending,
  } = useContracts(DATA_PAGE);
  const {
    data: googleStatusResponse,
    error: googleStatusError,
    isFetching: isGoogleStatusFetching,
    isPending: isGoogleStatusPending,
  } = useGoogleCalendarStatus();
  const syncGoogleCalendar = useSyncGoogleCalendar();

  const contracts = useMemo(
    () => contractsResponse?.data ?? [],
    [contractsResponse?.data],
  );
  const contractEvents = useMemo(
    () => buildContractCalendarEvents(contracts),
    [contracts],
  );
  const contractOptions = useMemo(
    () => [
      {label: 'All contracts', value: ALL_CONTRACTS_VALUE},
      ...buildContractOptions(contracts),
    ],
    [contracts],
  );
  const selectedContract = useMemo(
    () =>
      selectedContractId === ALL_CONTRACTS_VALUE
        ? null
        : contracts.find(contract => contract.id === selectedContractId) ??
          null,
    [contracts, selectedContractId],
  );
  const visibleEvents = useMemo(
    () =>
      selectedContract == null
        ? contractEvents
        : contractEvents.filter(
            event => event.contractId === selectedContract.id,
          ),
    [contractEvents, selectedContract],
  );
  const firstVisibleEventDate = visibleEvents[0]?.date;

  const selectedDateEvents = useMemo(
    () => visibleEvents.filter(event => event.date === selectedDate),
    [selectedDate, visibleEvents],
  );
  const selectedRange = useMemo<DateRange | null>(() => {
    if (selectedContract == null) {
      return null;
    }

    const start = eventDateKey(selectedContract.start_date);
    if (start === '') {
      return null;
    }

    const end =
      eventDateKey(selectedContract.end_date) ||
      visibleEvents[0]?.endDate ||
      visibleEvents.at(-1)?.date ||
      start;

    return {
      start: calendarDate(start),
      end: calendarDate(end),
    };
  }, [selectedContract, visibleEvents]);
  const selectedDateAmount = totalAmount(selectedDateEvents);
  const visibleAmount = totalAmount(visibleEvents);
  const errorMessage = errorMessageOf(error);
  const googleStatus = googleStatusResponse?.data ?? null;
  const googleErrorMessage =
    googleMessageOf(googleStatusError) ??
    googleMessageOf(syncGoogleCalendar.error);
  const googleSyncSummary = syncGoogleCalendar.data?.data ?? null;
  const selectedCalendarDate = calendarDate(
    selectedDate || firstVisibleEventDate || eventDateKey(new Date()),
  );

  return (
    <Layout
      height="fill"
      padding={6}
      contentWidth="fill"
      header={
        <LayoutHeader label="Contract calendar header">
          <HStack gap={4} vAlign="end" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Heading level={1}>Calendar</Heading>
                  {isFetching && (
                    <HStack gap={1} vAlign="center">
                      <StatusDot
                        variant="accent"
                        label="Refreshing"
                        isPulsing
                      />
                      <Text type="supporting" color="secondary">
                        Refreshing
                      </Text>
                    </HStack>
                  )}
                </HStack>
                <Text color="secondary">
                  Contract ranges, payment due dates, and expected rent.
                </Text>
              </VStack>
            </StackItem>

            <Selector
              label="Contract"
              options={contractOptions}
              value={selectedContractId}
              onChange={value => {
                setSelectedContractId(value);
                const firstContractEvent = contractEvents.find(
                  event => event.contractId === value,
                );

                if (firstContractEvent != null) {
                  setSelectedDate(firstContractEvent.date);
                }
              }}
              hasSearch
              width={360}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent label="Contract calendar">
          <VStack gap={4}>
            {isPending && (
              <ProgressBar
                label="Loading contract calendar"
                isLabelHidden
                isIndeterminate
              />
            )}

            {errorMessage != null && (
              <Banner
                status="error"
                title="Could not load calendar"
                description={errorMessage}
                container="section"
              />
            )}

            <Grid gap={4} columns={isNarrow ? 1 : 12} width="100%">
              <GridSpan columns={isNarrow ? 'full' : 8}>
                <Card padding={4}>
                  <VStack gap={4}>
                    <VStack gap={1}>
                      <Heading level={2}>
                        {selectedContract == null
                          ? 'All contract due dates'
                          : selectedContract.customers[0]?.name ??
                            'Selected contract'}
                      </Heading>
                      <Text color="secondary">
                        {selectedRange == null
                          ? `${contractEvents.length.toLocaleString('en-US')} due dates generated from contract terms.`
                          : `${formatDate(selectedRange.start, true)} - ${formatDate(
                              selectedRange.end,
                              true,
                            )}`}
                      </Text>
                    </VStack>

                    {selectedRange == null ? (
                      <Calendar
                        value={selectedCalendarDate}
                        onChange={value => setSelectedDate(value)}
                        numberOfMonths={calendarMonthCount}
                        weekStartsOn="sun"
                      />
                    ) : (
                      <Calendar
                        mode="range"
                        value={selectedRange}
                        focusDate={selectedRange.start}
                        min={selectedRange.start}
                        max={selectedRange.end}
                        numberOfMonths={calendarMonthCount}
                        weekStartsOn="sun"
                      />
                    )}
                  </VStack>
                </Card>
              </GridSpan>

              <GridSpan columns={isNarrow ? 'full' : 4}>
                <VStack gap={4}>
                  <Card padding={4}>
                    <VStack gap={3}>
                      <HStack gap={2} vAlign="center">
                        <Icon icon="calendar" color="accent" />
                        <Heading level={2}>Due summary</Heading>
                      </HStack>
                      <VStack gap={1}>
                        <Text color="secondary">Visible due dates</Text>
                        <Heading level={2}>
                          {visibleEvents.length.toLocaleString('en-US')}
                        </Heading>
                      </VStack>
                      <VStack gap={1}>
                        <Text color="secondary">Expected rent</Text>
                        <Heading level={2}>{formatMoney(visibleAmount)}</Heading>
                      </VStack>
                    </VStack>
                  </Card>

                  <Card padding={4}>
                    <VStack gap={3}>
                      <VStack gap={1}>
                        <Heading level={2}>
                          {formatDate(selectedCalendarDate, true)}
                        </Heading>
                        <Text color="secondary">
                          {selectedDateEvents.length.toLocaleString('en-US')}{' '}
                          due dates on selected day
                        </Text>
                      </VStack>
                      <Heading level={2}>
                        {formatMoney(selectedDateAmount)}
                      </Heading>
                    </VStack>
                  </Card>

                  <Card padding={4}>
                    <VStack gap={3}>
                      <VStack gap={1}>
                        <Heading level={2}>Google Calendar</Heading>
                        <Text color="secondary">
                          {googleStatus?.isConnected
                            ? `Connected to ${googleStatus.calendarId}.`
                            : 'Connect Google to sync contract due dates.'}
                        </Text>
                      </VStack>

                      {isGoogleStatusPending || isGoogleStatusFetching ? (
                        <ProgressBar
                          label="Loading Google Calendar status"
                          isLabelHidden
                          isIndeterminate
                        />
                      ) : null}

                      {googleStatus != null && !googleStatus.isConfigured ? (
                        <Text type="supporting" color="secondary">
                          Missing env: {googleStatus.missing.join(', ')}
                        </Text>
                      ) : null}

                      {googleStatus?.accountEmail ? (
                        <Text type="supporting" color="secondary">
                          {googleStatus.accountEmail}
                        </Text>
                      ) : null}

                      {googleStatus?.lastSyncedAt ? (
                        <Text type="supporting" color="secondary">
                          Last synced{' '}
                          {formatDate(googleStatus.lastSyncedAt, true)}
                        </Text>
                      ) : null}

                      {googleSyncSummary != null ? (
                        <Text type="supporting" color="secondary">
                          Synced {googleSyncSummary.total.toLocaleString('en-US')}{' '}
                          due dates. Created {googleSyncSummary.created},
                          updated {googleSyncSummary.updated}, deleted{' '}
                          {googleSyncSummary.deleted}, failed{' '}
                          {googleSyncSummary.failed}.
                        </Text>
                      ) : null}

                      {googleErrorMessage != null ? (
                        <Text type="supporting" color="secondary">
                          {googleErrorMessage}
                        </Text>
                      ) : null}

                      {googleStatus?.isConnected ? (
                        <Button
                          label="Sync to Google"
                          variant="secondary"
                          icon={<Icon icon="calendar" />}
                          isLoading={syncGoogleCalendar.isPending}
                          onClick={() => syncGoogleCalendar.mutate()}
                        />
                      ) : (
                        <Button
                          label="Connect Google"
                          variant="secondary"
                          icon={<Icon icon="externalLink" />}
                          href="/api/calendar/google/connect"
                          isDisabled={googleStatus?.isConfigured === false}
                        />
                      )}
                    </VStack>
                  </Card>
                </VStack>
              </GridSpan>
            </Grid>

            <Section variant="transparent" padding={0}>
              <Card padding={4}>
                {visibleEvents.length === 0 ? (
                  <EmptyState
                    title="No due dates found"
                    description="Add contract start, end, frequency, and due-day values to generate payment due dates."
                    icon={<Icon icon="calendar" />}
                    isCompact
                  />
                ) : (
                  <List
                    density="balanced"
                    hasDividers
                    header={
                      <VStack gap={1}>
                        <Heading level={2}>Due dates</Heading>
                        <Text color="secondary">
                          {selectedContract == null
                            ? 'All generated contract payment dates.'
                            : 'Generated payment dates for the selected contract.'}
                        </Text>
                      </VStack>
                    }
                  >
                    {visibleEvents.map(event => (
                      <ListItem
                        key={event.id}
                        label={`${formatDate(event.date, true)} - ${event.customerName}`}
                        description={
                          <VStack gap={0.5}>
                            <Text type="supporting" color="secondary">
                              {event.targetLabel}
                            </Text>
                            <HStack gap={2} wrap="wrap">
                              <Text type="supporting" color="secondary">
                                {event.frequency}
                              </Text>
                              <Text type="supporting" color="secondary">
                                {formatDueDay(Number(event.date.slice(-2)))}
                              </Text>
                              <HStack gap={1} vAlign="center">
                                <StatusDot
                                  variant={statusVariantOf(event.status)}
                                  label={event.status}
                                />
                                <Text type="supporting" color="secondary">
                                  {event.status}
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                        }
                        startContent={
                          <Icon icon="calendar" color="accent" size="sm" />
                        }
                        endContent={
                          <Text weight="semibold">
                            {formatMoney(event.amount)}
                          </Text>
                        }
                        isSelected={event.date === selectedDate}
                        onClick={() => {
                          setSelectedContractId(event.contractId);
                          setSelectedDate(event.date);
                        }}
                      />
                    ))}
                  </List>
                )}
              </Card>
            </Section>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
