import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Divider} from '@astryxdesign/core/Divider';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Item} from '@astryxdesign/core/Item';
import {HStack, LayoutPanel, StackItem, VStack} from '@astryxdesign/core/Layout';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {ResizeHandle} from '@astryxdesign/core/Resizable';
import type {ResizableProps} from '@astryxdesign/core/Resizable';
import {Section} from '@astryxdesign/core/Section';
import {Heading, Text} from '@astryxdesign/core/Text';
import {X} from 'lucide-react';

import {
  CONTRACT_STATUS_META,
  PAYMENT_FREQUENCY_META,
  PLOT_STATUS_META,
  daysUntil,
  type ContractTableRow,
} from '@/data';
import {styles} from '@/app/table-filter/styles';
import type {Plot} from '@/types/plot';
import {formatArea, formatDate, formatDueDay, formatMoney} from '@/utils/format';

export function ContractDetailPanel({
  contract,
  relatedContracts,
  landPlots,
  resizable,
  onClose,
  onSelectContract,
  onEditContract,
}: {
  contract: ContractTableRow;
  relatedContracts: ContractTableRow[];
  landPlots: Plot[];
  resizable: ResizableProps;
  onClose: () => void;
  onSelectContract: (contractId: string) => void;
  onEditContract: (contract: ContractTableRow) => void;
}) {
  const contractStatus = CONTRACT_STATUS_META[contract.status];
  const plotStatus = PLOT_STATUS_META[contract.plotStatus];
  const frequency = PAYMENT_FREQUENCY_META[contract.paymentFrequency];
  const dueInDays = daysUntil(contract.nextPaymentDueDate);
  const dueDescription =
    dueInDays == null
      ? 'No due date'
      : dueInDays < 0
        ? `${Math.abs(dueInDays)} days overdue`
        : dueInDays === 0
          ? 'Due today'
          : `Due in ${dueInDays} days`;
  const leaseDuration =
    contract.leaseDurationMonths > 0
      ? `${contract.leaseDurationMonths} months`
      : 'Not set';

  return (
    <>
      <ResizeHandle
        resizable={resizable}
        isReversed
        isAlwaysVisible={false}
        label="Resize contract details"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Contract details">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Badge
                        variant={contractStatus.badge}
                        label={contractStatus.label}
                      />
                      <Badge variant={plotStatus.badge} label={plotStatus.label} />
                      <Text type="supporting" color="secondary">
                        {contract.contractId}
                      </Text>
                    </HStack>
                    <Heading level={2}>{contract.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {dueDescription}
                    </Text>
                  </VStack>
                </StackItem>
                <IconButton
                  label="Close details"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={X} size="sm" />}
                  onClick={onClose}
                />
              </HStack>

              <HStack gap={2}>
                <Button
                  label="Edit contract"
                  size="sm"
                  width="100%"
                  onClick={() => onEditContract(contract)}
                />
              </HStack>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Customer">
                <Text type="body">{contract.customer}</Text>
              </MetadataListItem>
              <MetadataListItem label="Phone">
                <Text type="body">{contract.customerPhone || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Email">
                <Text type="body">{contract.customerEmail || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Land">
                <Text type="body">{contract.land}</Text>
              </MetadataListItem>
              <MetadataListItem label="Location">
                <Text type="body">{contract.landLocation || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Plot">
                <Text type="body">{contract.plot}</Text>
              </MetadataListItem>
              <MetadataListItem label="Area">
                <Text type="body">{formatArea(contract.areaSqm)}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Rent">
                <Text type="body">{formatMoney(contract.rentAmount)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Deposit">
                <Text type="body">{formatMoney(contract.depositAmount)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Frequency">
                <Text type="body">{frequency.label}</Text>
              </MetadataListItem>
              <MetadataListItem label="Due day">
                <Text type="body">{formatDueDay(contract.paymentDueDay)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Next payment">
                <Text type="body">{formatDate(contract.nextPaymentDueDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Term">
                <Text type="body">{leaseDuration}</Text>
              </MetadataListItem>
              <MetadataListItem label="Start">
                <Text type="body">{formatDate(contract.startDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="End">
                <Text type="body">{formatDate(contract.endDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Notes">
                <Text type="body">{contract.notes || 'None'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Customer contracts</Heading>
              {relatedContracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No other contracts found for this customer.
                </Text>
              ) : (
                <VStack gap={0}>
                  {relatedContracts.map(related => {
                    const relatedStatus = CONTRACT_STATUS_META[related.status];
                    return (
                      <Item
                        key={related.id}
                        align="center"
                        label={related.summary}
                        labelLines={2}
                        description={`${formatMoney(related.rentAmount)} - ${formatDate(related.nextPaymentDueDate, true)}`}
                        endContent={
                          <Badge
                            variant={relatedStatus.badge}
                            label={relatedStatus.label}
                          />
                        }
                        onClick={() => onSelectContract(related.id)}
                      />
                    );
                  })}
                </VStack>
              )}
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Land plots</Heading>
              {landPlots.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No plots found for this land.
                </Text>
              ) : (
                <VStack gap={0}>
                  {landPlots.map(plot => {
                    const meta = PLOT_STATUS_META[plot.status];
                    return (
                      <Item
                        key={plot.id}
                        align="center"
                        label={`Plot ${plot.plot_number}`}
                        labelLines={2}
                        description={`${formatArea(plot.area_sqm)} - ${plot.description || 'No description'}`}
                        endContent={
                          <Badge variant={meta.badge} label={meta.label} />
                        }
                      />
                    );
                  })}
                </VStack>
              )}
            </VStack>
          </Section>
        </VStack>
      </LayoutPanel>
    </>
  );
}
