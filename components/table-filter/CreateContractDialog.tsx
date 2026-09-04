import {type FormEvent, useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {DateInput} from '@astryxdesign/core/DateInput';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import {
  HStack,
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
} from '@/data';
import {useCreateContract} from '@/hooks/useContract';
import type {ContractStatus, PaymentFrequency} from '@/types/contract';
import type {Customer} from '@/types/customer';
import type {Land} from '@/types/land';
import type {Plot} from '@/types/plot';
import {
  buildContractPayload,
  createEmptyContractForm,
  isContractFormValid,
} from './entityForms';

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

function todayISODate(): ISODateString {
  return new Date().toISOString().slice(0, 10) as ISODateString;
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

  return 'Please check the contract details and try again.';
}

export function CreateContractDialog({
  customers,
  lands,
  plots,
  isOpen,
  onOpenChange,
  onCreated,
}: {
  customers: readonly Customer[];
  lands: readonly Land[];
  plots: readonly Plot[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated?: (contractId: string) => void;
}) {
  const formId = 'create-contract-form';
  const [form, setForm] = useState(() => createEmptyContractForm(todayISODate()));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createContract = useCreateContract();
  const isSubmitting = createContract.isPending;
  const isFormValid = isContractFormValid(form);
  const customerOptions = useMemo(
    () =>
      customers.map(customer => ({
        value: customer.id,
        label: customer.name,
        description: customer.email || customer.phone || 'No contact info',
      })),
    [customers],
  );
  const landOptions = useMemo(
    () =>
      lands.map(land => ({
        value: land.id,
        label: land.name,
        description: land.location || 'No location',
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
            label: `Plot ${plot.plot_number}`,
            description: `${land?.name ?? 'No land'} - ${
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
      setForm(createEmptyContractForm(todayISODate()));
      setSubmitError(null);
    }

    onOpenChange(open);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    setSubmitError(null);

    try {
      const response = await createContract.mutateAsync(
        buildContractPayload(form),
      );
      const createdContract = response.data;

      if (createdContract?.id != null) {
        onCreated?.(createdContract.id);
      }

      handleOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessageOf(error));
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
            title="Add new contract"
            subtitle="Create a customer lease contract."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Create contract form">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Could not create contract"
                    description={submitError}
                    container="section"
                  />
                )}

                <FormLayout defaultOptionality="optional">
                  <Selector
                    label="Customer"
                    value={form.customerId}
                    options={customerOptions}
                    onChange={customerId =>
                      setForm(current => ({
                        ...current,
                        customerId,
                      }))
                    }
                    placeholder="Choose customer"
                    hasSearch
                    isRequired
                    isDisabled={isSubmitting}
                  />

                  <Selector
                    label="Land"
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
                    placeholder="Choose land"
                    hasSearch
                    hasClear
                    isDisabled={isSubmitting}
                  />

                  <Selector
                    label="Plot"
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
                    placeholder="Choose plot"
                    hasSearch
                    hasClear
                    isDisabled={isSubmitting}
                  />

                  <NumberInput
                    label="Rent"
                    value={form.rentAmount}
                    onChange={rentAmount =>
                      setForm(current => ({
                        ...current,
                        rentAmount,
                      }))
                    }
                    min={0}
                    step={100}
                    units="USD"
                    isRequired
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                  />

                  <NumberInput
                    label="Deposit"
                    value={form.depositAmount}
                    onChange={depositAmount =>
                      setForm(current => ({
                        ...current,
                        depositAmount,
                      }))
                    }
                    min={0}
                    step={100}
                    units="USD"
                    isRequired
                    hasClear
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                  />

                  <NumberInput
                    label="Due day"
                    value={form.dueDay}
                    onChange={dueDay =>
                      setForm(current => ({
                        ...current,
                        dueDay,
                      }))
                    }
                    min={1}
                    max={31}
                    isIntegerOnly
                    isRequired
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                  />

                  <NumberInput
                    label="Payment due day"
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

                  <NumberInput
                    label="Lease duration"
                    value={form.leaseDurationMonths}
                    onChange={leaseDurationMonths =>
                      setForm(current => ({
                        ...current,
                        leaseDurationMonths,
                      }))
                    }
                    min={1}
                    units="months"
                    hasClear
                    isIntegerOnly
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                  />

                  <Selector
                    label="Payment frequency"
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

                  <Selector
                    label="Status"
                    value={form.status}
                    options={CONTRACT_STATUS_OPTIONS.map(status => ({
                      value: status,
                      label: CONTRACT_STATUS_META[status].label,
                    }))}
                    onChange={status =>
                      setForm(current => ({
                        ...current,
                        status: status as ContractStatus,
                      }))
                    }
                    isDisabled={isSubmitting}
                  />

                  <DateInput
                    label="Start date"
                    value={asISODateString(form.startDate)}
                    onChange={startDate =>
                      setForm(current => ({
                        ...current,
                        startDate: startDate ?? '',
                      }))
                    }
                    isRequired
                    hasClear
                    isDisabled={isSubmitting}
                  />

                  <DateInput
                    label="End date"
                    value={asISODateString(form.endDate)}
                    onChange={endDate =>
                      setForm(current => ({
                        ...current,
                        endDate: endDate ?? '',
                      }))
                    }
                    hasClear
                    isDisabled={isSubmitting}
                  />

                  <DateInput
                    label="Next payment"
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

                  <TextArea
                    label="Notes"
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
                </FormLayout>
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack gap={2} hAlign="end" wrap="wrap">
              <Button
                label="Cancel"
                variant="secondary"
                isDisabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              />
              <Button
                label="Create contract"
                type="submit"
                form={formId}
                variant="primary"
                isDisabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
