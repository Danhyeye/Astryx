import type {
  ContractStatus,
  CreateContractPayload,
  PaymentFrequency,
} from '../../types/contract';
import type {
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../../types/customer';
import type {Images, UploadedImage} from '../../types/image';
import type {CreatePlotPayload, Status as PlotStatus} from '../../types/plot';
import type {
  ContractTableRow,
  CustomerTableRow,
  PlotTableRow,
} from '../../data';

export type UploadedEntityImage = Pick<UploadedImage, 'url'>;
export type RetainedEntityImage = Pick<Images, 'url' | 'caption'>;

export type PlotFormState = {
  landId: string;
  plotNumber: string;
  areaSqm: number | null;
  status: PlotStatus;
  description: string;
  imageCaption: string;
};

export type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type ContractFormState = {
  customerId: string;
  landId: string;
  plotId: string;
  depositAmount: number | null;
  rentAmount: number | null;
  dueDay: number | null;
  leaseDurationMonths: number | null;
  paymentFrequency: PaymentFrequency;
  paymentDueDay: number | null;
  nextPaymentDueDate: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  notes: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function uploadedImageList(
  uploadedImages:
    | UploadedEntityImage
    | readonly UploadedEntityImage[]
    | null = null,
): readonly UploadedEntityImage[] {
  if (uploadedImages == null) {
    return [];
  }

  return 'url' in uploadedImages ? [uploadedImages] : uploadedImages;
}

export function createEmptyPlotForm(): PlotFormState {
  return {
    landId: '',
    plotNumber: '',
    areaSqm: null,
    status: 'AVAILABLE',
    description: '',
    imageCaption: '',
  };
}

export function createPlotFormFromPlot(plot: PlotTableRow): PlotFormState {
  return {
    landId: plot.landId,
    plotNumber: plot.plotNumber,
    areaSqm: plot.areaSqm,
    status: plot.status,
    description: plot.description,
    imageCaption: '',
  };
}

export function isPlotFormValid(form: PlotFormState): boolean {
  return form.landId.trim() !== '' && form.plotNumber.trim() !== '';
}

export function buildPlotPayload(
  form: PlotFormState,
  uploadedImages:
    | UploadedEntityImage
    | readonly UploadedEntityImage[]
    | null = null,
  retainedImages?: readonly RetainedEntityImage[],
): CreatePlotPayload {
  const imageCaption = form.imageCaption.trim();
  const images = [
    ...(retainedImages ?? []).map(image => ({
      url: image.url,
      caption: image.caption || null,
    })),
    ...uploadedImageList(uploadedImages).map(image => ({
      url: image.url,
      caption: imageCaption === '' ? null : imageCaption,
    })),
  ];
  const payload: CreatePlotPayload = {
    land_id: form.landId,
    plot_number: form.plotNumber.trim(),
    area_sqm: form.areaSqm,
    status: form.status,
  };
  const description = optionalText(form.description);

  if (description != null) {
    payload.description = description;
  }

  if (images.length > 0 || retainedImages != null) {
    payload.images = images;
  }

  return payload;
}

export function createEmptyCustomerForm(): CustomerFormState {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  };
}

export function createCustomerFormFromCustomer(
  customer: CustomerTableRow,
): CustomerFormState {
  return {
    name: customer.customer,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
  };
}

export function isCustomerFormValid(form: CustomerFormState): boolean {
  return form.name.trim() !== '';
}

export function buildCustomerPayload(
  form: CustomerFormState,
): CreateCustomerPayload & UpdateCustomerPayload {
  return {
    name: form.name.trim(),
    phone: optionalText(form.phone),
    email: optionalText(form.email),
    address: optionalText(form.address),
    notes: optionalText(form.notes),
  };
}

export function createEmptyContractForm(today: string): ContractFormState {
  return {
    customerId: '',
    landId: '',
    plotId: '',
    depositAmount: 0,
    rentAmount: null,
    dueDay: 1,
    leaseDurationMonths: 12,
    paymentFrequency: 'MONTHLY',
    paymentDueDay: 1,
    nextPaymentDueDate: '',
    startDate: today,
    endDate: '',
    status: 'ACTIVE',
    notes: '',
  };
}

export function createContractFormFromContract(
  contract: ContractTableRow,
): ContractFormState {
  return {
    customerId: contract.customerId,
    landId: contract.landId,
    plotId: contract.plotId,
    depositAmount: contract.depositAmount,
    rentAmount: contract.rentAmount,
    dueDay: contract.dueDay,
    leaseDurationMonths: contract.leaseDurationMonths,
    paymentFrequency: contract.paymentFrequency,
    paymentDueDay: contract.paymentDueDay,
    nextPaymentDueDate: contract.nextPaymentDueDate,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: contract.status,
    notes: contract.notes,
  };
}

export function isContractFormValid(form: ContractFormState): boolean {
  return (
    form.customerId.trim() !== '' &&
    (form.landId.trim() !== '' || form.plotId.trim() !== '') &&
    form.startDate.trim() !== '' &&
    form.rentAmount != null &&
    form.depositAmount != null &&
    form.dueDay != null &&
    form.paymentDueDay != null
  );
}

export function buildContractPayload(
  form: ContractFormState,
  {includeEmptyRelations = false}: {includeEmptyRelations?: boolean} = {},
): CreateContractPayload {
  const landId = form.landId.trim();
  const plotId = form.plotId.trim();
  const payload: CreateContractPayload = {
    customer: {
      id: form.customerId,
    },
    deposit_amount: form.depositAmount ?? 0,
    rent_amount: form.rentAmount ?? 0,
    due_day: form.dueDay ?? 1,
    lease_duration_months: form.leaseDurationMonths,
    payment_frequency: form.paymentFrequency,
    payment_due_day: form.paymentDueDay,
    next_payment_due_date: optionalText(form.nextPaymentDueDate),
    start_date: form.startDate,
    end_date: optionalText(form.endDate),
    status: form.status,
    notes: optionalText(form.notes),
  };

  if (plotId !== '') {
    if (includeEmptyRelations) {
      payload.land = null;
    }
    payload.plot = {id: plotId};
  } else if (landId !== '') {
    payload.land = {id: landId};
    if (includeEmptyRelations) {
      payload.plot = null;
    }
  } else if (includeEmptyRelations) {
    payload.land = null;
    payload.plot = null;
  }

  return payload;
}
