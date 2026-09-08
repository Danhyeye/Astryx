import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack, StackItem} from '@astryxdesign/core/Layout';
import {Section} from '@astryxdesign/core/Section';
import {Text} from '@astryxdesign/core/Text';
import {SquarePen, Trash2} from 'lucide-react';

import {styles} from '@/app/table-filter/styles';

export function BulkActionBar({
  selectedCount,
  singularLabel,
  pluralLabel,
  isEditDisabled,
  editDisabledMessage,
  isDeleteDisabled,
  deleteDisabledMessage,
  onEditSelected,
  onDeleteSelected,
  onClearSelection,
}: {
  selectedCount: number;
  singularLabel: string;
  pluralLabel: string;
  isEditDisabled: boolean;
  editDisabledMessage: string;
  isDeleteDisabled: boolean;
  deleteDisabledMessage: string;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}) {
  const selectionLabel = selectedCount === 1 ? singularLabel : pluralLabel;

  return (
    <Section
      variant="muted"
      paddingInline={3}
      paddingBlock={1.5}
      xstyle={[styles.bulkBand, styles.bulkBandEnter]}>
      <HStack
        gap={3}
        vAlign="center"
        wrap="wrap"
        minHeight={32}
        xstyle={styles.bar}>
        <StackItem size="fill">
          <HStack gap={1} vAlign="center">
            <Button
              label="Chỉnh sửa"
              variant="ghost"
              size="sm"
              icon={<Icon icon={SquarePen} size="sm" />}
              isDisabled={isEditDisabled}
              tooltip={isEditDisabled ? editDisabledMessage : undefined}
              onClick={onEditSelected}
            />
            <Button
              label="Xóa"
              variant="destructive"
              size="sm"
              icon={<Icon icon={Trash2} size="sm" />}
              isDisabled={isDeleteDisabled}
              tooltip={isDeleteDisabled ? deleteDisabledMessage : undefined}
              onClick={onDeleteSelected}
            />
          </HStack>
        </StackItem>

        <HStack gap={3} vAlign="center">
          <Text type="body">
            {selectedCount} {selectionLabel} đã chọn
          </Text>
          <Text type="supporting" color="secondary">
            {'\u2022'}
          </Text>
          <Button
            label="Bỏ chọn tất cả"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          />
        </HStack>
      </HStack>
    </Section>
  );
}
