import {useQuery} from '@tanstack/react-query';
import {fetchAllPages} from '@/lib/api/fetchAllPages';
import {landsService} from '@/lib/api/fetchLand';
import {plotsService} from '@/lib/api/fetchPlot';
import {customersService} from '@/lib/api/fetchCustomer';
import {contractsService} from '@/lib/api/fetchContract';

export function useAllLands() {
  return useQuery({queryKey: ['lands', 'all'], queryFn: () =>
    fetchAllPages((page, pageSize) => landsService.getLands({page, pageSize}))});
}
export function useAllPlots() {
  return useQuery({queryKey: ['plots', 'all'], queryFn: () =>
    fetchAllPages((page, pageSize) => plotsService.getPlots({page, pageSize}))});
}
export function useAllCustomers() {
  return useQuery({queryKey: ['customers', 'all'], queryFn: () =>
    fetchAllPages((page, pageSize) => customersService.getCustomers({page, pageSize}))});
}
export function useAllContracts() {
  return useQuery({queryKey: ['contracts', 'all'], queryFn: () =>
    fetchAllPages((page, pageSize) => contractsService.getContracts({page, pageSize}))});
}
