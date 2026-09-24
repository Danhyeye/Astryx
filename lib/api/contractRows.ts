import {derivePayment} from '@/lib/invoices';
import type {Invoice} from '@/types/contract';
import {nextContractPayment} from '../nextContractPayment.ts';
import {mapCustomer, mapImage, mapLand, mapPlot} from '@/lib/mappers';
import {contractStatusFromDatabase, paymentFrequencyFromDatabase} from '@/lib/contractDbValues';
import type {Contract} from '@/types/contract';
import type {Database} from '@/types/database.types';

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
export type ContractRowWithRelations = ContractRow & {
  contract_payments: (Database['public']['Tables']['contract_payments']['Row'] & {invoices: Invoice[]})[] | null;
  customers: CustomerRow | null;
  lands: (LandRow & { land_images: LandImageRow[] | null }) | null;
  contract_plots: {plots: (PlotRow & {land_images: LandImageRow[] | null; lands: LandRow | null}) | null}[];
};

export const CONTRACT_SELECT = `*,
  contract_payments (*, invoices (*)), customers (*),
  lands (*, land_images(*)),
  contract_plots (plots (*, land_images(*), lands(*)))`;

export function toContract(row: ContractRowWithRelations): Contract {
  const { customers, lands, contract_plots, ...c } = row;
  const payments = (row.contract_payments ?? []).map(payment => derivePayment(payment));

  const landImages = (lands?.land_images ?? []).map((img: LandImageRow) =>
    mapImage(img, img.storage_path)
  );

  return {
    id: c.id,
    deposit_amount: c.deposit_amount,
    rent_amount: c.rent_amount,
    due_day: c.due_day,
    lease_duration_months: c.lease_duration_months ?? 0,
    payment_frequency: paymentFrequencyFromDatabase(c.payment_frequency),
    payment_due_day: c.payment_due_day ?? 0,
    next_payment_due_date: nextContractPayment({startDate: c.start_date, endDate: c.end_date,
      leaseDurationMonths: c.lease_duration_months, dueDay: c.due_day,
      paymentFrequency: paymentFrequencyFromDatabase(c.payment_frequency),
      status: contractStatusFromDatabase(c.status), payments,
      nextPaymentDueDate: c.next_payment_due_date ?? '',
    }) ?? '',
    start_date: c.start_date,
    end_date: c.end_date ?? "",
    status: contractStatusFromDatabase(c.status),
    notes: c.notes ?? "",
    created_at: c.created_at,
    updated_at: c.updated_at,
    payments,
    customers: customers ? [mapCustomer(customers)] : [],
    lands: lands ? [mapLand(lands, landImages)] : [],
    plots: contract_plots.flatMap(({plots: plot}) => plot ? [mapPlot(
      plot,
      plot.lands ? [mapLand(plot.lands)] : [],
      (plot.land_images ?? []).map(img => mapImage(img, img.storage_path)),
    )] : []),
  };
}
