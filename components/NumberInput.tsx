import type {ComponentProps} from 'react';
import {NumberInput as AstryxNumberInput} from '@astryxdesign/core/NumberInput';
import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import vi from '@astryxdesign/core/locales/vi-VN.json';

import {formatInputNumber} from '@/utils/format';

// Match comma grouping when parsing pasted values, retaining Vietnamese labels.
export function NumberInput(props: ComponentProps<typeof AstryxNumberInput>) {
  return (
    <InternationalizationProvider locale="en-US" messages={{'en-US': vi}}>
      <AstryxNumberInput formatValue={formatInputNumber} {...props} />
    </InternationalizationProvider>
  );
}
