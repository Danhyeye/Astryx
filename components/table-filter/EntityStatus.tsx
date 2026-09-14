import type {ComponentProps} from 'react';
import {Badge} from '@astryxdesign/core/Badge';

const variants: Record<string, ComponentProps<typeof Badge>['variant']> = {
  neutral: 'neutral', green: 'green', red: 'red', blue: 'blue',
  yellow: 'yellow', orange: 'orange', purple: 'purple', teal: 'teal',
  cyan: 'cyan', pink: 'pink', success: 'success', warning: 'warning',
  error: 'error', info: 'info', accent: 'blue',
};

export function EntityStatus({label, variant = 'neutral'}: {label: string; variant?: string}) {
  return <Badge label={label} variant={variants[variant] ?? 'neutral'} />;
}
