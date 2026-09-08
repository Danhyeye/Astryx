import {EntityStatus} from './EntityStatus';
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
        label="Thay đổi kích thước chi tiết lô đất"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Chi tiết lô đất">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <EntityStatus variant={plotStatus.badge} label={plotStatus.label} />
                      <Badge
                        variant="neutral"
                        label={`${contracts.length} ${
                          'hợp đồng'
                        }`}
                      />
                      <Text type="supporting" color="secondary">
                        {plot.id}
                      </Text>
                    </HStack>
                    <Heading level={2}>{plot.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {plot.landLocation || 'Chưa có vị trí'}
                    </Text>
                  </VStack>
                </StackItem>
                <IconButton
                  label="Đóng chi tiết"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={X} size="sm" />}
                  onClick={onClose}
                />
              </HStack>

              <HStack gap={2}>
                <Button
                  label="Chỉnh sửa lô đất"
                  size="sm"
                  width="100%"
                  onClick={() => onEditPlot(plot)}
                />
                <Button
                  label="Xóa"
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
              <MetadataListItem label="Mã lô đất">
                <Text type="body">{plot.plotNumber}</Text>
              </MetadataListItem>
              <MetadataListItem label="Khu đất">
                <Text type="body">{plot.land}</Text>
              </MetadataListItem>
              <MetadataListItem label="Vị trí">
                <Text type="body">{plot.landLocation || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Diện tích">
                <Text type="body">{formatArea(plot.areaSqm)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Hình ảnh">
                <Text type="body">{plot.imageCount.toLocaleString('vi-VN')}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ngày tạo">
                <Text type="body">{formatDate(plot.createdAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ngày cập nhật">
                <Text type="body">{formatDate(plot.updatedAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Mô tả">
                <Text type="body">{plot.description || 'Không có'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Khu đất</Heading>
              {land == null ? (
                <Text type="supporting" color="secondary">
                  Không tìm thấy khu đất của lô đất này.
                </Text>
              ) : (
                <Item
                  align="center"
                  label={land.name}
                  labelLines={2}
                  description={`${formatArea(land.area_sqm)} - ${
                    land.location || 'Chưa có vị trí'
                  }`}
                  onClick={() => onSelectLand(land.id)}
                />
              )}
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Hợp đồng</Heading>
              {contracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  Lô đất chưa có hợp đồng.
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
                          <EntityStatus variant={meta.badge} label={meta.label} />
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
