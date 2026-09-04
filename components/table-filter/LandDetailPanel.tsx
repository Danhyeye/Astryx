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
  type LandTableRow,
} from '@/data';
import {styles} from '@/app/table-filter/styles';
import type {Plot} from '@/types/plot';
import {formatArea, formatDate, formatMoney} from '@/utils/format';
import {LandImageGallery} from './LandImageGallery';

export function LandDetailPanel({
  land,
  plots,
  contracts,
  resizable,
  onClose,
  onSelectPlot,
  onSelectContract,
  onEditLand,
  onDeleteLand,
}: {
  land: LandTableRow;
  plots: Plot[];
  contracts: ContractTableRow[];
  resizable: ResizableProps;
  onClose: () => void;
  onSelectPlot: (plotId: string) => void;
  onSelectContract: (contractId: string) => void;
  onEditLand: (land: LandTableRow) => void;
  onDeleteLand: (land: LandTableRow) => void;
}) {
  return (
    <>
      <ResizeHandle
        resizable={resizable}
        isReversed
        isAlwaysVisible={false}
        label="Resize land details"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Land details">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Badge
                        variant="neutral"
                        label={`${plots.length} ${
                          plots.length === 1 ? 'plot' : 'plots'
                        }`}
                      />
                      <Badge
                        variant="neutral"
                        label={`${contracts.length} ${
                          contracts.length === 1 ? 'contract' : 'contracts'
                        }`}
                      />
                      <Text type="supporting" color="secondary">
                        {land.id}
                      </Text>
                    </HStack>
                    <Heading level={2}>{land.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {land.location || 'No location'}
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
                  label="Edit land"
                  size="sm"
                  width="100%"
                  onClick={() => onEditLand(land)}
                />
                <Button
                  label="Delete"
                  variant="destructive"
                  size="sm"
                  width="100%"
                  onClick={() => onDeleteLand(land)}
                />
              </HStack>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={3}>
              <LandImageGallery
                images={land.images}
                emptyLabel="No land images"
              />
              <Divider />
              <MetadataList
                columns="single"
                label={{position: 'start', width: 116}}>
                <MetadataListItem label="Location">
                  <Text type="body">{land.location || 'Not set'}</Text>
                </MetadataListItem>
                <MetadataListItem label="Area">
                  <Text type="body">{formatArea(land.areaSqm)}</Text>
                </MetadataListItem>
                <MetadataListItem label="Images">
                  <Text type="body">
                    {land.imageCount.toLocaleString('en-US')}
                  </Text>
                </MetadataListItem>
                <MetadataListItem label="Created">
                  <Text type="body">{formatDate(land.createdAt, true)}</Text>
                </MetadataListItem>
                <MetadataListItem label="Updated">
                  <Text type="body">{formatDate(land.updatedAt, true)}</Text>
                </MetadataListItem>
                <MetadataListItem label="Description">
                  <Text type="body">{land.description || 'None'}</Text>
                </MetadataListItem>
              </MetadataList>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Plots</Heading>
              {plots.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No plots found for this land.
                </Text>
              ) : (
                <VStack gap={0}>
                  {plots.map(plot => {
                    const meta = PLOT_STATUS_META[plot.status];
                    return (
                      <Item
                        key={plot.id}
                        align="center"
                        label={`Plot ${plot.plot_number}`}
                        labelLines={2}
                        description={`${formatArea(plot.area_sqm)} - ${
                          plot.description || 'No description'
                        }`}
                        endContent={
                          <Badge variant={meta.badge} label={meta.label} />
                        }
                        onClick={() => onSelectPlot(plot.id)}
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
              <Heading level={3}>Contracts</Heading>
              {contracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No contracts found for this land.
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
