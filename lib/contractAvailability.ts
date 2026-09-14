import {resolveContractEndDate, contractToday} from './contractDates.ts';
export type RentalContract = {id: string; land_id: string | null; plot_ids: string[]; status?: string; start_date?: string; end_date?: string | null; lease_duration_months?: number | null};

export type RentalPeriod = {startDate: string; endDate?: string | null; leaseDurationMonths?: number | null};

export function rentalEndDate(contract: RentalContract): string | null {
  return resolveContractEndDate({startDate: contract.start_date ?? '', endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
}

export function rentalOverlaps(contract: RentalContract, period: RentalPeriod): boolean {
  const end = resolveContractEndDate({startDate: period.startDate, endDate: period.endDate, leaseDurationMonths: period.leaseDurationMonths});
  const existingEnd = rentalEndDate(contract);
  return (!end || !contract.start_date || contract.start_date <= end)
    && (!existingEnd || period.startDate <= existingEnd);
}

export function isPlotManuallyRented(plot: {id: string; land_id: string; status: string}, contracts: readonly RentalContract[]): boolean {
  return plot.status === 'RENTED' && !contracts.some(contract =>
    contract.land_id === plot.land_id && (contract.status === 'active' || contract.status === 'pending')
    && (contract.plot_ids.length === 0 || contract.plot_ids.includes(plot.id)));
}

export function getLandAvailability(contracts: readonly RentalContract[], landId: string, excludeId?: string, period?: RentalPeriod) {
  const rentals = contracts.filter(contract => contract.land_id === landId && contract.id !== excludeId
    && (contract.status == null || contract.status === 'active' || contract.status === 'pending')
    && (!period || rentalOverlaps(contract, period)));
  return {
    hasActiveContract: rentals.length > 0,
    wholeLandRented: rentals.some(contract => contract.plot_ids.length === 0),
    rentedPlotIds: new Set(rentals.flatMap(contract => contract.plot_ids)),
  };
}

export function getPlotRentalStatus(
  plot: {id: string; land_id: string; status: 'AVAILABLE' | 'RENTED' | 'SOLD'},
  contracts: readonly RentalContract[],
): 'AVAILABLE' | 'RENTED' | 'SOLD' | 'PENDING' {
  if (plot.status === 'SOLD') return 'SOLD';
  const matches = contracts.filter(contract => contract.land_id === plot.land_id
    && (contract.plot_ids.length === 0 || contract.plot_ids.includes(plot.id)));
  const today = contractToday();
  if (matches.some(contract => contract.status === 'active' && rentalOverlaps(contract, {startDate: today, endDate: today}))) return 'RENTED';
  if (matches.some(contract => (contract.status === 'pending' && (!contract.start_date || contract.start_date > today)) || (contract.status === 'active' && !!contract.start_date && contract.start_date > today))) return 'PENDING';
  if (plot.status === 'RENTED' && matches.some(contract => contract.status === 'active' || contract.status === 'pending')) return 'AVAILABLE';
  return plot.status;
}
