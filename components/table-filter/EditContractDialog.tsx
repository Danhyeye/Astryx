import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {Divider} from '@astryxdesign/core/Divider';
import {isPendingStartDateValid} from '@/lib/contractDates';
import {useContractAvailability} from '@/hooks/useContractAvailability';
import {ContractRentalSchedule} from './ContractRentalSchedule';
import {getLandAvailability, isPlotManuallyRented} from '@/lib/contractAvailability';
import {ContractFileInput} from '@/components/contracts/ContractFileInput';
import {uploadContractFiles} from '@/lib/api/fetchContractFiles';
import {type FormEvent, useMemo, useState} from 'react';
import {EntityFormBanner as Banner} from './EntityFormBanner';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import {DateInput} from '@astryxdesign/core/DateInput';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {NumberInput} from '@/components/NumberInput';
import {CurrencyInput} from '@/components/CurrencyInput';
import {Selector} from '@astryxdesign/core/Selector';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {TextArea} from '@astryxdesign/core/TextArea';

import {
  CONTRACT_STATUS_META,
  PAYMENT_FREQUENCY_META,
  type ContractTableRow,
} from '@/data';
import {useUpdateContract} from '@/hooks/useContract';
import type {ContractStatus, PaymentFrequency} from '@/types/contract';
import type {Customer} from '@/types/customer';
import type {Land} from '@/types/land';
import type {Plot} from '@/types/plot';
import {
  buildContractPayload,
  updateContractFormDates,
  createContractFormFromContract,
  isContractFormValid,
  isContractFormStepValid,
} from './entityForms';
import {EntityFormActions, EntityFormStepper} from './EntityFormStepper';
import {ContractFormPreview} from './ContractFormPreview';

const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];
const PAYMENT_FREQUENCY_OPTIONS: PaymentFrequency[] = [
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function asISODateString(value: string): ISODateString | undefined {
  return ISO_DATE_PATTERN.test(value) ? (value as ISODateString) : undefined;
}

function errorMessageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Vui lòng kiểm tra thông tin hợp đồng và thử lại.';
}

export function EditContractDialog({
  contract,
  customers,
  lands,
  plots,
  isOpen,
  onOpenChange,
  onSaved,
}: {
  contract: ContractTableRow;
  customers: readonly Customer[];
  lands: readonly Land[];
  plots: readonly Plot[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (contractId: string) => void;
}) {
  const formId = `edit-contract-${contract.id}`;
  const [form, setForm] = useState(() =>
    createContractFormFromContract(contract),
  );
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateContract = useUpdateContract();
  const isSubmitting = updateContract.isPending || isUploading;
  const validationOptions = {
    allowCustomWithoutNextDue: contract.hasPayments === true,
  };
  const areFieldsValid = isContractFormValid(form, validationOptions);
  const availability = useContractAvailability(isOpen);
  const rentalState = useMemo(
    () => getLandAvailability(availability.data ?? [], form.landId, contract.id, form),
    [availability.data, form, contract.id],
  );
  const customerOptions = useMemo(
    () =>
      customers.map(customer => ({
        value: customer.id,
        label: customer.name,
        description: customer.email || customer.phone || 'Chưa có thông tin liên hệ',
      })),
    [customers],
  );
  const landOptions = useMemo(
    () =>
      lands.map(land => {
        const state = getLandAvailability(availability.data ?? [], land.id, contract.id, form);
        return {
          value: land.id,
          label: land.name,
          description: state.wholeLandRented ? 'Đã thuê hoặc đặt trước toàn bộ khu đất' : state.hasActiveContract ? 'Đã thuê hoặc đặt trước một phần — chọn lô còn trống' : land.location || 'Chưa có vị trí',
          disabled: false,
        };
      }),
    [lands, availability.data, form, contract.id],
  );
  const plotOptions = useMemo(
    () => plots.filter(plot => plot.land_id === form.landId).map(plot => {
      const disabled = plot.status === 'SOLD'
        || isPlotManuallyRented(plot, availability.data ?? [])
        || rentalState.wholeLandRented || rentalState.rentedPlotIds.has(plot.id);
      return {
        value: plot.id,
        label: `Lô đất ${plot.plot_number}`,
        description: disabled ? 'Không khả dụng trong thời gian đã chọn' : 'Còn trống trong thời gian đã chọn',
        disabled,
      };
    }),
    [plots, form.landId, availability.data, rentalState],
  );

  const isTargetAvailable = availability.isSuccess && (
    form.plotIds.length > 0
      ? form.plotIds.every(id => plotOptions.some(option => option.value === id && !option.disabled))
      : !rentalState.hasActiveContract && !plotOptions.some(option => option.disabled)
  );
  const isFormValid = areFieldsValid && isTargetAvailable;
  const isCurrentStepValid = activeStep === 0
    ? isTargetAvailable && isContractFormStepValid(form, 0, validationOptions) && isContractFormStepValid(form, 1, validationOptions)
    : activeStep === 1 ? isTargetAvailable && isContractFormStepValid(form, 2, validationOptions) : isFormValid;

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      setForm(createContractFormFromContract(contract));
      setActiveStep(0);
      setFiles([]);
      setSubmitError(null);
    }

    onOpenChange(open);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeStep !== 2 || !isFormValid || isSubmitting) {
      return;
    }

    setSubmitError(null);

    try {
      setIsUploading(true);
      const response = await updateContract.mutateAsync({
        id: contract.id,
        data: buildContractPayload(form),
      });
      const updatedContract = response.data;

      await uploadContractFiles(contract.id, files);
      onSaved?.(updatedContract?.id ?? contract.id);
      handleOpenChange(false);
    } catch (error) {
      void availability.refetch();
      setSubmitError(errorMessageOf(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      purpose="form"
      width={720}
      maxHeight="88dvh"
      padding={5}>
      <Layout
        height="fill"
        header={
          <DialogHeader
            title="Chỉnh sửa hợp đồng"
            subtitle={contract.summary}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu chỉnh sửa hợp đồng">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể cập nhật hợp đồng"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntityFormStepper
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                  steps={[
                    {
                      label: 'Tài sản và thời hạn',
                      content: <>
                        <Selector
                    label="Khách hàng"
                    value={form.customerId}
                    options={customerOptions}
                    onChange={customerId =>
                      setForm(current => ({
                        ...current,
                        customerId,
                      }))
                    }
                    placeholder="Chọn khách hàng"
                    hasSearch
                    isRequired
                    isDisabled={isSubmitting}
                        />
                        <Selector
                          label="Khu đất"
                          value={form.landId}
                          options={landOptions}
                          onChange={landId => setForm(current => ({
                            ...current, landId: landId ?? '', plotIds: [],
                          }))}
                          placeholder={availability.isPending ? "Đang tải tình trạng cho thuê…" : "Chọn khu đất trước"}
                          hasSearch
                          isRequired
                          isDisabled={isSubmitting || !availability.isSuccess}
                        />

                        <NumberInput
                          label="Thời hạn thuê"
                          value={form.leaseDurationMonths}
                          onChange={leaseDurationMonths =>
                            setForm(current => updateContractFormDates(current, {leaseDurationMonths}))
                          }
                          min={1}
                          units="tháng"
                          hasClear
                          isIntegerOnly
                          isWheelEnabled={false}
                          isDisabled={isSubmitting}
                        />
                        <Selector
                          label="Trạng thái"
                          value={form.status}
                          options={CONTRACT_STATUS_OPTIONS.map(status => ({
                            value: status,
                            label: CONTRACT_STATUS_META[status].label,
                          }))}
                          onChange={status =>
                            setForm(current => ({...current, status: status as ContractStatus}))
                          }
                          isDisabled={isSubmitting}
                        />
                        <DateInput
                          label="Ngày bắt đầu"
                          status={!isPendingStartDateValid(form.status, form.startDate)
                            ? {type: 'error', message: 'Hợp đồng chờ hiệu lực phải bắt đầu sau hôm nay (giờ Việt Nam).'}
                            : undefined}
                          value={asISODateString(form.startDate)}
                          onChange={startDate =>
                            setForm(current => updateContractFormDates(current, {startDate: startDate ?? ''}))
                          }
                          isRequired
                          hasClear
                          isDisabled={isSubmitting}
                        />
                        <DateInput
                          label="Ngày kết thúc"
                          isOptional
                          value={asISODateString(form.endDate)}
                          onChange={endDate =>
                            setForm(current => ({...current, endDate: endDate ?? ''}))
                          }
                          hasClear
                          isDisabled={isSubmitting}
                        />

                        <GridSpan columns="full">
                          <MultiSelector
                            label="Lô đất"
                            width="100%"
                            size="lg"
                            value={form.plotIds}
                            options={plotOptions}
                            onChange={plotIds => setForm(current => ({...current, plotIds}))}
                            placeholder="Chọn một hoặc nhiều lô đất"
                            description={
                              rentalState.hasActiveContract || plotOptions.some(option => option.disabled)
                                ? 'Chọn một hoặc nhiều lô đất còn trống để tiếp tục.'
                                : 'Không chọn lô đất để thuê toàn bộ khu đất.'
                            }
                            hasSearch
                            hasClear
                            triggerDisplay="labels"
                            isDisabled={isSubmitting || form.landId === '' || !availability.isSuccess}
                          />
                        </GridSpan>
                        {form.landId !== '' && availability.isSuccess && <GridSpan columns="full">
                          <ContractRentalSchedule key={form.landId} landId={form.landId} contracts={availability.data}
                            excludeId={contract.id} plots={plots} period={form} selectedPlotIds={form.plotIds} />
                        </GridSpan>}
                        {availability.isError && <Banner status="error" title="Không thể tải tình trạng cho thuê" description={availability.error.message} />}
                        {availability.isSuccess && form.landId !== '' && !isTargetAvailable && (form.plotIds.length > 0 || !plotOptions.some(option => !option.disabled)) && <Banner status="warning" title="Tài sản không khả dụng" description="Chọn các lô còn trống. Đổi thời gian thuê hoặc chọn lô khác để tránh trùng hợp đồng." />}
                      </>,
                    },
                    {
                      label: 'Thanh toán và ghi chú',
                      content: <GridSpan columns="full">
                        <VStack gap={6}>
                          <VStack gap={4}>
                            <Heading level={3}>Chi phí thuê</Heading>
                            <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={4}>
                              <CurrencyInput
                              label="Tiền thuê"
                              value={form.rentAmount}
                              onChange={rentAmount =>
                              setForm(current => ({
                              ...current,
                              rentAmount,
                              }))
                              }
                              min={0}
                              step={100}
                              units="VND"
                              isRequired
                              isWheelEnabled={false}
                              isDisabled={isSubmitting}
                              />
                              <CurrencyInput
                              label="Tiền đặt cọc"
                              value={form.depositAmount}
                              onChange={depositAmount =>
                              setForm(current => ({
                              ...current,
                              depositAmount,
                              }))
                              }
                              min={0}
                              step={100}
                              units="VND"
                              isRequired
                              hasClear
                              isWheelEnabled={false}
                              isDisabled={isSubmitting}
                              />
                            </Grid>
                          </VStack>
                          <VStack gap={4}>
                            <Heading level={3}>Lịch thanh toán</Heading>
                            <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={4}>
                              <Selector
                              label="Chu kỳ thanh toán"
                              value={form.paymentFrequency}
                              options={PAYMENT_FREQUENCY_OPTIONS.map(frequency => ({
                              value: frequency,
                              label: PAYMENT_FREQUENCY_META[frequency].label,
                              }))}
                              onChange={paymentFrequency =>
                              setForm(current => ({
                              ...current,
                              paymentFrequency: paymentFrequency as PaymentFrequency,
                              }))
                              }
                              isDisabled={isSubmitting}
                              />
                              <NumberInput
                              label="Ngày đến hạn"
                              value={form.dueDay}
                              onChange={dueDay =>
                                setForm(current => ({...current, dueDay}))
                              }
                              min={1}
                              max={28}
                              isIntegerOnly
                              isRequired
                              isWheelEnabled={false}
                              isDisabled={isSubmitting}
                              />
                              <NumberInput
                              label="Ngày thanh toán"
                              value={form.paymentDueDay}
                              onChange={paymentDueDay =>
                              setForm(current => ({
                              ...current,
                              paymentDueDay,
                              }))
                              }
                              min={1}
                              max={31}
                              isIntegerOnly
                              isRequired
                              isWheelEnabled={false}
                              isDisabled={isSubmitting}
                              />
                              <DateInput
                              label="Thanh toán tiếp theo"
                              description={form.paymentFrequency === 'CUSTOM' ? 'Chọn ngày cho lịch thanh toán tùy chỉnh.' : undefined}
                              value={asISODateString(form.nextPaymentDueDate)}
                              onChange={nextPaymentDueDate =>
                              setForm(current => ({
                              ...current,
                              nextPaymentDueDate: nextPaymentDueDate ?? '',
                              }))
                              }
                              hasClear
                              isDisabled={isSubmitting}
                              />
                            </Grid>
                          </VStack>
                          <Divider />
                              <TextArea
                              label="Ghi chú"
                              isOptional
                              placeholder="Điều khoản bổ sung, thỏa thuận thanh toán hoặc thông tin cần lưu ý…"
                              value={form.notes}
                              onChange={notes =>
                              setForm(current => ({
                              ...current,
                              notes,
                              }))
                              }
                              rows={4}
                              isDisabled={isSubmitting}
                              />
                              <ContractFileInput files={files} onChange={setFiles} isDisabled={isSubmitting} />
                        </VStack>
                      </GridSpan>,
                    },
                    {
                      label: 'Xem trước',
                      content: <ContractFormPreview
                        form={form}
                        customerOptions={customerOptions}
                        landOptions={landOptions}
                        plotOptions={plotOptions}
                        files={files}
                      />,
                    },
                  ]}
                />
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <EntityFormActions
              activeStep={activeStep}
              formId={formId}
              isStepValid={isCurrentStepValid}
              isSubmitting={isSubmitting}
              onBack={() => setActiveStep(step => Math.max(0, step - 1))}
              onCancel={() => handleOpenChange(false)}
              onNext={() => {if (isCurrentStepValid) setActiveStep(step => step + 1);}}
              submitLabel="Lưu thay đổi"
              stepCount={3}
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
