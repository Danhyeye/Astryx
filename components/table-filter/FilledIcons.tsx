import type {SVGProps} from 'react';
import {Bookmark, SlidersHorizontal} from 'lucide-react';

export const BookmarkFilled = (props: SVGProps<SVGSVGElement>) => (
  <Bookmark {...props} fill="currentColor" />
);

export const SlidersHorizontalFilled = (
  props: SVGProps<SVGSVGElement>,
) => <SlidersHorizontal {...props} fill="currentColor" />;
