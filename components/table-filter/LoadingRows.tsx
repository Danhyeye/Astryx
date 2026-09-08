import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import type {TableColumn} from '@astryxdesign/core/Table';

import {
  DENSITY_PADDING,
  SKELETON_ROWS,
  SELECTION_COLUMN_WIDTH,
  type Density,
  type EntityTableRow,
} from '@/data';
import {skeletonCell, styles} from '@/app/table-filter/styles';

export function LoadingRows({
  columns,
  density,
}: {
  columns: TableColumn<EntityTableRow>[];
  density: Density;
}) {
  const pad = DENSITY_PADDING[density];

  return (
    <VStack
      gap={0}
      role="status"
      aria-label="Đang tải dữ liệu bảng"
      xstyle={styles.skeletonBleed}>
      {Array.from({length: SKELETON_ROWS}, (_, row) => (
        <HStack
          key={row}
          gap={0}
          aria-hidden
          xstyle={[styles.skeletonRow, skeletonCell.row(pad)]}>
          <VStack
            gap={0}
            vAlign="center"
            xstyle={[
              skeletonCell.fixed(SELECTION_COLUMN_WIDTH, 0),
              styles.skeletonEdgeStart,
            ]}>
            <Skeleton width={16} height={16} radius={1} index={row} />
          </VStack>
          {columns.map((col, index) => (
            <VStack
              key={col.key}
              gap={0}
              vAlign="center"
              xstyle={[
                col.width?.type === 'pixel'
                  ? skeletonCell.fixed(col.width.value, pad)
                  : skeletonCell.flexible(
                      col.width?.value ?? 1,
                      col.width?.minWidth ?? 120,
                      pad,
                    ),
                index === columns.length - 1 && styles.skeletonEdgeEnd,
              ]}>
              {col.key === 'summary' && density !== 'compact' ? (
                <VStack gap={2}>
                  <Skeleton height={14} index={row * 4 + index} />
                  <Skeleton
                    width="40%"
                    height={11}
                    index={row * 4 + index + 1}
                  />
                </VStack>
              ) : (
                <Skeleton height={12} index={row * 4 + index} />
              )}
            </VStack>
          ))}
        </HStack>
      ))}
    </VStack>
  );
}
