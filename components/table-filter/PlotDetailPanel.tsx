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
  PLOT_STATUS_META,
  type ContractTableRow,
  type PlotTableRow,
} from '@/data';
import {styles} from '@/app/table-filter/styles';
import type {Land} from '@/types/land';
import {formatArea, formatDate, formatMoney} from '@/utils/format';

export function PlotDetailPanel({
  plot,
  land,
  contracts,
  resizable,
  onClose,
  onSelectLand,
  onSelectContract,
  onEditPlot,
  onDeletePlot,
}: {
  plot: PlotTableRow;
  land: Land | null;
  contracts: ContractTableRow[];
  resizable: ResizableProps;
  onClose: () => void;
  onSelectLand: (landId: string) => void;
  onSelectContract: (contractId: string) => void;
  onEditPlot: (plot: PlotTableRow) => void;
  onDeletePlot: (plot: PlotTableRow) => void;
}) {
  const plotStatus = PLOT_STATUS_META[plot.status];

  return (
    <>
      <ResizeHandle
        resizable={resizable}
        isReversed
        isAlwaysVisible={false}
        label="Resize plot details"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Plot details">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Badge variant={plotStatus.badge} label={plotStatus.label} />
                      <Badge
                        variant="neutral"
                        label={`${contracts.length} ${
                          contracts.length === 1 ? 'contract' : 'contracts'
                        }`}
                      />
                      <Text type="supporting" color="secondary">
                        {plot.id}
                      </Text>
                    </HStack>
                    <Heading level={2}>{plot.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {plot.landLocation || 'No location'}
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
                  label="Edit plot"
                  size="sm"
                  width="100%"
                  onClick={() => onEditPlot(plot)}
                />
                <Button
                  label="Delete"
                  variant="destructive"
                  size="sm"
                  width="100%"
                  onClick={() => onDeletePlot(plot)}
                />
              </HStack>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Plot no.">
                <Text type="body">{plot.plotNumber}</Text>
              </MetadataListItem>
              <MetadataListItem label="Land">
                <Text type="body">{plot.land}</Text>
              </MetadataListItem>
              <MetadataListItem label="Location">
                <Text type="body">{plot.landLocation || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Area">
                <Text type="body">{formatArea(plot.areaSqm)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Images">
                <Text type="body">{plot.imageCount.toLocaleString('en-US')}</Text>
              </MetadataListItem>
              <MetadataListItem label="Created">
                <Text type="body">{formatDate(plot.createdAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Updated">
                <Text type="body">{formatDate(plot.updatedAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Description">
                <Text type="body">{plot.description || 'None'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Land</Heading>
              {land == null ? (
                <Text type="supporting" color="secondary">
                  No land record found for this plot.
                </Text>
              ) : (
                <Item
                  align="center"
                  label={land.name}
                  labelLines={2}
                  description={`${formatArea(land.area_sqm)} - ${
                    land.location || 'No location'
                  }`}
                  onClick={() => onSelectLand(land.id)}
                />
              )}
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Contracts</Heading>
              {contracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No contracts found for this plot.
                </Text>
              ) : (
                <VStack gap={0}>
                  {contracts.map(contract => {
                    const meta = CONTRACT_STATUS_META[contract.status];
                    return (
                      <Item
                        key={contract.id}
                        align="center"
                        label={contract.summary}
                        labelLines={2}
                        description={`${contract.customer} - ${formatMoney(
                          contract.rentAmount,
                        )}`}
                        endContent={
                          <Badge variant={meta.badge} label={meta.label} />
                        }
                        onClick={() => onSelectContract(contract.id)}
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
