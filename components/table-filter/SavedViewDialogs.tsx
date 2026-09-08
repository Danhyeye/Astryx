import type {Dispatch, SetStateAction} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Layout';
import {Section} from '@astryxdesign/core/Section';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';

import type {GroupField, SavedView, ViewState} from '@/data';
import {styles} from '@/app/table-filter/styles';
import {ViewSummaryList} from './ViewSummaryList';

export function SavedViewDialogs({
  creatingName,
  editing,
  view,
  filters,
  allColumnKeys,
  groupingOptions,
  setCreatingName,
  setEditing,
  onCreate,
  onSaveEdited,
  onDelete,
}: {
  creatingName: string | null;
  editing: SavedView | null;
  view: ViewState;
  filters: PowerSearchFilter[];
  allColumnKeys: readonly string[];
  groupingOptions: ReadonlyArray<{value: GroupField; label: string}>;
  setCreatingName: Dispatch<SetStateAction<string | null>>;
  setEditing: Dispatch<SetStateAction<SavedView | null>>;
  onCreate: (name: string) => void;
  onSaveEdited: (saved: SavedView) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <Dialog
        isOpen={creatingName != null}
        onOpenChange={open => setCreatingName(open ? '' : null)}
        purpose="form"
        width={400}>
        <DialogHeader
          title="Tạo chế độ xem"
          subtitle="Lưu bộ lọc và cấu hình bảng hiện tại."
          onOpenChange={open => setCreatingName(open ? '' : null)}
          xstyle={styles.dialogHeaderBleed}
        />
        <Section variant="transparent" padding={4}>
          <VStack gap={4}>
            <TextInput
              label="Tên"
              value={creatingName ?? ''}
              onChange={setCreatingName}
              hasAutoFocus
            />
            <VStack gap={1}>
              <Text type="label">Chế độ xem này lưu</Text>
              <ViewSummaryList
                view={view}
                filters={filters}
                allColumnKeys={allColumnKeys}
                groupingOptions={groupingOptions}
              />
            </VStack>
            <HStack hAlign="end">
              <Button
                label="Tạo"
                variant="primary"
                isDisabled={(creatingName ?? '').trim() === ''}
                onClick={() => onCreate(creatingName ?? '')}
              />
            </HStack>
          </VStack>
        </Section>
      </Dialog>

      <Dialog
        isOpen={editing != null}
        onOpenChange={open => !open && setEditing(null)}
        purpose="form"
        width={400}>
        <DialogHeader
          title="Chỉnh sửa chế độ xem"
          subtitle="Chỉ đổi tên. Cấu hình giữ nguyên như khi lưu chế độ xem."
          onOpenChange={open => !open && setEditing(null)}
          xstyle={styles.dialogHeaderBleed}
        />
        <Section variant="transparent" padding={4}>
          <VStack gap={4}>
            <TextInput
              label="Tên"
              value={editing?.name ?? ''}
              onChange={value =>
                setEditing(current =>
                  current ? {...current, name: value} : current,
                )
              }
            />
            <VStack gap={1}>
              <Text type="label">Chế độ xem này lưu</Text>
              {editing == null ? (
                <Text type="supporting" color="secondary">
                  Trống
                </Text>
              ) : (
                <ViewSummaryList
                  view={editing.view}
                  filters={editing.filters}
                  allColumnKeys={allColumnKeys}
                  groupingOptions={groupingOptions}
                />
              )}
            </VStack>
            <HStack gap={2} vAlign="center">
              <Button
                label="Xóa"
                variant="destructive"
                onClick={() => editing && onDelete(editing.id)}
              />
              <StackItem size="fill">
                <HStack hAlign="end">
                  <Button
                    label="Lưu"
                    variant="primary"
                    onClick={() => editing && onSaveEdited(editing)}
                  />
                </HStack>
              </StackItem>
            </HStack>
          </VStack>
        </Section>
      </Dialog>
    </>
  );
}
