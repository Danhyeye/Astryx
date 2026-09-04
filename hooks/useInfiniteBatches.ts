import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

export function useInfiniteBatches<T>(
  items: readonly T[],
  pageSize: number,
  getGroupKey?: ((item: T) => string) | null,
): {
  data: T[];
  hasNext: boolean;
  isLoadingNext: boolean;
  loadNext: (count: number) => void;
} {
  const [batchState, setBatchState] = useState({
    items,
    pageSize,
    loadedCount: pageSize,
    isLoadingNext: false,
  });
  const inFlightRef = useRef(false);
  const isCurrentConnection =
    batchState.items === items && batchState.pageSize === pageSize;
  const loadedCount = isCurrentConnection ? batchState.loadedCount : pageSize;
  const isLoadingNext = isCurrentConnection ? batchState.isLoadingNext : false;

  useEffect(() => {
    inFlightRef.current = false;
  }, [items, pageSize]);

  const visibleCount = useMemo(() => {
    if (loadedCount >= items.length) {
      return items.length;
    }
    if (getGroupKey == null) {
      return loadedCount;
    }

    const openKey = getGroupKey(items[loadedCount - 1]);
    let end = loadedCount;
    while (end < items.length && getGroupKey(items[end]) === openKey) {
      end++;
    }
    return end;
  }, [getGroupKey, items, loadedCount]);

  const loadNext = useCallback(
    (count: number) => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setBatchState({
        items,
        pageSize,
        loadedCount,
        isLoadingNext: true,
      });
      setTimeout(() => {
        setBatchState({
          items,
          pageSize,
          loadedCount: visibleCount + count,
          isLoadingNext: false,
        });
        inFlightRef.current = false;
      }, 500);
    },
    [items, loadedCount, pageSize, visibleCount],
  );

  const data = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  return {data, hasNext: visibleCount < items.length, isLoadingNext, loadNext};
}
