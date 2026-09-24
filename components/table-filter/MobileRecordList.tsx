'use client';

import type {ReactNode} from 'react';
import {List, ListItem} from '@astryxdesign/core/List';
import {VStack} from '@astryxdesign/core/Layout';
import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import type {TableColumn} from '@astryxdesign/core/Table';

/** Labeled records for related tables on narrow screens. */
export function MobileRecordList<T extends Record<string, unknown>>({rows, columns, rowKey, label, detailColumns = 1, fullWidthKeys = [], actionKeys = []}: {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  label: string;
  detailColumns?: 1 | 2;
  fullWidthKeys?: string[];
  actionKeys?: string[];
}) {
  return <List hasDividers density="balanced" aria-label={label}>
    {rows.map(row => <ListItem key={rowKey(row)}
      label={<Text className="whitespace-normal break-words" weight="semibold">{columns[0]?.renderCell ? columns[0].renderCell(row) : String(row[columns[0]?.key] ?? '—')}</Text>}
      description={<Grid columns={detailColumns} gap={2} width="100%">
        {columns.slice(1).map(column => <GridSpan key={column.key} columns={fullWidthKeys.includes(column.key) ? detailColumns : 1}>
          <VStack gap={0.5} hAlign="start" className="min-w-0 break-words">
          {!actionKeys.includes(column.key) && <Text type="supporting" color="secondary">{column.header as ReactNode}</Text>}
          {column.renderCell ? column.renderCell(row) : <Text className="whitespace-normal break-words">{String(row[column.key] ?? '—')}</Text>}
        </VStack></GridSpan>)}
      </Grid>} />)}
  </List>;
}
