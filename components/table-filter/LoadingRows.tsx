import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {Table, type TableColumn} from '@astryxdesign/core/Table';

import {
  SKELETON_ROWS,
  type Density,
  type EntityTableRow,
} from '@/data';

export function LoadingRows({
  columns,
  density,
  isMobile = false,
}: {
  columns: TableColumn<EntityTableRow>[];
  density: Density;
  isMobile?: boolean;
}) {

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
              <Skeleton width="35%" height={44} />
            </HStack>
          </VStack>
        ))}
      </VStack>
    );
  }

  return (
    <Table
      data={Array.from({length: SKELETON_ROWS}, (_, id) => ({id}))}
      columns={columns.map((column, index) => ({
        key: column.key,
        header: column.header,
        width: column.width,
        align: column.align,
        renderCell: ({id}: {id: number}) => (
          <VStack gap={2} aria-hidden="true" hAlign={column.align ?? 'stretch'}
            paddingInlineEnd={column.key === 'updatedAt' && columns.at(-1)?.key === 'updatedAt' ? 3 : 0}>
            <Skeleton width={column.align === 'end' ? '80%' : '100%'} height={column.key === 'summary' ? 14 : 12} index={id * columns.length + index} />
            {column.key === 'summary' && density !== 'compact' && (
              <Skeleton width="40%" height={11} index={id * columns.length + index + 1} />
            )}
          </VStack>
        ),
      }))}
      idKey="id"
      density={density}
      dividers="rows"
      aria-label="Đang tải dữ liệu bảng"
      aria-busy
    />
  );
}
