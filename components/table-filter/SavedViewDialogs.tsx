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
          title="Create new saved view"
          subtitle="Captures the filters and the table configuration as they are now."
          onOpenChange={open => setCreatingName(open ? '' : null)}
          xstyle={styles.dialogHeaderBleed}
        />
        <Section variant="transparent" padding={4}>
          <VStack gap={4}>
            <TextInput
              label="Name"
              value={creatingName ?? ''}
              onChange={setCreatingName}
              hasAutoFocus
            />
            <VStack gap={1}>
              <Text type="label">This view saves</Text>
              <ViewSummaryList
                view={view}
                filters={filters}
                allColumnKeys={allColumnKeys}
                groupingOptions={groupingOptions}
              />
            </VStack>
            <HStack hAlign="end">
              <Button
                label="Create"
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
          title="Edit saved view"
          subtitle="Renaming only. The configuration is what was captured when the view was saved."
          onOpenChange={open => !open && setEditing(null)}
          xstyle={styles.dialogHeaderBleed}
        />
        <Section variant="transparent" padding={4}>
          <VStack gap={4}>
            <TextInput
              label="Name"
              value={editing?.name ?? ''}
              onChange={value =>
                setEditing(current =>
                  current ? {...current, name: value} : current,
                )
              }
            />
            <VStack gap={1}>
              <Text type="label">This view saves</Text>
              {editing == null ? (
                <Text type="supporting" color="secondary">
                  (Empty)
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
                label="Delete"
                variant="destructive"
                onClick={() => editing && onDelete(editing.id)}
              />
              <StackItem size="fill">
                <HStack hAlign="end">
                  <Button
                    label="Save"
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
