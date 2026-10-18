import {InputGroup, InputGroupText} from '@astryxdesign/core/InputGroup';
import {Selector} from '@astryxdesign/core/Selector';
import {
  PAYMENT_FREQUENCY_MONTHS,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_FREQUENCY_META,
  type PaymentFrequency,
} from '@/lib/paymentFrequency';

export function PaymentFrequencyInput({value, onChange, isDisabled}: {
  value: PaymentFrequency;
  onChange: (value: PaymentFrequency) => void;
  isDisabled?: boolean;
}) {
  const label = 'Chu kỳ thanh toán';
  // Preserve legacy custom schedules until the user chooses a monthly interval.
  if (value === 'CUSTOM') {
    return <Selector label={label} value={value} isDisabled={isDisabled}
      options={[
        {value: 'CUSTOM', label: 'Lịch tùy chỉnh hiện có', disabled: true},
        ...PAYMENT_FREQUENCY_OPTIONS.map(frequency => ({value: frequency, label: PAYMENT_FREQUENCY_META[frequency].label})),
      ]}
      onChange={frequency => onChange(frequency as PaymentFrequency)} />;
  }
  return <InputGroup label={label} isRequired isDisabled={isDisabled}>
    <Selector label={label} value={value} isRequired isDisabled={isDisabled}
      options={PAYMENT_FREQUENCY_OPTIONS.map(frequency => ({
        value: frequency,
        label: String(PAYMENT_FREQUENCY_MONTHS[frequency]),
      }))}
      onChange={frequency => onChange(frequency as PaymentFrequency)} />
    <InputGroupText>tháng</InputGroupText>
    <InputGroupText>lần</InputGroupText>
  </InputGroup>;
}
