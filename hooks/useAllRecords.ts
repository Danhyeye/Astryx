import {useQuery} from '@tanstack/react-query';
import {fetchAllPages} from '@/lib/api/fetchAllPages';
import {landsService} from '@/lib/api/fetchLand';
import {plotsService} from '@/lib/api/fetchPlot';
import {customersService} from '@/lib/api/fetchCustomer';
import {contractsService} from '@/lib/api/fetchContract';

export function useAllLands(enabled = true) {
  return useQuery({enabled, queryKey: ['lands', 'all'], queryFn: ({signal}) =>
    fetchAllPages((page, pageSize) => landsService.getLands({page, pageSize}), signal)});
}
export function useAllPlots(enabled = true, landId?: string) {
  return useQuery({enabled, queryKey: ['plots', 'all', landId ?? null], queryFn: ({signal}) =>
    fetchAllPages((page, pageSize) => plotsService.getPlots({page, pageSize, landId}), signal)});
}
export function useAllCustomers(enabled = true) {
  return useQuery({enabled, queryKey: ['customers', 'all'], queryFn: ({signal}) =>
    fetchAllPages((page, pageSize) => customersService.getCustomers({page, pageSize}), signal)});
}
export function useAllContracts(enabled = true) {
  return useQuery({enabled, queryKey: ['contracts', 'all'], queryFn: ({signal}) =>
    fetchAllPages((page, pageSize) => contractsService.getContracts({page, pageSize}), signal)});
}
