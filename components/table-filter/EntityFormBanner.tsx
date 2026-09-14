import type {ComponentProps} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {VStack} from '@astryxdesign/core/Layout';

export function EntityFormBanner(props: ComponentProps<typeof Banner>) {
  return (
    <VStack padding={3}>
      <Banner {...props} />
    </VStack>
  );
}
