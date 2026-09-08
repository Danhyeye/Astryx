import {Thumbnail} from '@astryxdesign/core/Thumbnail';
import {HStack} from '@astryxdesign/core/Layout';

import type {Images} from '@/types/image';

function imageLabel(image: Images, index: number): string {
  return image.caption || image.path || `Ảnh khu đất ${index + 1}`;
}

export function LandImageGallery({
  images,
  emptyLabel,
  onRemoveImage,
  showRemoveOn = 'always',
}: {
  images: readonly Images[];
  emptyLabel: string;
  onRemoveImage?: (image: Images) => void;
  showRemoveOn?: 'always' | 'hover';
}) {
  const sortedImages = [...images].sort(
    (first, second) => first.sort_order - second.sort_order,
  );

  return (
    <HStack gap={2} wrap="wrap">
      {sortedImages.length === 0 ? (
        <Thumbnail label={emptyLabel} />
      ) : (
        sortedImages.map((image, index) => {
          const label = imageLabel(image, index);

          return (
            <Thumbnail
              key={image.id}
              src={image.url || undefined}
              alt={label}
              label={label}
              onRemove={
                onRemoveImage == null
                  ? undefined
                  : event => {
                      event.preventDefault();
                      onRemoveImage(image);
                    }
              }
              showRemoveOn={showRemoveOn}
            />
          );
        })
      )}
    </HStack>
  );
}
