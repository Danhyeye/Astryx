/** Read every API page so client-side counts and filters never silently truncate. */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{data: T[] | null}>,
): Promise<{data: T[]; code: number; message: string}> {
  const data: T[] = [];
  const pageSize = 100;
  for (let page = 1; ; page++) {
    const response = await fetchPage(page, pageSize);
    const rows = response.data ?? [];
    data.push(...rows);
    if (rows.length < pageSize) break;
  }
  return {data, code: 200, message: 'Thành công'};
}
