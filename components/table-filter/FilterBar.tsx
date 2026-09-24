import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {Button} from '@astryxdesign/core/Button';
import {HStack, StackItem} from '@astryxdesign/core/Layout';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Text} from '@astryxdesign/core/Text';
import {Search} from 'lucide-react';

export function FilterBar({filters, query, resultCount, isLoading = false, statusOptions, searchLabel,
  searchPlaceholder, onFiltersChange, onQueryChange, onClearAll}: {
  filters: PowerSearchFilter[];
  query: string;
  resultCount: number;
  isLoading?: boolean;
  statusOptions: {label: string; value: string}[];
  searchLabel: string;
  searchPlaceholder: string;
  onFiltersChange: (updater: (current: PowerSearchFilter[]) => PowerSearchFilter[]) => void;
  onQueryChange: (value: string) => void;
  onClearAll: () => void;
}) {
  const status = filters.find(filter => filter.field === 'status');
  return (
    <HStack gap={3} vAlign="center" wrap="wrap">
      <StackItem size="fill" className="basis-full sm:basis-auto">
        <TextInput label={searchLabel} isLabelHidden placeholder={searchPlaceholder}
          value={query} onChange={onQueryChange} startIcon={Search} hasClear size="md" />
      </StackItem>
      {statusOptions.length > 0 && (
        <Selector label="Trạng thái" isLabelHidden placeholder="Tất cả trạng thái"
          options={statusOptions} size="md" hasClear
          value={status == null ? null : String((status.value as {value: string}).value)}
          onChange={value => onFiltersChange(() => value ? [{field: 'status', operator: 'is', value: {type: 'enum', value}}] : [])} />
      )}
      <Text color="secondary">{isLoading ? 'Đang tải…' : `${resultCount.toLocaleString('vi-VN')} kết quả`}</Text>
      {(filters.length > 0 || query !== '') && <Button label="Xóa bộ lọc" variant="ghost" size="sm" onClick={onClearAll} />}
    </HStack>
  );
}
