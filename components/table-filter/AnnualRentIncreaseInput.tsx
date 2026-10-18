'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Grid } from '@astryxdesign/core/Grid';
import { InputGroup, InputGroupText } from '@astryxdesign/core/InputGroup';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import {Selector} from '@astryxdesign/core/Selector';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Text } from '@astryxdesign/core/Text';
import { applyRentYearRange, groupRentYears, removeRentYearRange, validRentYearRange, rentForContractYear, validRentYears, rentYearLimit, rentRangeDates, rentRangeMonthLabels, type RentYearBasis, type ContractRentYear, type ContractRentRange } from '@/lib/contractRent';
import { formatMoney, formatDate } from '@/utils/format';

function rangeLabel(range: ContractRentRange, basis: RentYearBasis, startDate: string, endDate: string): string {
  const years = range.fromYear === range.toYear ? String(range.fromYear) : `${range.fromYear}–${range.toYear}`;
  const months = basis === 'anniversary' ? rentRangeMonthLabels(startDate, endDate, range.fromYear, range.toYear) : null;
  return months ? `${months.from} - ${months.to}` : years;
}

function dateLabel(startDate: string, endDate: string, from: number, to: number): string {
  const dates = rentRangeDates(startDate, endDate, from, to);
  return dates ? `${formatDate(dates.from, true)} – ${formatDate(dates.to, true)}` : '';
}

export function RentYearSummary({rows, rentAmount, startDate = '', endDate = '', basis = 'calendar'}: {
  rows: readonly ContractRentYear[]; rentAmount: number; startDate?: string; endDate?: string; basis?: RentYearBasis;
}) {
  return <List hasDividers aria-label="Tiền thuê theo năm">
    {groupRentYears(rows).map(row => <ListItem key={row.fromYear}
      label={`${rangeLabel(row, basis, startDate, endDate)} · Tăng ${row.increase_percent}%`}
      description={<VStack gap={1}>
        {/* {basis === 'anniversary' && <Text color="secondary">{dateLabel(startDate, endDate, row.fromYear, row.toYear)}</Text>} */}
        <Text>{formatMoney(rentForContractYear(rentAmount, row.increase_percent, 1))}/kỳ</Text>
      </VStack>} />)}
  </List>;
}

export function AnnualRentIncreaseInput({ startDate, endDate, rentAmount, value, basis = 'anniversary', onBasisChange, legacyPercent = 0, onChange, isDisabled }: {
  startDate: string;
  endDate: string;
  rentAmount: number | null;
  value: ContractRentYear[];
  basis?: RentYearBasis;
  onBasisChange?: () => void;
  legacyPercent?: number;
  onChange: (value: ContractRentYear[]) => void;
  isDisabled?: boolean;
}) {
  const [requestedPage, setPage] = useState(1);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<ContractRentRange | null>(null);
  const [fromYear, setFromYear] = useState<number | null>(null);
  const [toYear, setToYear] = useState<number | null>(null);
  const [rangePercent, setRangePercent] = useState<number | null>(0);
  const pageSize = 5;
  const firstYear = Number(startDate.slice(0, 4));
  const maxYear = rentYearLimit(startDate, endDate, basis);
  const periods = useMemo(() => basis === 'anniversary' ? Array.from({length: maxYear}, (_, i) => {
    const year = i + 1;
    return {year, labels: rentRangeMonthLabels(startDate, endDate, year, year)};
  }).filter(period => period.labels !== null) : [], [basis, maxYear, startDate, endDate]);
  const rows = groupRentYears(value);
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(rows.length / pageSize)));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const price = (row: ContractRentRange) => rentAmount === null ? 'Chưa có giá gốc' : `${formatMoney(rentForContractYear(rentAmount, row.increase_percent, 1))}/kỳ`;
  const closeRange = () => {setRangeOpen(false); setEditingRange(null);};
  const rangeActions = (row: ContractRentRange) => <HStack gap={1}>
    <IconButton label={`Sửa khoảng ${rangeLabel(row, basis, startDate, endDate)}`} tooltip="Sửa khoảng thời gian"
      icon={<Icon icon={Pencil} size="sm" />} type="button" size="sm" variant="ghost" isDisabled={isDisabled}
      onClick={() => {
        setEditingRange(row);
        setFromYear(row.fromYear);
        setToYear(row.toYear);
        setRangePercent(row.increase_percent);
        setRangeOpen(true);
      }} />
    <IconButton label={`Xóa khoảng ${rangeLabel(row, basis, startDate, endDate)}`} tooltip="Xóa khoảng thời gian"
      icon={<Icon icon={Trash2} size="sm" />} type="button" size="sm" variant="ghost" isDisabled={isDisabled}
      onClick={() => {
        onChange(removeRentYearRange(value, row.fromYear, row.toYear));
        if (editingRange?.fromYear === row.fromYear && editingRange.toYear === row.toYear) closeRange();
      }} />
  </HStack>;
  let nextYear = basis === 'anniversary' ? Math.min(2, maxYear) : Number.isInteger(firstYear) && firstYear > 0 ? firstYear : 1;
  while (value.some(row => row.year === nextYear) && nextYear <= 9999) nextYear++;
  const rangeValid = validRentYearRange(fromYear, toYear, rangePercent, maxYear);
  const baseRows = editingRange ? removeRentYearRange(value, editingRange.fromYear, editingRange.toYear) : value;
  const existingYearsInRange = baseRows.filter(row => fromYear !== null && toYear !== null && row.year >= fromYear && row.year <= toYear).length;
  return <VStack gap={3} className="min-w-0 w-full">
    <Heading level={3}>Tiền thuê theo năm</Heading>
    <Text color="secondary">{basis === 'anniversary' ? 'Năm thuê tính từ ngày bắt đầu hợp đồng. ' : 'Lịch hiện có tính theo năm dương lịch. '}Tỷ lệ tính trên giá gốc, không cộng dồn. Năm chưa thiết lập giữ nguyên giá.</Text>
    {basis === 'calendar' && onBasisChange && <VStack gap={1}>
      <Text color="secondary">Chuyển sang năm thuê sẽ đổi mốc áp dụng. Kiểm tra các khoảng ngày trước khi lưu.</Text>
      <Button label="Dùng năm thuê từ ngày bắt đầu" size="sm" type="button" variant="secondary" isDisabled={isDisabled}
        onClick={() => {onBasisChange(); closeRange(); setPage(1);}} />
    </VStack>}
    {legacyPercent > 0 && !value.length && <Text color="secondary">Mức tăng hiện có: {legacyPercent}% mỗi năm. Thêm năm để dùng bảng giá tùy chỉnh.</Text>}
    <HStack gap={2} wrap="wrap">
      <Button label="Thêm khoảng thời gian" type="button" size="sm" variant="secondary" isDisabled={isDisabled || rangeOpen}
        onClick={() => {
          setEditingRange(null);
          setFromYear(Math.min(nextYear, maxYear));
          setToYear(Math.min(nextYear, maxYear));
          setRangePercent(0);
          setRangeOpen(true);
        }} />
    </HStack>
    {rangeOpen && <VStack gap={3}>
      <Grid columns={2} gap={2} width="100%">
        {basis === 'anniversary' ? <>
          <Selector label="Từ tháng" value={fromYear === null ? undefined : String(fromYear)} size="sm" hasSearch isDisabled={isDisabled}
            options={periods.map(period => ({value: String(period.year), label: period.labels!.from}))}
            onChange={next => {
              const year = Number(next);
              setFromYear(year);
              setToYear(current => current !== null && current >= year ? current : year);
            }} />
          <Selector label="Đến tháng" value={toYear === null ? undefined : String(toYear)} size="sm" hasSearch isDisabled={isDisabled}
            options={periods.filter(period => fromYear === null || period.year >= fromYear).map(period => ({value: String(period.year), label: period.labels!.to}))}
            onChange={next => setToYear(Number(next))} />
        </> : <>
        <NumberInput label="Từ năm" value={fromYear} onChange={setFromYear} hasClear
          formatValue={String} min={1} max={maxYear} isIntegerOnly isWheelEnabled={false} size="sm" isDisabled={isDisabled} />
        <NumberInput label="Đến năm" value={toYear} onChange={setToYear} hasClear
          formatValue={String} min={1} max={maxYear} isIntegerOnly isWheelEnabled={false} size="sm" isDisabled={isDisabled}
          status={toYear !== null && toYear > maxYear ? {type: 'error', message: `Không được vượt quá ${maxYear}.`} : fromYear !== null && toYear !== null && toYear < fromYear ? {type: 'error', message: 'Năm kết thúc phải từ năm bắt đầu trở đi.'} : undefined}
          statusVariant="detached" />
        </>}
      </Grid>
      <InputGroup label="Tăng trên giá gốc" size="sm" isDisabled={isDisabled}>
        <NumberInput label="Tỷ lệ tăng cho khoảng năm" value={rangePercent} onChange={setRangePercent} hasClear
          min={0} step={0.1} isWheelEnabled={false} isDisabled={isDisabled} />
        <InputGroupText>%</InputGroupText>
      </InputGroup>
      {rangeValid && basis === 'anniversary' && fromYear !== null && toYear !== null && <Text color="secondary">
        {dateLabel(startDate, endDate, fromYear, toYear)}
      </Text>}
      {rangeValid && rentAmount !== null && rangePercent !== null && <Text weight="semibold">
        Tiền thuê mỗi kỳ: {formatMoney(rentForContractYear(rentAmount, rangePercent, 1))}
      </Text>}
      {rangeValid && existingYearsInRange > 0 && <Text color="secondary">
        Áp dụng sẽ cập nhật tỷ lệ của {existingYearsInRange} năm đã có trong khoảng này. Các năm khác giữ nguyên.
      </Text>}
      <HStack gap={2} wrap="wrap">
        <Button label={editingRange ? "Lưu khoảng thời gian" : "Áp dụng khoảng thời gian"} type="button" size="sm" variant="primary"
          isDisabled={isDisabled || !rangeValid || !validRentYears(baseRows, maxYear)}
          onClick={() => {
            if (!rangeValid || fromYear === null || toYear === null || rangePercent === null) return;
            const updated = applyRentYearRange(baseRows, fromYear, toYear, rangePercent, maxYear);
            onChange(updated);
            setPage(Math.floor(groupRentYears(updated).findIndex(row => row.fromYear <= fromYear && row.toYear >= fromYear) / pageSize) + 1);
            closeRange();
          }} />
        <Button label="Hủy" type="button" size="sm" variant="ghost" isDisabled={isDisabled} onClick={closeRange} />
      </HStack>
    </VStack>}
    {rows.length ? <List hasDividers density="compact" aria-label="Chỉnh tiền thuê theo năm">
      {visibleRows.map(row => <ListItem key={row.fromYear} label={`${rangeLabel(row, basis, startDate, endDate)} · Tăng ${row.increase_percent}%`}
        endContent={rangeActions(row)} description={<VStack gap={1}>
          {/* {basis === 'anniversary' && <Text color="secondary">{dateLabel(startDate, endDate, row.fromYear, row.toYear)}</Text>} */}
          <Text>{price(row)}</Text>
        </VStack>} />)}
    </List> : <Text color="secondary">Chưa có điều chỉnh. Tiền thuê giữ nguyên theo giá gốc.</Text>}
    {!validRentYears(value, maxYear) && <Text color="primary">Mỗi năm chỉ được thiết lập một lần, không được vượt thời hạn hợp đồng; tỷ lệ tăng phải hợp lệ.</Text>}
    {rows.length > pageSize && <HStack hAlign="center" width="100%">
      <Pagination label="Phân trang khoảng năm thuê" page={page} pageSize={pageSize} totalItems={rows.length}
        variant="pages" siblingCount={0} size="sm" isDisabled={isDisabled} onChange={setPage} />
    </HStack>}
  </VStack>;
}
