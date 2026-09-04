import {useMemo, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {ComplexSelector} from '@astryxdesign/core/ComplexSelector';
import {Divider} from '@astryxdesign/core/Divider';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Link} from '@astryxdesign/core/Link';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {Selector} from '@astryxdesign/core/Selector';
import {Slider} from '@astryxdesign/core/Slider';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {Search} from 'lucide-react';

import {
  type FilterField,
  type MultiFilterField,
  type PresetFilter,
  type RangeFilterConfig,
} from '@/data';
import {styles} from '@/app/table-filter/styles';
import {
  formatArea,
  formatMoney,
  formatRangeLabel,
  formatSelectedOptionValue,
} from '@/utils/format';
import {PowerSearchModeToggle} from './PowerSearchModeToggle';

export function FilterBar({
  filters,
  query,
  isPowerSearch,
  resultCount,
  filterFields,
  multiFilterFields,
  presetFilters,
  rangeFilter,
  searchLabel,
  searchPlaceholder,
  onFiltersChange,
  onQueryChange,
  onPowerSearchChange,
  onClearAll,
}: {
  filters: PowerSearchFilter[];
  query: string;
  isPowerSearch: boolean;
  resultCount: number;
  filterFields: readonly FilterField[];
  multiFilterFields: readonly MultiFilterField[];
  presetFilters: readonly PresetFilter[];
  rangeFilter: RangeFilterConfig | null;
  searchLabel: string;
  searchPlaceholder: string;
  onFiltersChange: (
    updater: (current: PowerSearchFilter[]) => PowerSearchFilter[],
  ) => void;
  onQueryChange: (next: string) => void;
  onPowerSearchChange: (next: boolean) => void;
  onClearAll: () => void;
}) {
  const setFieldFilter = (
    fieldKey: string,
    next: PowerSearchFilter | null,
  ) => {
    onFiltersChange(current => {
      const rest = current.filter(filter => filter.field !== fieldKey);
      return next ? [...rest, next] : rest;
    });
  };

  const togglePreset = (filter: PowerSearchFilter) => {
    onFiltersChange(current =>
      current.some(item => JSON.stringify(item) === JSON.stringify(filter))
        ? current.filter(item => JSON.stringify(item) !== JSON.stringify(filter))
        : [...current.filter(item => item.field !== filter.field), filter],
    );
  };

  const multiValues = useMemo(() => {
    const byField: Record<string, string[]> = {};
    for (const field of multiFilterFields) {
      const active = filters.find(filter => filter.field === field.key);
      const raw = active ? (active.value as {value?: unknown}).value : null;
      byField[field.key] = Array.isArray(raw)
        ? raw.map(String)
        : raw == null
          ? []
          : [String(raw)];
    }
    return byField;
  }, [filters, multiFilterFields]);

  const setMultiValues = (field: string, next: string[]) => {
    setFieldFilter(
      field,
      next.length === 0
        ? null
        : {
            field,
            operator: 'is_any_of',
            value: {type: 'enum_list', value: next},
          },
    );
  };

  const boundValue = (operator: string, fallback: number) => {
    if (rangeFilter == null) {
      return fallback;
    }
    const found = filters.find(
      filter =>
        filter.field === rangeFilter.field && filter.operator === operator,
    );
    return found ? Number((found.value as {value: number}).value) : fallback;
  };

  const rangeLow = boundValue(
    'greater_than_or_equal',
    rangeFilter?.min ?? 0,
  );
  const rangeHigh = boundValue('less_than_or_equal', rangeFilter?.max ?? 0);
  const commitRangeFilter = (next: [number, number]) => {
    if (rangeFilter == null) {
      return;
    }
    onFiltersChange(current => {
      const rest = current.filter(filter => filter.field !== rangeFilter.field);
      const bounds: PowerSearchFilter[] = [];
      if (next[0] > rangeFilter.min) {
        bounds.push({
          field: rangeFilter.field,
          operator: 'greater_than_or_equal',
          value: {type: 'integer', value: next[0]},
        });
      }
      if (next[1] < rangeFilter.max) {
        bounds.push({
          field: rangeFilter.field,
          operator: 'less_than_or_equal',
          value: {type: 'integer', value: next[1]},
        });
      }
      return [...rest, ...bounds];
    });
  };

  const formatRangeValue =
    rangeFilter?.valueKind === 'area' ? formatArea : formatMoney;
  const rangeLabel =
    rangeFilter == null
      ? undefined
      : formatRangeLabel({
          label: rangeFilter.label,
          low: rangeLow,
          high: rangeHigh,
          min: rangeFilter.min,
          max: rangeFilter.max,
          formatValue: formatRangeValue,
        });
  const hasRangeFilter = rangeLabel != null;

  const renderFilterControl = (field: FilterField) => {
    const active = filters.find(filter => filter.field === field.key);
    const value = active
      ? String((active.value as {value?: unknown}).value ?? '')
      : '';

    return (
      <Selector
        key={field.key}
        label={`${field.label} filter`}
        isLabelHidden
        placeholder={field.label}
        size="sm"
        hasClear
        options={[...field.options]}
        value={value === '' ? null : value}
        renderValue={option =>
          `${field.label} ${field.operatorLabel} ${option.label ?? option.value}`
        }
        xstyle={active ? styles.filterFill : undefined}
        onChange={next =>
          setFieldFilter(
            field.key,
            next == null || next === ''
              ? null
              : {
                  field: field.key,
                  operator: field.operator,
                  value:
                    field.valueType === 'integer'
                      ? {type: 'integer', value: Number(next)}
                      : {type: 'enum', value: next},
                },
          )
        }
      />
    );
  };

  const filterControls = [
    ...presetFilters.map(preset => {
      const isPressed = filters.some(
        filter => JSON.stringify(filter) === JSON.stringify(preset.filter),
      );
      return (
        <ToggleButton
          key={preset.key}
          label={preset.label}
          size="sm"
          isPressed={isPressed}
          xstyle={[
            styles.filterChrome,
            isPressed ? styles.filterLabelValue : styles.filterLabelEmpty,
            !isPressed && styles.filterSurface,
          ]}
          onPressedChange={() => togglePreset(preset.filter)}
        />
      );
    }),
    ...multiFilterFields.map(field => (
      <MultiSelector
        key={field.key}
        label={`${field.label} filter`}
        isLabelHidden
        placeholder={field.label}
        size="sm"
        hasClear
        triggerDisplay="labels"
        formatValue={formatSelectedOptionValue}
        options={[...field.options]}
        value={multiValues[field.key]}
        xstyle={
          multiValues[field.key].length > 0 ? styles.filterFill : undefined
        }
        onChange={next => setMultiValues(field.key, next)}
      />
    )),
    ...filterFields.map(renderFilterControl),
    rangeFilter == null ? null : (
      <RangeFilterControl
        key={`${rangeFilter.field}:${rangeLow}:${rangeHigh}:${rangeFilter.max}`}
        value={[rangeLow, rangeHigh]}
        rangeFilter={rangeFilter}
        triggerLabel={rangeLabel}
        hasRangeFilter={hasRangeFilter}
        formatValue={formatRangeValue}
        onChange={commitRangeFilter}
      />
    ),
  ];

  const hasFilters = filters.length > 0 || query !== '';

  return (
    <HStack
      gap={2}
      vAlign="center"
      wrap="wrap"
      minHeight={32}
      xstyle={styles.filterRow}>
      <TextInput
        label={searchLabel}
        isLabelHidden
        placeholder={searchPlaceholder}
        size="sm"
        value={query}
        onChange={onQueryChange}
        startIcon={Search}
        xstyle={styles.searchInput}
      />

      {filterControls}

      <HStack gap={2} vAlign="center" xstyle={styles.filterMeta}>
        <PowerSearchModeToggle
          isPowerSearch={isPowerSearch}
          onChange={onPowerSearchChange}
        />

        <Text type="supporting" color="secondary">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </Text>

        {hasFilters && (
          <>
            <Text type="supporting" color="secondary">
              {'\u2022'}
            </Text>
            <Link type="supporting" onClick={onClearAll}>
              Clear all
            </Link>
          </>
        )}
      </HStack>
    </HStack>
  );
}

function RangeFilterControl({
  value,
  rangeFilter,
  triggerLabel,
  hasRangeFilter,
  formatValue,
  onChange,
}: {
  value: [number, number];
  rangeFilter: RangeFilterConfig;
  triggerLabel: string | undefined;
  hasRangeFilter: boolean;
  formatValue: (value: number) => string;
  onChange: (next: [number, number]) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <ComplexSelector<[number, number]>
      label={`${rangeFilter.label} filter`}
      isLabelHidden
      placeholder={rangeFilter.label}
      triggerLabel={triggerLabel}
      size="sm"
      value={draft}
      onChange={onChange}
      contentXstyle={styles.rangePopover}
      xstyle={hasRangeFilter ? styles.filterFill : undefined}>
      {(range, commitRange, close) => (
        <VStack gap={4}>
          <VStack gap={0}>
            <Text type="label">{rangeFilter.label} range</Text>
            <Text type="large" hasTabularNumbers>
              {formatValue(range[0])} - {formatValue(range[1])}
            </Text>
          </VStack>

          <VStack gap={1}>
            <Slider
              label={`${rangeFilter.label} range`}
              isLabelHidden
              value={range}
              min={rangeFilter.min}
              max={rangeFilter.max}
              step={rangeFilter.step}
              valueDisplay="none"
              formatValue={formatValue}
              minStepsBetweenThumbs={1}
              width="100%"
              onChange={setDraft}
              onChangeEnd={commitRange}
            />
            <HStack hAlign="between" vAlign="center">
              <Text type="supporting" color="secondary">
                {formatValue(rangeFilter.min)}
              </Text>
              <Text type="supporting" color="secondary">
                {formatValue(rangeFilter.max)}
              </Text>
            </HStack>
          </VStack>

          <Divider />

          <HStack gap={2} hAlign="between" vAlign="center">
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              isDisabled={!hasRangeFilter}
              onClick={() => commitRange([rangeFilter.min, rangeFilter.max])}
            />
            <Button
              label="Done"
              variant="secondary"
              size="sm"
              onClick={close}
            />
          </HStack>
        </VStack>
      )}
    </ComplexSelector>
  );
}
