import type {ReactNode} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Divider} from '@astryxdesign/core/Divider';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {List, ListItem} from '@astryxdesign/core/List';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Section} from '@astryxdesign/core/Section';
import {Text} from '@astryxdesign/core/Text';
import {EntityStatus} from './EntityStatus';
import {CONTRACT_STATUS_META, PAYMENT_FREQUENCY_META} from '@/data';
import {formatDate, formatMoney, formatNumber} from '@/utils/format';
import type {ContractFormState} from './entityForms';

type Option = {value: string; label: string};

export function ContractFormPreview({form, customerOptions, landOptions, plotOptions, files, nextDueDate, showPaymentDueDay = false, onEditStep}: {
  form: ContractFormState;
  customerOptions: readonly Option[];
  landOptions: readonly Option[];
  plotOptions: readonly Option[];
  files: readonly File[];
  nextDueDate?: string | null;
  showPaymentDueDay?: boolean;
  onEditStep?: (step: number) => void;
}) {
  const selectedLabel = (options: readonly Option[], id: string) =>
    options.find(option => option.value === id)?.label ?? 'Chưa chọn';
  const status = CONTRACT_STATUS_META[form.status];
  const field = (label: string, value: ReactNode) => <MetadataListItem label={label}>
    <Text className="whitespace-pre-wrap break-words">{value}</Text>
  </MetadataListItem>;
  const sectionTitle = (title: string, step: number) => <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
    <Heading level={3}>{title}</Heading>
    {onEditStep && <Button label="Chỉnh sửa" variant="ghost" size="sm" type="button" onClick={() => onEditStep(step)} />}
  </HStack>;

  return <Section padding={4}>
    <VStack gap={5}>
      {/* <VStack gap={2} hAlign="center">
        <Text type="supporting">BẢN RÀ SOÁT THÔNG TIN TRƯỚC KHI LƯU</Text>
        <Heading level={2}>HỢP ĐỒNG THUÊ KHU ĐẤT / LÔ ĐẤT</Heading>
        <Text type="supporting">Đối chiếu từng mục dưới đây với thông tin đã nhập.</Text>
      </VStack> */}
      <Divider />

      <VStack gap={3}>
        {sectionTitle('I. Thông tin khách thuê', 0)}
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Khách hàng', selectedLabel(customerOptions, form.customerId))}
          <MetadataListItem label="Trạng thái hợp đồng"><EntityStatus label={status.label} variant={status.badge} /></MetadataListItem>
        </MetadataList>
      </VStack>
      <Divider />

      <VStack gap={3}>
        {sectionTitle('II. Tài sản cho thuê', 0)}
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Khu đất', selectedLabel(landOptions, form.landId))}
          {field('Phạm vi thuê', form.plotIds.length ? 'Các lô đất được liệt kê dưới đây' : 'Toàn bộ khu đất')}
          {form.plotIds.length > 0 && field('Số lô đất', formatNumber(form.plotIds.length))}
        </MetadataList>
        {form.plotIds.length > 0 && <HStack gap={2} wrap="wrap">
          {form.plotIds.map(id => <Badge key={id} variant="blue" label={selectedLabel(plotOptions, id)} />)}
        </HStack>}
      </VStack>
      <Divider />

      <VStack gap={3}>
        {sectionTitle('III. Thời hạn thuê', 0)}
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Ngày bắt đầu', formatDate(form.startDate, true))}
          {field('Số tháng thuê', form.leaseDurationMonths == null ? 'Không thời hạn' : `${formatNumber(form.leaseDurationMonths)} tháng`)}
          {field('Ngày kết thúc (tự động)', form.endDate ? formatDate(form.endDate, true) : 'Không thời hạn')}
        </MetadataList>
      </VStack>
      <Divider />

      <VStack gap={3}>
        {sectionTitle('IV. Tiền thuê và thanh toán', 1)}
        <MetadataList columns="single" label={{position: 'start'}}>
          {field('Tiền thuê mỗi kỳ', form.rentAmount == null ? 'Chưa thiết lập' : formatMoney(form.rentAmount))}
          {field('Tiền đặt cọc', form.depositAmount == null ? 'Chưa thiết lập' : formatMoney(form.depositAmount))}
          {field('Chu kỳ thanh toán', PAYMENT_FREQUENCY_META[form.paymentFrequency].label)}
          {field('Ngày đến hạn trong tháng', form.dueDay == null ? 'Chưa thiết lập' : `Ngày ${form.dueDay}`)}
          {showPaymentDueDay && field('Ngày thanh toán', form.paymentDueDay == null ? 'Chưa thiết lập' : `Ngày ${form.paymentDueDay}`)}
          {field('Kỳ chưa thanh toán gần nhất (tự động)', nextDueDate ? formatDate(nextDueDate, true) : 'Không còn kỳ đến hạn')}
        </MetadataList>
      </VStack>
      <Divider />

      <VStack gap={3}>
        {sectionTitle('V. Ghi chú và thỏa thuận bổ sung', 1)}
        <Text className="whitespace-pre-wrap break-words" color={form.notes.trim() ? 'primary' : 'secondary'}>{form.notes.trim() ? form.notes : 'Không có ghi chú.'}</Text>
      </VStack>
      <Divider />

      <VStack gap={3}>
        {sectionTitle('VI. Tài liệu đính kèm mới', 1)}
        {files.length ? <List hasDividers>
          {files.map((file, index) => <ListItem key={`${file.name}:${index}`} label={`${index + 1}. ${file.name}`}
            description={`${formatNumber(Math.max(1, Math.ceil(file.size / 1024)))} KB · Tải lên khi lưu hợp đồng`} />)}
        </List> : <Text color="secondary">Không có tệp mới được chọn.</Text>}
      </VStack>
    </VStack>
  </Section>;
}
