import {EntityStatus} from './EntityStatus';
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
      ? 'Chưa có hạn thanh toán'
      : dueInDays < 0
        ? `${Math.abs(dueInDays)} ngày quá hạn`
        : dueInDays === 0
          ? 'Đến hạn hôm nay'
          : `Đến hạn sau ${dueInDays} ngày`;
  const leaseDuration =
    contract.leaseDurationMonths > 0
      ? `${contract.leaseDurationMonths} tháng`
      : 'Chưa thiết lập';

  return (
    <>
      <ResizeHandle
        resizable={resizable}
        isReversed
        isAlwaysVisible={false}
        label="Thay đổi kích thước chi tiết hợp đồng"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Chi tiết hợp đồng">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <EntityStatus
                        variant={contractStatus.badge}
                        label={contractStatus.label}
                      />
                      {contract.plotIds.length > 0 && <EntityStatus variant={plotStatus.badge} label={plotStatus.label} />}
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
                  label="Đóng chi tiết"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={X} size="sm" />}
                  onClick={onClose}
                />
              </HStack>

              <HStack gap={2}>
                <Button
                  label="Chỉnh sửa hợp đồng"
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
              <MetadataListItem label="Khách hàng">
                <Text type="body">{contract.customer}</Text>
              </MetadataListItem>
              <MetadataListItem label="Số điện thoại">
                <Text type="body">{contract.customerPhone || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Email">
                <Text type="body">{contract.customerEmail || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Khu đất">
                <Text type="body">{contract.land}</Text>
              </MetadataListItem>
              <MetadataListItem label="Vị trí">
                <Text type="body">{contract.landLocation || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              {contract.plotIds.length > 0 && <MetadataListItem label="Lô đất">
                <Text type="body">{contract.plot}</Text>
              </MetadataListItem>}
              <MetadataListItem label="Diện tích">
                <Text type="body">{formatArea(contract.areaSqm)}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Tiền thuê">
                <Text type="body">{formatMoney(contract.rentAmount)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Tiền đặt cọc">
                <Text type="body">{formatMoney(contract.depositAmount)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Chu kỳ">
                <Text type="body">{frequency.label}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ngày đến hạn">
                <Text type="body">{formatDueDay(contract.paymentDueDay)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Thanh toán tiếp theo">
                <Text type="body">{formatDate(contract.nextPaymentDueDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Thời hạn">
                <Text type="body">{leaseDuration}</Text>
              </MetadataListItem>
              <MetadataListItem label="Bắt đầu">
                <Text type="body">{formatDate(contract.startDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Kết thúc">
                <Text type="body">{formatDate(contract.endDate, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ghi chú">
                <Text type="body">{contract.notes || 'Không có'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Hợp đồng của khách hàng</Heading>
              {relatedContracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  Khách hàng không có hợp đồng khác.
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
                          <EntityStatus
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
              <Heading level={3}>Lô đất thuộc khu đất</Heading>
              {landPlots.length === 0 ? (
                <Text type="supporting" color="secondary">
                  Khu đất chưa có lô đất.
                </Text>
              ) : (
                <VStack gap={0}>
                  {landPlots.map(plot => {
                    const meta = PLOT_STATUS_META[plot.status];
                    return (
                      <Item
                        key={plot.id}
                        align="center"
                        label={`Lô đất ${plot.plot_number}`}
                        labelLines={2}
                        description={`${formatArea(plot.area_sqm)} - ${plot.description || 'Chưa có mô tả'}`}
                        endContent={
                          <EntityStatus variant={meta.badge} label={meta.label} />
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
