import {ContractFileInput} from '@/components/contracts/ContractFileInput';
import {uploadContractFiles} from '@/lib/api/fetchContractFiles';
import {type FormEvent, useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import {DateInput} from '@astryxdesign/core/DateInput';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Selector} from '@astryxdesign/core/Selector';
import {TextArea} from '@astryxdesign/core/TextArea';

import {
  CONTRACT_STATUS_META,
  PAYMENT_FREQUENCY_META,
  PLOT_STATUS_META,
  type ContractTableRow,
} from '@/data';
import {useUpdateContract} from '@/hooks/useContract';
import type {ContractStatus, PaymentFrequency} from '@/types/contract';
import type {Customer} from '@/types/customer';
import type {Land} from '@/types/land';
import type {Plot} from '@/types/plot';
import {
  buildContractPayload,
  createContractFormFromContract,
  isContractFormValid,
  isContractFormStepValid,
} from './entityForms';
import {EntityFormActions, EntityFormStepper} from './EntityFormStepper';

const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
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
  const isFormValid = isContractFormValid(form, validationOptions);
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
      lands.map(land => ({
        value: land.id,
        label: land.name,
        description: land.location || 'Chưa có vị trí',
      })),
    [lands],
  );
  const plotOptions = useMemo(
    () =>
      plots
        .filter(plot => form.landId === '' || plot.land_id === form.landId)
        .map(plot => {
          const land = plot.lands[0];
          return {
            value: plot.id,
            label: `Lô đất ${plot.plot_number}`,
            description: `${land?.name ?? 'Chưa có khu đất'} - ${
              PLOT_STATUS_META[plot.status].label
            }`,
          };
        }),
    [form.landId, plots],
  );

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
        data: buildContractPayload(form, {includeEmptyRelations: true}),
      });
      const updatedContract = response.data;

      await uploadContractFiles(contract.id, files);
      onSaved?.(updatedContract?.id ?? contract.id);
      handleOpenChange(false);
    } catch (error) {
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
                      label: 'Các bên',
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
                    onChange={landId =>
                      setForm(current => {
                        const selectedLandId = landId ?? '';
                        const currentPlot = plots.find(
                          plot => plot.id === current.plotId,
                        );

                        return {
                          ...current,
                          landId: selectedLandId,
                          plotId:
                            selectedLandId !== '' &&
                            currentPlot?.land_id !== selectedLandId
                              ? ''
                              : current.plotId,
                        };
                      })
                    }
                    placeholder="Chọn khu đất"
                    hasSearch
                    hasClear
                    isDisabled={isSubmitting}
                        />
                        <Selector
                    label="Lô đất"
                    value={form.plotId}
                    options={plotOptions}
                    onChange={plotId =>
                      setForm(current => {
                        const selectedPlot = plots.find(
                          plot => plot.id === plotId,
                        );

                        return {
                          ...current,
                          plotId: plotId ?? '',
                          landId: selectedPlot?.land_id ?? current.landId,
                        };
                      })
                    }
                    placeholder="Chọn lô đất"
                    hasSearch
                    hasClear
                    isDisabled={isSubmitting}
                        />
                      </>,
                    },
                    {
                      label: 'Điều khoản và ngày',
                      content: <>
                        <NumberInput
                          label="Thời hạn thuê"
                          value={form.leaseDurationMonths}
                          onChange={leaseDurationMonths =>
                            setForm(current => ({...current, leaseDurationMonths}))
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
                          value={asISODateString(form.startDate)}
                          onChange={startDate =>
                            setForm(current => ({...current, startDate: startDate ?? ''}))
                          }
                          isRequired
                          hasClear
                          isDisabled={isSubmitting}
                        />
                        <DateInput
                          label="Ngày kết thúc"
                          value={asISODateString(form.endDate)}
                          onChange={endDate =>
                            setForm(current => ({...current, endDate: endDate ?? ''}))
                          }
                          hasClear
                          isDisabled={isSubmitting}
                        />
                      </>,
                    },
                    {
                      label: 'Thanh toán và ghi chú',
                      content: <>
                        <NumberInput
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
                        <NumberInput
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
                        <NumberInput
                    label="Ngày đến hạn"
                    value={form.dueDay}
                    onChange={dueDay =>
                      setForm(current => ({
                        ...current,
                        dueDay,
                      }))
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
                    max={28}
                    isIntegerOnly
                    isRequired
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                        />
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
                        <DateInput
                    label="Thanh toán tiếp theo"
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
                        <ContractFileInput files={files} onChange={setFiles} isDisabled={isSubmitting} />
                        <TextArea
                    label="Ghi chú"
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
                      </>,
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
              isStepValid={isContractFormStepValid(
                form,
                activeStep,
                validationOptions,
              )}
              isSubmitting={isSubmitting}
              onBack={() => setActiveStep(step => Math.max(0, step - 1))}
              onCancel={() => handleOpenChange(false)}
              onNext={() =>
                setActiveStep(step =>
                  isContractFormStepValid(form, step, validationOptions)
                    ? step + 1
                    : step,
                )
              }
              submitLabel="Lưu thay đổi"
              stepCount={3}
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
