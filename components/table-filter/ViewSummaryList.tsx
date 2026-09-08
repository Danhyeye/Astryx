import {HStack} from '@astryxdesign/core/Layout';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Text} from '@astryxdesign/core/Text';
import {Token} from '@astryxdesign/core/Token';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';

import {
  DENSITY_OPTIONS,
  STICKY_END_OPTIONS,
  STICKY_START_OPTIONS,
  filterTokenLabel,
  filterValueText,
  type GroupField,
  type ViewState,
} from '@/data';
import {styles} from '@/app/table-filter/styles';

export function ViewSummaryList({
  view,
  filters,
  allColumnKeys,
  groupingOptions,
}: {
  view: ViewState;
  filters: readonly PowerSearchFilter[];
  allColumnKeys: readonly string[];
  groupingOptions: ReadonlyArray<{value: GroupField; label: string}>;
}) {
  const density = DENSITY_OPTIONS.find(option => option.value === view.density);
  const grouping = groupingOptions.find(
    option => option.value === view.grouping,
  );
  const stickyStart = STICKY_START_OPTIONS.find(
    option => option.value === view.stickyStart,
  );
  const stickyEnd = STICKY_END_OPTIONS.find(
    option => option.value === view.stickyEnd,
  );

  return (
    <MetadataList columns="single" label={{position: 'start', width: 104}}>
      <MetadataListItem label="Bộ lọc">
        {filters.length === 0 ? (
          <Text type="body">Không có</Text>
        ) : (
          <HStack gap={1} xstyle={styles.tokenWrap}>
            {filters.map(filter => (
              <Token
                key={`${filter.field}-${filter.operator}-${filterValueText(filter)}`}
                label={filterTokenLabel(filter)}
                description={`${filter.field} ${filter.operator} ${filterValueText(filter)}`}
                size="sm"
                xstyle={styles.filterToken}
              />
            ))}
          </HStack>
        )}
      </MetadataListItem>
      <MetadataListItem label="Cột">
        <Text type="body">
          {view.columnKeys.length} of {allColumnKeys.length}
        </Text>
      </MetadataListItem>
      <MetadataListItem label="Mật độ">
        <Text type="body">{density?.label ?? view.density}</Text>
      </MetadataListItem>
      <MetadataListItem label="Nhóm">
        <Text type="body">{grouping?.label ?? view.grouping}</Text>
      </MetadataListItem>
      <MetadataListItem label="Cố định đầu">
        <Text type="body">{stickyStart?.label ?? view.stickyStart}</Text>
      </MetadataListItem>
      <MetadataListItem label="Cố định cuối">
        <Text type="body">{stickyEnd?.label ?? view.stickyEnd}</Text>
      </MetadataListItem>
    </MetadataList>
  );
}
