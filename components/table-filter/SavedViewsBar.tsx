import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {Bookmark, Pencil} from 'lucide-react';

import type {SavedView} from '@/data';
import {styles} from '@/app/table-filter/styles';
import {BookmarkFilled} from './FilledIcons';

export function SavedViewsBar({
  savedViews,
  activeSavedViewId,
  onApplySavedView,
  onEditActiveView,
}: {
  savedViews: SavedView[];
  activeSavedViewId: string | null;
  onApplySavedView: (saved: SavedView | null) => void;
  onEditActiveView: () => void;
}) {
  return (
    <HStack
      gap={2}
      vAlign="center"
      wrap="wrap"
      minHeight={32}
      xstyle={styles.bar}>
      <Text type="label">Saved views:</Text>
      <ToggleButton
        label="All"
        size="sm"
        isPressed={activeSavedViewId == null}
        xstyle={[
          styles.filterChrome,
          activeSavedViewId == null
            ? styles.filterLabelValue
            : styles.filterLabelEmpty,
          activeSavedViewId != null && styles.filterSurface,
        ]}
        onPressedChange={() => onApplySavedView(null)}
      />
      {savedViews.map(saved => {
        const isPressed = activeSavedViewId === saved.id;
        return (
          <ToggleButton
            key={saved.id}
            label={saved.name}
            size="sm"
            isPressed={isPressed}
            icon={<Icon icon={Bookmark} size="sm" />}
            xstyle={[
              styles.filterChrome,
              isPressed ? styles.filterLabelValue : styles.filterLabelEmpty,
              !isPressed && styles.filterSurface,
            ]}
            onPressedChange={next => onApplySavedView(next ? saved : null)}
          />
        );
      })}
      {activeSavedViewId != null && (
        <IconButton
          label="Edit saved view"
          tooltip="Edit saved view"
          variant="ghost"
          size="sm"
          icon={<Icon icon={Pencil} size="sm" />}
          onClick={onEditActiveView}
        />
      )}
    </HStack>
  );
}

export function SavedViewsToggle({
  isOpen,
  onChange,
}: {
  isOpen: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <ToggleButton
      label="Saved views"
      tooltip="Saved views"
      isIconOnly
      size="sm"
      isPressed={isOpen}
      icon={<Icon icon={Bookmark} size="sm" />}
      pressedIcon={<Icon icon={BookmarkFilled} size="sm" />}
      onPressedChange={onChange}
    />
  );
}
