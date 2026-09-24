import {isVietnamPhone, isValidEmail, normalizeVietnamPhone} from '../../utils/contact.ts';
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
import {
  isValidISODate,
  isPendingStartDateValid,
  resolveContractEndDate,
} from '../../lib/contractDates.ts';

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
  plotIds: string[];
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

export type ContractFormValidationOptions = {
  allowCustomWithoutNextDue?: boolean;
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
  return isPlotFormStepValid(form, 0) && isPlotFormStepValid(form, 1);
}

export function isPlotFormStepValid(
  form: PlotFormState,
  step: number,
): boolean {
  if (step === 0) {
    return form.landId.trim() !== '' && form.plotNumber.trim() !== '';
  }

  if (step === 1) {
    return form.areaSqm == null || form.areaSqm >= 0;
  }

  return true;
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
  return (
    isCustomerFormStepValid(form, 0) && isCustomerFormStepValid(form, 1)
  );
}

export function isCustomerFormStepValid(
  form: CustomerFormState,
  step: number,
): boolean {
  if (step === 0) {
    return form.name.trim() !== '';
  }

  if (step === 1) {
    const email = form.email.trim();
    return (form.phone.trim() === '' || isVietnamPhone(form.phone)) &&
      (email === '' || isValidEmail(email));
  }

  return true;
}

export function buildCustomerPayload(
  form: CustomerFormState,
): CreateCustomerPayload & UpdateCustomerPayload {
  return {
    name: form.name.trim(),
    phone: optionalText(normalizeVietnamPhone(form.phone)),
    email: optionalText(form.email),
    address: optionalText(form.address),
    notes: optionalText(form.notes),
  };
}

function dueDayFromStartDate(startDate: string): number | null {
  return isValidISODate(startDate) ? Math.min(Number(startDate.slice(8, 10)), 28) : null;
}

export function createEmptyContractForm(today: string): ContractFormState {
  return {
    customerId: '',
    landId: '',
    plotIds: [],
    depositAmount: 0,
    rentAmount: null,
    dueDay: dueDayFromStartDate(today),
    leaseDurationMonths: 12,
    paymentFrequency: 'MONTHLY',
    paymentDueDay: dueDayFromStartDate(today),
    nextPaymentDueDate: '',
    startDate: today,
    endDate: resolveContractEndDate({startDate: today, endDate: null, leaseDurationMonths: 12}) ?? '',
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
    plotIds: contract.plotIds,
    depositAmount: contract.depositAmount,
    rentAmount: contract.rentAmount,
    dueDay: contract.dueDay,
    leaseDurationMonths: contract.leaseDurationMonths > 0 ? contract.leaseDurationMonths : null,
    paymentFrequency: contract.paymentFrequency,
    paymentDueDay: contract.paymentDueDay,
    nextPaymentDueDate: contract.nextPaymentDueDate,
    startDate: contract.startDate,
    endDate: resolveContractEndDate({startDate: contract.startDate, endDate: null, leaseDurationMonths: contract.leaseDurationMonths}) ?? '',
    status: contract.status,
    notes: contract.notes,
  };
}

export function updateContractFormDates(
  form: ContractFormState,
  change: Partial<Pick<ContractFormState, 'startDate' | 'leaseDurationMonths'>>,
): ContractFormState {
  const next = {...form, ...change};
  return {
    ...next,
    ...('startDate' in change
      ? {dueDay: dueDayFromStartDate(next.startDate), paymentDueDay: dueDayFromStartDate(next.startDate)}
      : {}),
    endDate: resolveContractEndDate({...next, endDate: null}) ?? '',
  };
}

export function isContractFormValid(
  form: ContractFormState,
  options: ContractFormValidationOptions = {},
): boolean {
  return [0, 1, 2].every(step =>
    isContractFormStepValid(form, step, options),
  );
}

export function isContractFormStepValid(
  form: ContractFormState,
  step: number,
  {allowCustomWithoutNextDue = false}: ContractFormValidationOptions = {},
): boolean {
  if (step === 0) {
    return (
      form.customerId.trim() !== '' &&
      form.landId.trim() !== ''
    );
  }

  if (step === 1) {
    return (
      isValidISODate(form.startDate) &&
      isPendingStartDateValid(form.status, form.startDate) &&
      (form.endDate === '' ||
        (isValidISODate(form.endDate) && form.endDate >= form.startDate)) &&
      (form.leaseDurationMonths == null ||
        (Number.isInteger(form.leaseDurationMonths) &&
          form.leaseDurationMonths > 0))
    );
  }

  const nextDate = form.paymentFrequency === 'CUSTOM' ? form.nextPaymentDueDate : '';
  const effectiveEndDate = resolveContractEndDate({
    startDate: form.startDate,
    endDate: form.endDate,
    leaseDurationMonths: form.leaseDurationMonths,
  });
  const isNextDateValid =
    nextDate === '' ||
    (isValidISODate(nextDate) &&
      nextDate >= form.startDate &&
      (effectiveEndDate == null || nextDate <= effectiveEndDate));
  const hasRequiredCustomDate =
    form.paymentFrequency !== 'CUSTOM' ||
    nextDate !== '' ||
    allowCustomWithoutNextDue;

  return (
    form.rentAmount != null &&
    form.rentAmount >= 0 &&
    form.depositAmount != null &&
    form.depositAmount >= 0 &&
    form.dueDay != null &&
    Number.isInteger(form.dueDay) &&
    form.dueDay >= 1 &&
    form.dueDay <= 31 &&
    form.paymentDueDay != null &&
    Number.isInteger(form.paymentDueDay) &&
    form.paymentDueDay >= 1 &&
    form.paymentDueDay <= 31 &&
    isNextDateValid &&
    hasRequiredCustomDate
  );
}

export function buildContractPayload(
  form: ContractFormState,
): CreateContractPayload {
  const payload: CreateContractPayload = {
    land: {id: form.landId.trim()},
    plots: form.plotIds.map(id => ({id})),
    customer: {
      id: form.customerId,
    },
    deposit_amount: form.depositAmount ?? 0,
    rent_amount: form.rentAmount ?? 0,
    due_day: form.dueDay ?? 1,
    lease_duration_months: form.leaseDurationMonths,
    payment_frequency: form.paymentFrequency,
    payment_due_day: form.paymentDueDay,
    next_payment_due_date: form.paymentFrequency === 'CUSTOM' ? optionalText(form.nextPaymentDueDate) : null,
    start_date: form.startDate,
    end_date: resolveContractEndDate({...form, endDate: null}),
    status: form.status,
    notes: optionalText(form.notes),
  };

  return payload;
}
