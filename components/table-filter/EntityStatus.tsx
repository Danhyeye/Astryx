import {HStack} from '@astryxdesign/core/Layout';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';

export function EntityStatus({label, variant}: {label: string; variant?: string}) {
  return <HStack gap={2} vAlign="center"><StatusDot label={label} variant={variant === 'green' ? 'success' : variant === 'red' ? 'error' : variant === 'blue' ? 'accent' : 'neutral'} /><Text>{label}</Text></HStack>;
}
