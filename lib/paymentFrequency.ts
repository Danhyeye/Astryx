/** Legacy storage values remain compatible with existing contracts. */
export const PAYMENT_FREQUENCY_OPTIONS = [
  'MONTHLY',
  'EVERY_2_MONTHS',
  'QUARTERLY',
  'EVERY_4_MONTHS',
  'EVERY_5_MONTHS',
  'EVERY_6_MONTHS',
  'EVERY_7_MONTHS',
  'EVERY_8_MONTHS',
  'EVERY_9_MONTHS',
  'EVERY_10_MONTHS',
  'EVERY_11_MONTHS',
  'YEARLY',
] as const;

export const PAYMENT_FREQUENCIES = [...PAYMENT_FREQUENCY_OPTIONS, 'CUSTOM'] as const;
export type PaymentFrequency = typeof PAYMENT_FREQUENCIES[number];

export const PAYMENT_FREQUENCY_MONTHS: Partial<Record<string, number>> = {
  MONTHLY: 1,
  EVERY_2_MONTHS: 2,
  QUARTERLY: 3,
  EVERY_4_MONTHS: 4,
  EVERY_5_MONTHS: 5,
  EVERY_6_MONTHS: 6,
  EVERY_7_MONTHS: 7,
  EVERY_8_MONTHS: 8,
  EVERY_9_MONTHS: 9,
  EVERY_10_MONTHS: 10,
  EVERY_11_MONTHS: 11,
  YEARLY: 12,
};

export const PAYMENT_FREQUENCY_META: Record<PaymentFrequency, {label: string}> = {
  MONTHLY: {label: '1 tháng/lần'},
  EVERY_2_MONTHS: {label: '2 tháng/lần'},
  QUARTERLY: {label: '3 tháng/lần'},
  EVERY_4_MONTHS: {label: '4 tháng/lần'},
  EVERY_5_MONTHS: {label: '5 tháng/lần'},
  EVERY_6_MONTHS: {label: '6 tháng/lần'},
  EVERY_7_MONTHS: {label: '7 tháng/lần'},
  EVERY_8_MONTHS: {label: '8 tháng/lần'},
  EVERY_9_MONTHS: {label: '9 tháng/lần'},
  EVERY_10_MONTHS: {label: '10 tháng/lần'},
  EVERY_11_MONTHS: {label: '11 tháng/lần'},
  YEARLY: {label: '12 tháng/lần'},
  CUSTOM: {label: 'Tùy chỉnh'},
};
