import {getPlotRentalStatus, type RentalContract} from './contractAvailability.ts';

type LandPlot = {id: string; land_id: string; status: string};

export function landMatchesRentalStatus(
  landId: string,
  plots: readonly LandPlot[],
  contracts: readonly RentalContract[],
  status: string,
): boolean {
  // An undivided land follows its whole-land contracts.
  const units = plots.length ? plots : [{id: '', land_id: landId, status: 'AVAILABLE'}];
  return units.some(plot => getPlotRentalStatus({
    ...plot,
    status: plot.status.toUpperCase() as 'AVAILABLE' | 'RENTED' | 'SOLD',
  }, contracts) === status);
}
