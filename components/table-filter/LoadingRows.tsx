import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
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
  isMobile = false,
}: {
  columns: TableColumn<EntityTableRow>[];
  density: Density;
  isMobile?: boolean;
}) {
  const pad = DENSITY_PADDING[density];

  if (isMobile) {
    return (
      <VStack gap={5} role="status" aria-live="polite">
        <Text color="secondary">Đang tải dữ liệu…</Text>
        {Array.from({length: 3}, (_, row) => (
          <VStack key={row} gap={4} aria-hidden="true" className="border-b border-border pb-5">
            <Skeleton width="80%" height={20} index={row} />
            {columns.filter(column => column.key !== 'summary').map((column, index) => (
              <VStack key={column.key} gap={2}>
                <Skeleton width="30%" height={12} index={index} />
                <Skeleton width="55%" height={16} index={index + 1} />
              </VStack>
            ))}
            <HStack hAlign="between" vAlign="center">
              <Skeleton width={24} height={24} />
              <Skeleton width="35%" height={44} />
            </HStack>
          </VStack>
        ))}
      </VStack>
    );
  }

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
