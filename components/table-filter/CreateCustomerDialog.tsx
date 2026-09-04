import {type FormEvent, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {
  HStack,
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
} from './entityForms';

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

  return 'Please check the customer details and try again.';
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
            title="Add new customer"
            subtitle="Create a customer record."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Create customer form">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Could not create customer"
                    description={submitError}
                    container="section"
                  />
                )}

                <FormLayout defaultOptionality="optional">
                  <TextInput
                    label="Customer name"
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
                  />

                  <TextInput
                    label="Phone"
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

                  <TextInput
                    label="Address"
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
                label="Create customer"
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
