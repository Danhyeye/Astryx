import {type FormEvent, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';

import {useCreateCustomer} from '@/hooks/useCustomers';
import {
  buildCustomerPayload,
  createEmptyCustomerForm,
  isCustomerFormValid,
  isCustomerFormStepValid,
} from './entityForms';
import {EntityFormActions, EntityFormStepper} from './EntityFormStepper';

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

  return 'Vui lòng kiểm tra thông tin khách hàng và thử lại.';
}

export function CreateCustomerDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated?: (customerId: string) => void;
}) {
  const formId = 'create-customer-form';
  const [form, setForm] = useState(createEmptyCustomerForm);
  const [activeStep, setActiveStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createCustomer = useCreateCustomer();
  const isSubmitting = createCustomer.isPending;
  const isFormValid = isCustomerFormValid(form);

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      setForm(createEmptyCustomerForm());
      setActiveStep(0);
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
      const response = await createCustomer.mutateAsync(
        buildCustomerPayload(form),
      );
      const createdCustomer = response.data;

      if (createdCustomer?.id != null) {
        onCreated?.(createdCustomer.id);
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
            title="Thêm khách hàng"
            subtitle="Thêm thông tin khách hàng."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu tạo khách hàng">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể tạo khách hàng"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntityFormStepper
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                  steps={[
                    {
                      label: 'Danh tính',
                      content: <TextInput
                    label="Tên khách hàng"
                    value={form.name}
                    onChange={name =>
                      setForm(current => ({
                        ...current,
                        name,
                      }))
                    }
                    isRequired
                    hasAutoFocus
                    isDisabled={isSubmitting}
                    hasClear
                      />,
                    },
                    {
                      label: 'Liên hệ',
                      content: <>
                        <TextInput
                    label="Số điện thoại"
                    value={form.phone}
                    onChange={phone =>
                      setForm(current => ({
                        ...current,
                        phone,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
                        <TextInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={email =>
                      setForm(current => ({
                        ...current,
                        email,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
                      </>,
                    },
                    {
                      label: 'Địa chỉ và ghi chú',
                      content: <>
                        <TextInput
                    label="Địa chỉ"
                    value={form.address}
                    onChange={address =>
                      setForm(current => ({
                        ...current,
                        address,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
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
              isStepValid={isCustomerFormStepValid(form, activeStep)}
              isSubmitting={isSubmitting}
              onBack={() => setActiveStep(step => Math.max(0, step - 1))}
              onCancel={() => handleOpenChange(false)}
              onNext={() =>
                setActiveStep(step =>
                  isCustomerFormStepValid(form, step) ? step + 1 : step,
                )
              }
              submitLabel="Tạo khách hàng"
              stepCount={3}
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
