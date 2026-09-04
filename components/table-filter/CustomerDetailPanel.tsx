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
        label="Resize customer details"
      />
      <LayoutPanel
        resizable={resizable}
        hasDivider
        padding={0}
        label="Customer details">
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
                          contracts.length === 1 ? 'contract' : 'contracts'
                        }`}
                      />
                      <Text type="supporting" color="secondary">
                        {customer.id}
                      </Text>
                    </HStack>
                    <Heading level={2}>{customer.summary}</Heading>
                    <Text type="supporting" color="secondary">
                      {customer.email || customer.phone || 'No contact info'}
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
                  label="Edit customer"
                  size="sm"
                  width="100%"
                  onClick={() => onEditCustomer(customer)}
                />
                <Button
                  label="Delete"
                  variant="destructive"
                  size="sm"
                  width="100%"
                  onClick={() => onDeleteCustomer(customer)}
                />
              </HStack>
            </VStack>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <MetadataList columns="single" label={{position: 'start', width: 116}}>
              <MetadataListItem label="Phone">
                <Text type="body">{customer.phone || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Email">
                <Text type="body">{customer.email || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Address">
                <Text type="body">{customer.address || 'Not set'}</Text>
              </MetadataListItem>
              <MetadataListItem label="Created">
                <Text type="body">{formatDate(customer.createdAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Updated">
                <Text type="body">{formatDate(customer.updatedAt, true)}</Text>
              </MetadataListItem>
              <MetadataListItem label="Notes">
                <Text type="body">{customer.notes || 'None'}</Text>
              </MetadataListItem>
            </MetadataList>
          </Section>

          <Divider />

          <Section variant="transparent" padding={4}>
            <VStack gap={2}>
              <Heading level={3}>Contracts</Heading>
              {contracts.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No contracts found for this customer.
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
