import {Icon} from '@astryxdesign/core/Icon';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {SlidersHorizontal} from 'lucide-react';

import {SlidersHorizontalFilled} from './FilledIcons';

export function PowerSearchModeToggle({
  isPowerSearch,
  onChange,
}: {
  isPowerSearch: boolean;
  onChange: (isPowerSearch: boolean) => void;
}) {
  const label = isPowerSearch ? 'Switch to filter tokens' : 'Advanced search';

  return (
    <ToggleButton
      label={label}
      tooltip={label}
      isIconOnly
      size="sm"
      isPressed={isPowerSearch}
      icon={<Icon icon={SlidersHorizontal} size="sm" />}
      pressedIcon={<Icon icon={SlidersHorizontalFilled} size="sm" />}
      onPressedChange={onChange}
    />
  );
}
