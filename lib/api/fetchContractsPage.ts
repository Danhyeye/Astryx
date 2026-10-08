import type {ContractsResponse} from '@/types/contract';

export async function fetchContractsPage(
  filters: {landId: string; plotId?: string; page: number; pageSize: number; sort?: string; direction?: string},
  signal?: AbortSignal,
): Promise<ContractsResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const response = await fetch(`/api/contracts?${params}`, {signal});
  if (!response.ok) throw new Error('Không thể tải danh sách hợp đồng. Vui lòng thử lại.');
  return response.json();
}
