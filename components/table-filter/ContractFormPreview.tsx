import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {CONTRACT_STATUS_META, PAYMENT_FREQUENCY_META} from '@/data';
import {formatDate, formatMoney, formatNumber} from '@/utils/format';
import type {ContractFormState} from './entityForms';

type Option = {value: string; label: string};

export function ContractFormPreview({form, customerOptions, landOptions, plotOptions, files, showPaymentDueDay = true}: {
  form: ContractFormState;
  customerOptions: readonly Option[];
  landOptions: readonly Option[];
  plotOptions: readonly Option[];
  files: readonly File[];
  showPaymentDueDay?: boolean;
}) {
  const selectedLabel = (options: readonly Option[], id: string) =>
    options.find(option => option.value === id)?.label ?? 'Chưa chọn';
  const rows = [
    ['Khách hàng', selectedLabel(customerOptions, form.customerId)],
    ['Khu đất', selectedLabel(landOptions, form.landId)],
    ['Lô đất', form.plotIds.length ? form.plotIds.map(id => selectedLabel(plotOptions, id)).join(', ') : 'Toàn khu đất'],
    ['Thời hạn thuê', form.leaseDurationMonths == null ? 'Chưa thiết lập' : `${formatNumber(form.leaseDurationMonths)} tháng`],
    ['Trạng thái', CONTRACT_STATUS_META[form.status].label],
    ['Ngày bắt đầu', formatDate(form.startDate, true)],
    ['Ngày kết thúc', formatDate(form.endDate, true)],
    ['Tiền thuê', form.rentAmount == null ? 'Chưa thiết lập' : formatMoney(form.rentAmount)],
    ['Tiền đặt cọc', form.depositAmount == null ? 'Chưa thiết lập' : formatMoney(form.depositAmount)],
    ['Ngày đến hạn', form.dueDay == null ? 'Chưa thiết lập' : `Ngày ${form.dueDay}`],
    ...(showPaymentDueDay ? [['Ngày thanh toán', form.paymentDueDay == null ? 'Chưa thiết lập' : `Ngày ${form.paymentDueDay}`]] : []),
    ['Chu kỳ thanh toán', PAYMENT_FREQUENCY_META[form.paymentFrequency].label],
    ['Thanh toán tiếp theo', formatDate(form.nextPaymentDueDate, true)],
    ['Ghi chú', form.notes.trim() || 'Không có ghi chú'],
    ['Tệp sẽ tải lên', files.length === 0 ? 'Không có tệp mới' : files.map(file => file.name).join(', ')],
  ];

  return (
    <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={4}>
      {rows.map(([label, value]) => (
        <MetadataList key={label} columns="single" label={{position: 'top'}}>
          <MetadataListItem label={label}>{value}</MetadataListItem>
        </MetadataList>
      ))}
    </Grid>
  );
}
import {Grid} from '@astryxdesign/core/Grid';
