import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Item} from '@astryxdesign/core/Item';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Layout';
import {List} from '@astryxdesign/core/List';
import {Popover} from '@astryxdesign/core/Popover';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {Section} from '@astryxdesign/core/Section';
import {Heading, Text} from '@astryxdesign/core/Text';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {useAnnounce} from '@astryxdesign/core/hooks';
import {
  ChevronDown,
  Columns3,
  GripVertical,
  Pin,
  Plus,
  Table as TableIcon,
  Table2,
  X,
} from 'lucide-react';

import {
  DENSITY_OPTIONS,
  REORDER_DRAG_THRESHOLD,
  STICKY_END_OPTIONS,
  STICKY_START_OPTIONS,
  VIEW_SECTIONS,
  type ColumnReorderSession,
  type Density,
  type GroupField,
  type StickyEdge,
  type ViewSection,
  type ViewState,
} from '@/data';
import {reorderStyles, styles} from '@/app/table-filter/styles';

const VIEW_SECTION_ICONS: Record<ViewSection, ReactNode> = {
  columns: <Icon icon={Columns3} size="sm" />,
  density: <Icon icon={TableIcon} size="sm" />,
  sticky: <Icon icon={Pin} size="sm" />,
  grouping: <Icon icon={Table2} size="sm" />,
};

export function ViewOptionsPopover({
  view,
  allColumnKeys,
  defaultColumnKeys,
  columnLabels,
  lockedColumnKey,
  lockedColumnMessage,
  groupingOptions,
  onViewChange,
}: {
  view: ViewState;
  allColumnKeys: readonly string[];
  defaultColumnKeys: readonly string[];
  columnLabels: Record<string, string>;
  lockedColumnKey: string;
  lockedColumnMessage: string;
  groupingOptions: ReadonlyArray<{value: GroupField; label: string}>;
  onViewChange: (patch: (current: ViewState) => ViewState) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewSection, setViewSection] = useState<ViewSection>('columns');
  const [reorderSession, setReorderSessionState] =
    useState<ColumnReorderSession | null>(null);
  const reorderSessionRef = useRef<ColumnReorderSession | null>(null);
  const columnRowRefs = useRef(new Map<string, HTMLElement>());
  const suppressGripClickRef = useRef(false);
  const announce = useAnnounce();
  const columnPanelId = useId();

  const displayedColumns = view.columnKeys;
  const availableColumns = useMemo(
    () => allColumnKeys.filter(key => !view.columnKeys.includes(key)),
    [allColumnKeys, view.columnKeys],
  );

  const setReorderSession = (next: ColumnReorderSession | null) => {
    reorderSessionRef.current = next;
    setReorderSessionState(next);
  };

  const commitColumnOrder = (nextKeys: readonly string[]) => {
    onViewChange(current => ({...current, columnKeys: [...nextKeys]}));
  };

  const moveColumn = (key: string, requestedIndex: number) => {
    const from = displayedColumns.indexOf(key);
    const to = Math.max(
      0,
      Math.min(displayedColumns.length - 1, requestedIndex),
    );
    if (from < 0 || to === from) {
      return false;
    }
    const nextKeys = [...displayedColumns];
    nextKeys.splice(from, 1);
    nextKeys.splice(to, 0, key);
    commitColumnOrder(nextKeys);
    return true;
  };

  const handleGripClick = (key: string) => {
    if (suppressGripClickRef.current) {
      suppressGripClickRef.current = false;
      return;
    }
    const index = displayedColumns.indexOf(key);
    if (reorderSessionRef.current?.key === key) {
      setReorderSession(null);
      announce(
        `${columnLabels[key]} dropped at position ${index + 1} of ${displayedColumns.length}.`,
      );
      return;
    }
    setReorderSession({
      key,
      mode: 'keyboard',
      originalKeys: [...displayedColumns],
      fromIndex: index,
      toIndex: index,
    });
    announce(
      `${columnLabels[key]} picked up, position ${index + 1} of ${displayedColumns.length}. Use the arrow keys to move it, Space or Enter to drop, or Escape to cancel.`,
    );
  };

  const handleGripKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    key: string,
  ) => {
    const session = reorderSessionRef.current;
    if (event.key === 'Escape' && session?.key === key) {
      event.preventDefault();
      event.stopPropagation();
      if (
        session.originalKeys.join() !== displayedColumns.join() &&
        displayedColumns.includes(key)
      ) {
        commitColumnOrder(session.originalKeys);
      }
      setReorderSession(null);
      announce(`${columnLabels[key]} move cancelled.`);
      return;
    }

    const index = displayedColumns.indexOf(key);
    const targets: Record<string, number> = {
      ArrowUp: index - 1,
      ArrowDown: index + 1,
      Home: 0,
      End: displayedColumns.length - 1,
    };
    const target = targets[event.key];
    if (target == null) {
      return;
    }

    event.preventDefault();
    if (moveColumn(key, target)) {
      announce(
        `${columnLabels[key]}, position ${Math.max(0, Math.min(displayedColumns.length - 1, target)) + 1} of ${displayedColumns.length}.`,
      );
    }
  };

  const handleGripPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    key: string,
  ) => {
    if (event.button !== 0 || columnRowRefs.current.get(key) == null) {
      return;
    }
    suppressGripClickRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const index = displayedColumns.indexOf(key);
    setReorderSession({
      key,
      mode: 'pointer',
      originalKeys: [...displayedColumns],
      fromIndex: index,
      toIndex: index,
      pointerId: event.pointerId,
      pointerStartY: event.clientY,
      hasPointerMoved: false,
    });
  };

  const handleGripPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const session = reorderSessionRef.current;
    if (session?.mode !== 'pointer' || session.pointerId !== event.pointerId) {
      return;
    }
    const travel = Math.abs(event.clientY - (session.pointerStartY ?? 0));
    if (session.hasPointerMoved !== true && travel < REORDER_DRAG_THRESHOLD) {
      return;
    }

    const remaining = session.originalKeys.filter(key => key !== session.key);
    let toIndex = remaining.length;
    for (let i = 0; i < remaining.length; i += 1) {
      const row = columnRowRefs.current.get(remaining[i]);
      if (row == null) {
        continue;
      }
      const bounds = row.getBoundingClientRect();
      if (event.clientY < bounds.top + bounds.height / 2) {
        toIndex = i;
        break;
      }
    }
    if (session.hasPointerMoved === true && session.toIndex === toIndex) {
      return;
    }
    setReorderSession({...session, hasPointerMoved: true, toIndex});
  };

  const handleGripPointerEnd = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cancelled: boolean,
  ) => {
    const session = reorderSessionRef.current;
    if (session?.mode !== 'pointer' || session.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    setReorderSession(null);
    if (cancelled || session.hasPointerMoved !== true) {
      suppressGripClickRef.current = false;
      return;
    }
    setTimeout(() => {
      suppressGripClickRef.current = false;
    }, 0);
    if (session.toIndex === session.fromIndex) {
      return;
    }
    const nextKeys = [...session.originalKeys];
    nextKeys.splice(session.fromIndex, 1);
    nextKeys.splice(session.toIndex, 0, session.key);
    commitColumnOrder(nextKeys);
    announce(
      `${columnLabels[session.key]} dropped at position ${session.toIndex + 1} of ${session.originalKeys.length}.`,
    );
  };

  const columnDropPlacement = useMemo(() => {
    if (
      reorderSession?.mode !== 'pointer' ||
      reorderSession.hasPointerMoved !== true ||
      reorderSession.toIndex === reorderSession.fromIndex
    ) {
      return null;
    }
    const remaining = reorderSession.originalKeys.filter(
      key => key !== reorderSession.key,
    );
    const before = remaining[reorderSession.toIndex];
    if (before != null) {
      return {key: before, position: 'before' as const};
    }
    const after = remaining[remaining.length - 1];
    return after == null ? null : {key: after, position: 'after' as const};
  }, [reorderSession]);

  const viewPanelBody = () => {
    switch (viewSection) {
      case 'columns':
        return (
          <VStack gap={0} minHeight={0} xstyle={styles.transferRoot}>
            <VisuallyHidden id={`${columnPanelId}-reorder-hint`}>
              Press Space or Enter to pick up a column. Use the arrow keys to
              move it, Space or Enter to drop, or Escape to cancel.
            </VisuallyHidden>

            <HStack gap={0} minHeight={0} xstyle={styles.transferPanels}>
              <VStack
                gap={0}
                role="group"
                aria-labelledby={`${columnPanelId}-displayed`}
                xstyle={styles.transferPanel}>
                <HStack
                  gap={2}
                  vAlign="center"
                  hAlign="between"
                  paddingBlock={2}
                  xstyle={[
                    styles.transferPanelHeader,
                    styles.transferPadStart,
                  ]}>
                  <Text
                    id={`${columnPanelId}-displayed`}
                    type="label"
                    color="secondary">
                    Cột đang hiển thị
                  </Text>
                  <Button
                    label="Khôi phục"
                    variant="ghost"
                    size="sm"
                    xstyle={styles.transferHeaderAction}
                    onClick={() =>
                      onViewChange(current => ({
                        ...current,
                        columnKeys: [...defaultColumnKeys],
                      }))
                    }
                  />
                </HStack>
                <VStack gap={0} xstyle={styles.transferPanelBody}>
                  {displayedColumns.length === 0 ? (
                    <VStack
                      gap={0}
                      vAlign="center"
                      hAlign="center"
                      minHeight="100%"
                      paddingBlock={4}
                      xstyle={[styles.transferEmpty, styles.transferPadStart]}>
                      <Text type="supporting" color="secondary">
                        Chưa hiển thị cột nào.
                      </Text>
                    </VStack>
                  ) : (
                    <List
                      density="compact"
                      header={
                        <VisuallyHidden>Cột đang hiển thị</VisuallyHidden>
                      }>
                      {displayedColumns.map(key => {
                        const isLocked = key === lockedColumnKey;
                        const isPicked =
                          reorderSession?.key === key &&
                          reorderSession.mode === 'keyboard';
                        const isDragging =
                          reorderSession?.key === key &&
                          reorderSession.mode === 'pointer' &&
                          reorderSession.hasPointerMoved === true;
                        const drop =
                          columnDropPlacement?.key === key
                            ? columnDropPlacement.position
                            : null;
                        return (
                          <Item
                            key={key}
                            as="li"
                            density="compact"
                            ref={node => {
                              if (node == null) {
                                columnRowRefs.current.delete(key);
                              } else {
                                columnRowRefs.current.set(key, node);
                              }
                            }}
                            label={columnLabels[key]}
                            startContent={
                              <IconButton
                                label={`Reorder ${columnLabels[key]}`}
                                aria-describedby={`${columnPanelId}-reorder-hint`}
                                aria-pressed={isPicked}
                                variant="ghost"
                                size="sm"
                                icon={<Icon icon={GripVertical} size="sm" />}
                                xstyle={[
                                  styles.transferGrip,
                                  reorderStyles.handle,
                                  (isPicked || isDragging) &&
                                    reorderStyles.handleActive,
                                ]}
                                onClick={() => handleGripClick(key)}
                                onKeyDown={event =>
                                  handleGripKeyDown(event, key)
                                }
                                onPointerDown={event =>
                                  handleGripPointerDown(event, key)
                                }
                                onPointerMove={handleGripPointerMove}
                                onPointerUp={event =>
                                  handleGripPointerEnd(event, false)
                                }
                                onPointerCancel={event =>
                                  handleGripPointerEnd(event, true)
                                }
                                onLostPointerCapture={event =>
                                  handleGripPointerEnd(event, true)
                                }
                              />
                            }
                            endContent={
                              <IconButton
                                label={`Remove ${columnLabels[key]}`}
                                variant="ghost"
                                size="sm"
                                isDisabled={isLocked}
                                tooltip={
                                  isLocked ? lockedColumnMessage : undefined
                                }
                                icon={<Icon icon={X} size="sm" />}
                                xstyle={styles.transferEndAction}
                                onClick={() =>
                                  onViewChange(current => ({
                                    ...current,
                                    columnKeys: current.columnKeys.filter(
                                      item => item !== key,
                                    ),
                                  }))
                                }
                              />
                            }
                            xstyle={[
                              styles.transferItem,
                              styles.transferPadStart,
                              isPicked && styles.transferItemPicked,
                              isDragging && reorderStyles.source,
                              drop === 'before' && reorderStyles.dropBefore,
                              drop === 'after' && reorderStyles.dropAfter,
                            ]}
                          />
                        );
                      })}
                    </List>
                  )}
                </VStack>
              </VStack>

              <VStack
                gap={0}
                role="group"
                aria-labelledby={`${columnPanelId}-available`}
                xstyle={[styles.transferPanel, styles.transferPanelDivider]}>
                <HStack
                  gap={2}
                  vAlign="center"
                  hAlign="between"
                  paddingBlock={2}
                  xstyle={[styles.transferPanelHeader, styles.transferPadEnd]}>
                  <Text
                    id={`${columnPanelId}-available`}
                    type="label"
                    color="secondary">
                    Cột có thể hiển thị
                  </Text>
                  <Button
                    label="Chọn tất cả"
                    variant="ghost"
                    size="sm"
                    xstyle={styles.transferHeaderAction}
                    isDisabled={view.columnKeys.length === allColumnKeys.length}
                    onClick={() =>
                      onViewChange(current => ({
                        ...current,
                        columnKeys: [
                          ...current.columnKeys,
                          ...allColumnKeys.filter(
                            key => !current.columnKeys.includes(key),
                          ),
                        ],
                      }))
                    }
                  />
                </HStack>
                <VStack gap={0} xstyle={styles.transferPanelBody}>
                  {availableColumns.length === 0 ? (
                    <VStack
                      gap={0}
                      vAlign="center"
                      hAlign="center"
                      minHeight="100%"
                      paddingBlock={4}
                      xstyle={[styles.transferEmpty, styles.transferPadEnd]}>
                      <Text type="supporting" color="secondary">
                        Đã hiển thị tất cả cột.
                      </Text>
                    </VStack>
                  ) : (
                    <List
                      density="compact"
                      header={
                        <VisuallyHidden>Cột có thể hiển thị</VisuallyHidden>
                      }>
                      {availableColumns.map(key => (
                        <Item
                          key={key}
                          as="li"
                          density="compact"
                          label={columnLabels[key]}
                          endContent={
                            <IconButton
                              label={`Add ${columnLabels[key]}`}
                              variant="ghost"
                              size="sm"
                              icon={<Icon icon={Plus} size="sm" />}
                              xstyle={styles.transferEndAction}
                              onClick={() =>
                                onViewChange(current => ({
                                  ...current,
                                  columnKeys: [...current.columnKeys, key],
                                }))
                              }
                            />
                          }
                          xstyle={[styles.transferItem, styles.transferPadEnd]}
                        />
                      ))}
                    </List>
                  )}
                </VStack>
              </VStack>
            </HStack>
          </VStack>
        );

      case 'density':
        return (
          <VStack gap={0} paddingInline={4} paddingBlockEnd={4}>
            <RadioList
              label="Mật độ"
              isLabelHidden
              value={view.density}
              onChange={value =>
                onViewChange(current => ({
                  ...current,
                  density: value as Density,
                }))
              }>
              {DENSITY_OPTIONS.map(option => (
                <RadioListItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioList>
          </VStack>
        );

      case 'sticky':
        return (
          <VStack gap={4} paddingInline={4} paddingBlockEnd={4}>
            <RadioList
              label="Các cột đầu"
              value={view.stickyStart}
              onChange={value =>
                onViewChange(current => ({
                  ...current,
                  stickyStart: value as StickyEdge,
                }))
              }>
              {STICKY_START_OPTIONS.map(option => (
                <RadioListItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioList>
            <RadioList
              label="Các cột cuối"
              value={view.stickyEnd}
              onChange={value =>
                onViewChange(current => ({
                  ...current,
                  stickyEnd: value as StickyEdge,
                }))
              }>
              {STICKY_END_OPTIONS.map(option => (
                <RadioListItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioList>
          </VStack>
        );

      case 'grouping':
        return (
          <VStack gap={0} paddingInline={4} paddingBlockEnd={4}>
            <RadioList
              label="Nhóm"
              isLabelHidden
              value={view.grouping}
              onChange={value =>
                onViewChange(current => ({
                  ...current,
                  grouping: value as GroupField,
                }))
              }>
              {groupingOptions.map(option => (
                <RadioListItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioList>
          </VStack>
        );
    }
  };

  const activeSection = VIEW_SECTIONS.find(
    section => section.key === viewSection,
  );

  const content = (
    <VStack gap={0}>
      <HStack gap={0} xstyle={styles.viewPopover}>
        <Section
          variant="transparent"
          padding={1}
          dividers={['end']}
          xstyle={styles.viewRail}>
          <VStack gap={1}>
            {VIEW_SECTIONS.map(section => (
              <Button
                key={section.key}
                label={section.label}
                variant={viewSection === section.key ? 'secondary' : 'ghost'}
                icon={VIEW_SECTION_ICONS[section.key]}
                xstyle={styles.railItem}
                onClick={() => setViewSection(section.key)}
              />
            ))}
          </VStack>
        </Section>

        <StackItem size="fill">
          <VStack gap={0} minHeight={0} xstyle={styles.viewPanel}>
            <VStack gap={0} padding={4} paddingBlockEnd={3}>
              <Heading level={3}>{activeSection?.title}</Heading>
            </VStack>

            {viewPanelBody()}
          </VStack>
        </StackItem>
      </HStack>
    </VStack>
  );

  return (
    <Popover
      placement="below"
      alignment="end"
      width={660}
      label="Tùy chọn hiển thị"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      xstyle={styles.viewPopoverSurface}
      content={content}>
      <Button
        label="Tùy chọn hiển thị"
        variant="ghost"
        size="sm"
        endContent={<Icon icon={ChevronDown} size="sm" />}
      />
    </Popover>
  );
}
