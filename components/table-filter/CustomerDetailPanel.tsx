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
  type ContractTableRow,
  type CustomerTableRow,
} from '@/data';
import {styles} from '@/app/table-filter/styles';
import {formatDate, formatMoney} from '@/utils/format';

export function CustomerDetailPanel({
  customer,
  contracts,
  resizable,
  onClose,
  onSelectContract,
  onEditCustomer,
  onDeleteCustomer,
}: {
  customer: CustomerTableRow;
  contracts: ContractTableRow[];
  resizable: ResizableProps;
  onClose: () => void;
  onSelectContract: (contractId: string) => void;
  onEditCustomer: (customer: CustomerTableRow) => void;
  onDeleteCustomer: (customer: CustomerTableRow) => void;
}) {
  return (
    <>
      <ResizeHandle
        resizable={resizable}
        isReversed
        isAlwaysVisible={false}
        label="Thay đổi kích thước chi tiết khách hàng"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Chi tiết khách hàng">
        <VStack gap={0} xstyle={styles.detailPanel}>
          <Section variant="transparent" padding={4}>
            <VStack gap={4}>
              <HStack gap={2}>
                <StackItem size="fill">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Badge
                        variant="neutral"
                        label={`${contracts.length} ${
                          'hợp đồng'
                        }`}
                      />
                      <Text type="supporting" color="secondary">
                        {customer.id}
                      </Text>
                    </HStack>
                    <Heading level={2}>{customer.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {customer.email || customer.phone || 'Chưa có thông tin liên hệ'}
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
                  label="Chỉnh sửa khách hàng"
                  size="sm"
                  width="100%"
                  onClick={() => onEditCustomer(customer)}
                />
                {/* <Button
                  label="Xóa"
                  variant="destructive"
                  size="sm"
                  width="100%"
                  onClick={() => onDeleteCustomer(customer)}
                /> */}
              </HStack>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Số điện thoại">
                <Text type="body">{customer.phone || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Email">
                <Text type="body">{customer.email || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Địa chỉ">
                <Text type="body">{customer.address || 'Chưa thiết lập'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ngày tạo">
                <Text type="body">{formatDate(customer.createdAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ngày cập nhật">
                <Text type="body">{formatDate(customer.updatedAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Ghi chú">
                <Text type="body">{customer.notes || 'Không có'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Hợp đồng</Heading>
              {contracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  Khách hàng chưa có hợp đồng.
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
                        description={`${contract.land} - ${formatMoney(
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
